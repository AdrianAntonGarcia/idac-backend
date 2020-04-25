//Linrerías
var express = require("express");
var bcrypt = require("bcrypt");
var app = express();
var nodemailer = require("nodemailer");
const sgMail = require("@sendgrid/mail");
var jwt = require("jsonwebtoken");
var SEED = require("../config/config").SEED;

// Modelos
var Usuario = require("../models/usuario");
var Codigo = require("../models/codigo");
var TokenEmail = require("../models/tokenEmail");

// Funciones
var buscarCodigo = require("./codigo").buscarCodigo;
var guardarCodigo = require("./codigo").guardarCodigo;

//Middlewares
var mdAutenticacion = require("../middlewares/autenticacion");

//Variables de entorno

var envJSON = require("../env.variables.json");

var node_env = process.env.NODE_ENV || "development";
var TodasMisVariablesDeEntorno = envJSON[node_env];

sgMail.setApiKey(TodasMisVariablesDeEntorno.SENDGRID_API_KEY);

/**
 * SERVICIO CREAR USUARIO
 *
 * Servicio que da de alta un usuario en la base de datos. Lo primero
 * que hace es comprobar si ese codigo de usuario existe en la base de datos,
 * si existe intenta crear el usuario.
 *
 * Req.body.codigo:
 * Req.body.nombre:
 * Req.body.email:
 * Req.body.password:
 */

app.post("/", (req, res) => {
	var body = req.body;
	codigo = body.codigo;
	nombre = body.nombre;
	email = body.email;
	password = body.password;
	google = false;
	crearUsuario(nombre, email, password, codigo, google, res, req);
});

/**
 * Funcion crearUsuario
 *
 * Función que registra un usuario en la base de datos
 * @param {*} nombre nombre del usuario
 * @param {*} email email del usuario
 * @param {*} password contraseña del usuario
 * @param {*} codigo codigo del usuario
 * @param {*} google indica si es usuario de google o no
 * @param {*} res response de la petición, donde devolvemos el usuario creado o los errores
 * @param {*} codigo el código validado con el que se va a crear el usuario
 */

function crearUsuario(nombre, email, password, codigo, google, res, req) {
	//Comprobamos que se haya introducido un código
	if (!codigo) {
		return res.status(400).json({
			ok: false,
			message: "Código introducido erroneo",
		});
	} else {
		// Comprobamos el tamaño del código
		if (codigo.toString().length !== 6) {
			return res.status(400).json({
				ok: false,
				message: "El tamaño del código de iracing debe de ser de 6",
			});
		}
		// Tenemos el código validado, lo buscamos en la base de datos
		Codigo.findOne({ codigo: codigo }, (err, codigoDB) => {
			if (err) {
				return res.status(500).json({
					ok: false,
					message: "Error al buscar el código",
					errors: err,
				});
			}
			//Si no viene un codigo
			if (!codigoDB) {
				return res.status(400).json({
					ok: false,
					message: "El código " + codigo + " no existe",
					errors: { message: "No existe un código con ese id" },
				});
			}
			// Hay que comprobar que el código este activo

			if (codigoDB.activo === true) {
				// Procedemos a generar el usuario con ese código
				if (password === undefined) {
					return res.status(400).json({
						ok: false,
						message: "Contraseña no introducida",
						errors: {
							message: "No se ha introducido una contraseña",
						},
					});
				}
				var usuario = new Usuario({
					nombre: nombre,
					email: email,
					password: bcrypt.hashSync(password, 10),
					google,
					cod_iracing: codigoDB._id,
				});

				usuario.save((err, usuarioGuardado) => {
					if (err) {
						return res.status(500).json({
							ok: false,
							message: "Error al crear usuario",
							errors: err,
						});
					}
					/**
					 * Una vez creado el usuario hay que enviarle el email de confirmación
					 */
					usuarioGuardado.password = ":D";
					var token = jwt.sign({ usuario: usuarioGuardado }, SEED, {
						expiresIn: 43200,
					});
					// var token = bcrypt.hashSync(
					// 	usuarioGuardado._id.toString(),
					// 	10
					// );

					var tokenEmail = new TokenEmail({
						_userId: usuarioGuardado._id,
						token: token,
					});

					/**
					 * Guardamos el token de verificación
					 */

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
						var transporter = nodemailer.createTransport({
							service: "gmail",
							auth: {
								user: TodasMisVariablesDeEntorno.IDACGMAIL,
								pass: TodasMisVariablesDeEntorno.PASSGMAIL,
							},
						});

						var mailOptions = {
							from: TodasMisVariablesDeEntorno.IDACGMAIL,
							to: usuarioGuardado.email,
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
							usuarioGuardado.password = ":D";
							res.status(201).json({
								ok: true,
								usuario: usuarioGuardado,
								message:
									"Se ha enviado un correo de confirmación a " +
									usuarioGuardado.email,
								info,
							});
						});
					});
				});
			} else {
				return res.status(400).json({
					ok: false,
					message: "El código " + codigo + " no esta activo",
					errors: {
						message:
							"El código introducido no está activo, hable con el staff.",
					},
				});
			}
		});
	}
}

