var express = require("express");

var app = express();
var bcrypt = require("bcrypt");
var nodemailer = require("nodemailer");
const sgMail = require("@sendgrid/mail");
var jwt = require("jsonwebtoken");

var SEED = require("../config/config").SEED;

// Modelos
var Usuario = require("../models/usuario");
var TokenEmail = require("../models/tokenEmail");

// Middleware

var mdAutenticacion = require("../middlewares/autenticacion");

//Variables de entorno



sgMail.setApiKey(process.env.SENDGRID_API_KEY); 

/**
 * Función que envía un correo electrónico para que reestablezca la contraseña
 */

app.post("/recover", (req, res) => {
	var body = req.body;
	email = body.email;

	if (!email) {
		return res.status(400).json({
			ok: false,
			message: "Debe introducir un email",
		});
	}
	// Comprobamos que sea un email correcto
	const emailRegexp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
	if (!emailRegexp.test(email)) {
		return res.status(400).json({
			ok: false,
			message: "Debe introducir un email válido",
		});
	}
	Usuario.findOne({ email: email }, (err, usuarioDB) => {
		if (err) {
			return res.status(500).json({
				ok: false,
				message: "Error interno",
				errors: {
					message: "Error interno",
					err,
				},
			});
		}
		if (!usuarioDB) {
			return res.status(400).json({
				ok: false,
				message: "No se ha encontrado un usuario con ese email",
				errors: {
					message: "No se ha encontrado un usuario con ese email",
					err,
				},
			});
		}
		// Ya tenemos un usuario con ese email. Hay que enviarle el email
		// Generamos el token de ese email
		var token = jwt.sign({ usuario: usuarioDB }, SEED, {
			expiresIn: 43200,
		});

		var tokenEmail = new TokenEmail({
			_userId: usuarioDB._id,
			token: token,
		});

		tokenEmail.save((err, tokenEmailGuardado) => {
			if (err) {
				return res.status(500).json({
					ok: false,
					message: "Error al guardar token del email",
					errors: err,
				});
			}
			/**
			 * Una vez tenemos el token creamos el email y lo envíamos
			 */
			console.log('proccess.env.IDACGMAIL',proccess.env.IDACGMAIL);
			var transporter = nodemailer.createTransport({
				service: "gmail",
				auth: {
					user: process.env.IDACGMAIL,
					pass: process.env.PASSGMAIL,
				},
			});
			var mailOptions = {
				from: process.env.IDACGMAIL,
				to: usuarioDB.email,
				subject: "Cambio de contraseña IDAC",
				text:
					"Hola,\n\n" +
					"Recupera tu contraseña haciendo click en en: \nhttp://" +
					"localhost:4200" +
					"/changePass/" +
					encodeURIComponent(tokenEmailGuardado.token) +
					".\n",
			};
			transporter.sendMail(mailOptions, (err, info) => {
				if (err) {
					return res.status(500).json({
						ok: false,
						message:
							"Error al enviar el email recuperar contraseña",
						errors: err,
					});
				}
				return res.status(201).json({
					ok: true,
					message:
						"Se ha enviado un correo de confirmación a " +
						usuarioDB.email,
				});
			});
		});
	});
});

/**
 * Servicio que genera un nuevo token de validación y reenvia el email
 * de activación de usuario si la cuenta no esta activa.
 */

