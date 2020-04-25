var express = require("express");
var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");

var app = express();
var Usuario = require("../models/usuario");

var SEED = require("../config/config").SEED;

/**
 * SERVICIO LOGIN NORMAL
 *
 * Servicio que hace el login del usuario y si va correcto devuelve el usuario con el token
 * asociado.
 *
 * body.email: email del usuario
 * body.password: contraseña del usuario
 */

app.post("/", (req, res) => {
	// Buscamos el usuario por su email

	try {
		var body = req.body;
		Usuario.findOne({ email: body.email }, async (err, usuarioDB) => {
			// Error interno
			if (err) {
				return res.status(500).json({
					ok: false,
					message: "Error interno al buscar el usuario en el login",
					errors: err,
				});
			}
			// Si no ha encontrado usuario con ese emal
			if (!usuarioDB) {
				return res.status(500).json({
					ok: false,
					message: "Credenciales incorrectas"
				});
			}
			// Comprobamos la contraseña
			if (!bcrypt.compareSync(body.password, usuarioDB.password)) {
				return res.status(500).json({
					ok: false,
					message: "Credenciales incorrectas"
				});
			}
			// Comprobamos que este activo

			if (!usuarioDB.activo){
				
				return res.status(500).json({
					ok: false,
					message: "Tu cuenta no se ha activado todavía, revisa el email de confirmación."
				});
			}

			/**
			 * Crear el token,
			 * El primer parámetro (payload) es lo que nos va a devolver el jwt más adelante cuando
			 * verfiquemos los token, el segundo parámetro es la semilla para codificar
			 * y el tercero el tiempo de expiración del token.
			 */

			var token = jwt.sign({ usuario: usuarioDB }, SEED, {
				expiresIn: 14400,
			}); // 4 horas

			// Rellenamos el usuario recuperado
			usuarioDB = await Usuario.populate(usuarioDB, "cod_iracing");
			//Ocultamos la contraseña
			usuarioDB.password = ":P";

			/**
			 * Devolvemos la info del usuario con su token
			 */
			res.status(200).json({
				ok: true,
				usuario: usuarioDB,
				token: token,
				id: usuarioDB._id,
			});
		});
	} catch (error) {
		Console.log(error);
		return res.status(500).json({
			ok: false,
			error: {
				message: "Error interno servidor",
				error,
			},
		});
	}
});

module.exports = app;