/**
 * SERVICIO ACTUALIZAR USUARIO
 *
 * Servicio que actualiza un usuario de la base de datos pasado su id
 *
 * req.params.id: El id del usuario a actualizar
 */

app.put("/:id", [mdAutenticacion.verificaToken], (req, res) => {
	try {
		var id = req.params.id;
		var body = req.body;

		Usuario.findById(id, (err, usuario) => {
			if (err) {
				return res.status(500).json({
					ok: false,
					mensaje: "Error al buscar usuario",
					errors: err,
				});
			}
			//Si no viene un usuario
			if (!usuario) {
				return res.status(400).json({
					ok: false,
					mensaje: "El usuario con el id " + id + " no existe",
					errors: { message: "No existe un usuario con ese id" },
				});
			}

			usuario.nombre = body.nombre || usuario.nombre;
			usuario.email = body.email || usuario.email;
			usuario.role = body.role || usuario.role;
			usuario.img = body.img || usuario.img;
			usuario.setup_pure = body.setup_pure || usuario.setup_pure;
			usuario.setup_vrs = body.setup_vrs || usuario.setup_vrs;
			usuario.setup_craig = body.setup_craig || usuario.setup_craig;

			usuario.save((err, usuarioGuardado) => {
				if (err) {
					return res.status(400).json({
						ok: false,
						mensaje: "Error al modificar el usuario",
						errors: err,
					});
				}
				//Ocultamos la contraseña
				usuarioGuardado.password = ":)";
				res.status(200).json({
					ok: true,
					usuario: usuarioGuardado,
				});
			});
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			error,
		});
	}
});

/**
 * SERVICIO OBTENER USUARIOS
 *
 * Servicio para obtener un listado de todos los usuarios registrados en la
 * base de datos
 */

app.get("/", [mdAutenticacion.verificaToken], (req, res) => {
	try {
		Usuario.find(
			{},
			"nombre email role cod_iracing google img setup_pure setup_vrs setup_craig activo"
		)
			.populate("cod_iracing")
			.exec((err, usuarios) => {
				if (err) {
					return res.status(500).json({
						ok: false,
						message: "Error cargando usuarios",
						errors: err,
					});
				}
				Usuario.count({}, (err, conteo) => {
					if (err) {
						return res.status(500).json({
							ok: false,
							message: "Error contando usuarios",
							errors: err,
						});
					}
					res.status(200).json({
						ok: true,
						usuarios,
						total: conteo,
					});
				});
			});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			error,
		});
	}
});

/**
 * SERVICIO BORRAR USUARIO
 *
 * Servicio para dar de baja un usuario en la base de datosç
 *
 * req.params.id: El id del usuario a dar de baja
 */

