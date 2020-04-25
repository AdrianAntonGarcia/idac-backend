var express = require("express");

var app = express();
var jwt = require("jsonwebtoken");
var SEED = require("../config/config").SEED;
// Modelos
var Usuario = require("../models/usuario");
var TokenEmail = require("../models/tokenEmail");

/**
 * Servicio que econfirma el usuario con el token que le enviamos al email
 */

app.get("/confirmacion/:token", (req, res) => {
	var token = req.params["token"];
	token = decodeURIComponent(token);

	/**
	 * Verificamos el token que nos llega
	 */
	jwt.verify(token, SEED, (err, usuario) => {
		if (err) {
			// 401: Unauthorized
			return res.status(401).json({
				ok: false,
				message: "Token incorrecto",
				errors: err,
			});
		}
		TokenEmail.findOne({ token: token }, (err, tokenDB) => {
			if (err) {
				// 401: Unauthorized
				return res.status(500).json({
					ok: false,
					message: "Error buscando token servidor",
					errors: err,
				});
			}
			if (!tokenDB) {
				// 401: Unauthorized
				return res.status(401).json({
					ok: false,
					message: "No verificado, token no encontrado",
				});
			}
			/**
			 * Una vez tenemos el token, buscamos el usuario de ese token y lo activamos
			 */
			console.log(tokenDB._userId);
			Usuario.findOne({ _id: tokenDB._userId }, (err, usuarioDB) => {
				if (err) {
					// 401: Unauthorized
					return res.status(500).json({
						ok: false,
						message:
							"Error buscando usuario del token servidor, reintente la activación",
						errors: err,
					});
				}
				if (!usuarioDB) {
					// 401: Unauthorized
					return res.status(401).json({
						ok: false,
						message:
							"No verificado, usuario no encontrado para ese token, reintente la activación",
					});
				}
				//Activamos el usuario
				usuarioDB.activo = true;
				usuarioDB.save(async (err) => {
					if (err) {
						// 401: Unauthorized
						return res.status(500).json({
							ok: false,
							message:
								"Error guardando usuario activo, reintente la activación",
							errors: err,
						});
					}
					// TokenEmail.find({_id: tokenDB._id}).remove().exec();
					// res.status(200).json({
					// 	ok: true,
					// 	message: `Usuario ${usuarioDB.email} activado`
					// });
					res.status(200).send(
						"La cuenta ha sido activada, por favor logueate: <a href='http://localhost:4200/login'>Login</a>"
					);
				});
			});
		});
	});
});

module.exports = app;