app.post("/resendEmail", (req, res) => {
	var body = req.body;
	email = body.email;

	if (!email) {
		return res.status(401).json({
			ok: false,
			message: "Debe introducir un email",
		});
	}
	// Comprobamos que sea un email correcto
	const emailRegexp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
	if (!emailRegexp.test(email)) {
		return res.status(400).json({
			ok: false,
			message: "Debe introducir un email válido",
		});
	}
	Usuario.findOne({ email: email }, (err, usuarioDB) => {
		if (err) {
			return res.status(500).json({
				ok: false,
				message: "Error interno",
				errors: {
					message: "Error interno",
					err,
				},
			});
		}
		if (!usuarioDB) {
			return res.status(400).json({
				ok: false,
				message: "No se ha encontrado un usuario con ese email",
				errors: {
					message: "No se ha encontrado un usuario con ese email",
					err,
				},
			});
		}

		/**
		 * Si el usuario ya esta activo no tenemos que enviar el email.
		 */

		if (usuarioDB.activo) {
			return res.status(400).json({
				ok: false,
				message: "El usuario ya está activo",
				errors: {
					message: "El usuario ya está activo",
					err,
				},
			});
		}

		// Ya tenemos un usuario con ese email. Hay que enviarle el email
		// Generamos el token de ese email
		var token = jwt.sign({ usuario: usuarioDB }, SEED, {
			expiresIn: 43200,
		});

		var tokenEmail = new TokenEmail({
			_userId: usuarioDB._id,
			token: token,
		});

		tokenEmail.save((err, tokenEmailGuardado) => {
			if (err) {
				return res.status(500).json({
					ok: false,
					message: "Error al crear token del email",
					errors: err,
				});
			}
			
			/**
			 * Creamos el email y lo enviamos
			 */
			console.log('proccess.env.IDACGMAIL',process.env.IDACGMAIL);
			console.log('proccess.env.PASSGMAIL',process.env.PASSGMAIL);
			console.log(process.env);
			console.log('proccess.env.SENDGRID_API_KEY',process.env.SENDGRID_API_KEY);

			var transporter = nodemailer.createTransport({
				service: "gmail",
				auth: {
					user: process.env.IDACGMAIL,
					pass: process.env.PASSGMAIL,
				},
			});

			var mailOptions = {
				from: process.env.IDACGMAIL,
				to: usuarioDB.email,
				subject: "Verificación de correo IDAC",
				text:
					"Hola,\n\n" +
					"Verifica tu cuenta en la web de IDAC haciendo click en: \nhttp://" +
					req.headers.host +
					"/verificacion/confirmacion/" +
					encodeURIComponent(tokenEmailGuardado.token) +
					".\n",
			};
			transporter.sendMail(mailOptions, (err, info) => {
				if (err) {
					return res.status(500).json({
						ok: false,
						message:
							"Error al enviar el email validar contraseña",
						errors: err,
					});
				}
				
				usuarioDB.password = ":D";
				res.status(200).json({
					ok: true,
					usuario: usuarioDB,
					message:
						"Se ha enviado un correo de confirmación a " +
						usuarioDB.email,
					info,
				});
				
			});
		});
	});
});

/**
 * Servicio con el cuál podemos cambiar el password de un usuario
 */

app.post("/changePass", mdAutenticacion.verificaToken, (req, res) => {
	var body = req.body;
	email = body.email;
	password = body.password;

	Usuario.findOne({ email: email }, (err, usuarioDB) => {
		/**
		 * Si hay errores salimos devolviendo el error
		 */
		if (err) {
			return res.status(500).json({
				ok: false,
				message:
					"Error interno al buscar usuario para cambiar password",
				errors: err,
			});
		}
		if (!usuarioDB) {
			return res.status(400).json({
				ok: false,
				message: "No existe un usuario con ese email",
				errors: { message: "No existe un usuario con ese email" },
			});
		}
		usuarioDB.password = bcrypt.hashSync(password, 10);

		usuarioDB.save((err, userGuardado) => {
			/**
			 * Si hay errores salimos devolviendo el error
			 */
			if (err) {
				return res.status(500).json({
					ok: false,
					message:
						"Error interno al guardar usuario para cambiar password",
					errors: err,
				});
			}
			userGuardado.password = ":D";
			return res.status(200).json({
				ok: true,
				userGuardado,
			});
		});
	});
});

/**
 * Servicio que comprueba que el token de recuperación de contraseña sea correcto
 */

app.get("/checkToken/:token", (req, res) => {
	var token = req.params["token"];
	token = decodeURIComponent(token);
	jwt.verify(token, SEED, (err, usuario) => {
		if (err) {
			// 401: Unauthorized
			return res.status(401).json({
				ok: false,
				message: "Token incorrecto",
				errors: err,
			});
		}
		usuario.usuario.password = ":D";
		return res.status(201).json({
			ok: true,
			message: "Token correcto ",
			usuario: usuario.usuario,
		});
	});
});

module.exports = app;