app.delete("/:id", [mdAutenticacion.verificaToken], async (req, res) => {
	try {
		var id = req.params.id;

		//Buscamos el usuario por id

		Usuario.findById(id, (err, usuarioDB) => {
			/**
			 * Si hay errores salimos devolviendo el error
			 */
			if (err) {
				return res.status(500).json({
					ok: false,
					message: "Error al borrar usuario",
					errors: err,
				});
			}
			if (!usuarioDB) {
				return res.status(400).json({
					ok: false,
					message: "No existe un usuario con ese id",
					errors: { message: "No existe un usuario con ese id" },
				});
			}
			// Ponemos la propiedad activo del usuario a false
			usuarioDB.activo = false;

			// Guardamos el usuario como borrado
			usuarioDB.save(async (err, usuarioBorrado) => {
				// Si hay algun error salimos
				if (err) {
					return res.status(500).json({
						ok: false,
						mensaje: "Error al borrar usuario",
						errors: err,
					});
				}
				// Si el guardado ha sido correcto, ponemos de baja su código
				codigoIntroducido = usuarioBorrado.cod_iracing._id;
				try {
					// Buscamos su código
					var codigo = await buscarCodigo(codigoIntroducido);
					codigo.activo = false;
					//Si existe lo ponemos a false
					if (codigo) {
						var codigoGuardado = await guardarCodigo(codigo);

						if (codigoGuardado) {
							// Rellenamos el usuario borrado
							usuarioBorrado = await Usuario.populate(
								usuarioBorrado,
								"cod_iracing"
							);
							//Ocultamos la contraseña
							usuarioBorrado.password = ":)";
							res.status(200).json({
								ok: true,
								usuarioBorrado,
							});
						}
					} else {
						res.status(400).json({
							ok: false,
							mensaje:
								"El código " + codigoIntroducido + " no existe",
							errors: {
								message: "No existe un código con ese id",
							},
						});
					}
				} catch (error) {
					res.status(500).json({
						ok: false,
						error,
					});
				}
			});
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			error,
		});
	}
});

/**
 * SERVICIO RENOVAR USUARIO
 *
 * Servicio para volver a activar un usuario en la base de datos, primero da de baja
 * el usuario y luego su código
 *
 * req.params.id: El id del usuario a renovar
 */

app.post("/activar/:id", [mdAutenticacion.verificaToken], async (req, res) => {
	try {
		var id = req.params.id;

		//Buscamos el usuario por id

		Usuario.findById(id, (err, usuarioDB) => {
			/**
			 * Si hay errores salimos devolviendo el error
			 */
			if (err) {
				return res.status(500).json({
					ok: false,
					message: "Error al borrar usuario",
					errors: err,
				});
			}
			if (!usuarioDB) {
				return res.status(400).json({
					ok: false,
					message: "No existe un usuario con ese id",
					errors: { message: "No existe un usuario con ese id" },
				});
			}
			// Ponemos la propiedad activo del usuario a false
			usuarioDB.activo = true;

			// Guardamos el usuario como borrado
			usuarioDB.save(async (err, usuarioRenovado) => {
				// Si hay algun error salimos
				if (err) {
					return res.status(500).json({
						ok: false,
						mensaje: "Error al borrar usuario",
						errors: err,
					});
				}
				// Si el guardado ha sido correcto, ponemos de alta su código
				codigoIntroducido = usuarioRenovado.cod_iracing._id;
				try {
					// Buscamos su código
					var codigo = await buscarCodigo(codigoIntroducido);
					codigo.activo = true;
					//Si existe lo ponemos a false
					if (codigo) {
						var codigoGuardado = await guardarCodigo(codigo);
						if (codigoGuardado) {
							// Rellenamos el usuario borrado
							usuarioRenovado = await Usuario.populate(
								usuarioRenovado,
								"cod_iracing"
							);
							//Ocultamos la contraseña
							usuarioRenovado.password = ":)";
							res.status(200).json({
								ok: true,
								usuarioRenovado,
							});
						}
					} else {
						res.status(400).json({
							ok: false,
							mensaje:
								"El código " + codigoIntroducido + " no existe",
							errors: {
								message: "No existe un código con ese id",
							},
						});
					}
				} catch (error) {
					res.status(500).json({
						ok: false,
						error,
					});
				}
			});
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			error,
		});
	}
});

module.exports = { app, crearUsuario };
