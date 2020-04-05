var express = require("express");
var app = express();

var Codigo = require("../models/codigo");

/**
 * SERVICIO OBTENER CODIGOS
 *
 * Servicio que devuelve todos los códigos de iracing que están cargados en la base
 * de datos
 */

app.get("/", (req, res, next) => {
	Codigo.find({}, (err, codigos) => {
		if (err) {
			return res.status(500).json({
				ok: false,
				message:
					"Error cargando codigos de iracing de la base de datos",
				errors: err,
			});
		}
		res.status(200).json({
			ok: true,
			codigos,
		});
	});
});

/**
 * SERVICIO CREAR CODIGO
 *
 * Servicio que introduce un nuevo código de iracing en la base de datos
 *
 * Req.body.codigo: codigo a crear
 * Req.body.activo: propiedad opcional que indica si el usuario está activo o no
 */

app.post("/", (req, res) => {
	var body = req.body;
	codigoIntroducido = parseInt(body.codigo);
	activo = true;
	if (body.activo) {
		activo = body.activo;
	}
	/**
	 * Si el tamaño del codigo de iracing no es de 6 devolvemos
	 * un error indicandolo.
	 */
	if (!codigoIntroducido) {
		return res.status(400).json({
			ok: false,
			message: "Código introducido erroneo",
		});
	} else {
		if (codigoIntroducido.toString().length !== 6) {
			return res.status(400).json({
				ok: false,
				message: "El tamaño del código de iracing debe de ser de 6",
			});
		}
		// Tenemos el código validado
		var codigo = new Codigo({ codigo: codigoIntroducido, activo });
		codigo.save((err, codigoDB) => {
			if (err) {
				return res.status(400).json({
					ok: false,
					mensaje: "Error al crear código",
					errors: err,
				});
			}
			res.status(200).json({
				ok: true,
				codigo: codigoDB,
			});
		});
	}
});

/**
 * SERVICIO BUSCAR CODIGO
 *
 * Servicio que devuelve el codigo que coincida con el id introducido
 *
 * Req.body.codigo: codigo a buscar
 */

app.get("/buscarCodigo", (req, res) => {
	var body = req.body;
	codigoIntroducido = parseInt(body.codigo);
	/**
	 * Si el tamaño del codigo de iracing no es de 6 devolvemos
	 * un error indicandolo.
	 */
	if (!codigoIntroducido) {
		return res.status(400).json({
			ok: false,
			message: "Código introducido erroneo",
		});
	} else {
		if (codigoIntroducido.toString().length !== 6) {
			return res.status(400).json({
				ok: false,
				message: "El tamaño del código de iracing debe de ser de 6",
			});
		}
		// Tenemos el código validado
		Codigo.findOne({ codigo: codigoIntroducido }, (err, codigoDB) => {
			if (err) {
				return res.status(500).json({
					ok: false,
					mensaje: "Error al buscar el código",
					errors: err,
				});
			}
			//Si no viene un codigo
			if (!codigoDB) {
				return res.status(400).json({
					ok: false,
					mensaje: "El código " + codigoIntroducido + " no existe",
					errors: { message: "No existe un código con ese id" },
				});
			}
			res.status(200).json({
				ok: true,
				codigo: codigoDB,
			});
		});
	}
});

/**
 * SERVICIO BAJA LÓGICA CÓDIGO
 *
 * Servicio que da de baja un código poniendo su propiedad activo a false
 *
 * Req.body.codigo: codigo a dar de baja
 */

app.delete("/", (req, res) => {
	var body = req.body;
	codigoIntroducido = parseInt(body.codigo);

	/**
	 * Si el tamaño del codigo de iracing no es de 6 devolvemos
	 * un error indicandolo.
	 */
	if (!codigoIntroducido) {
		return res.status(400).json({
			ok: false,
			message: "Código introducido erroneo",
		});
	} else {
		if (codigoIntroducido.toString().length !== 6) {
			return res.status(400).json({
				ok: false,
				message: "El tamaño del código de iracing debe de ser de 6",
			});
		}
		// Tenemos el código validado
		// Buscamos ese código
		Codigo.findOne({ codigo: codigoIntroducido }, (err, codigoDB) => {
			if (err) {
				return res.status(500).json({
					ok: false,
					mensaje: "Error al buscar el código",
					errors: err,
				});
			}
			//Si no viene un codigo
			if (!codigoDB) {
				return res.status(400).json({
					ok: false,
					mensaje: "El código " + codigoIntroducido + " no existe",
					errors: { message: "No existe un código con ese id" },
				});
			}
			codigoDB.activo = false;
			//Guardamos el nuevo código inactivo
			codigoDB.save((err, codigoGuardado) => {
				if (err) {
					return res.status(500).json({
						ok: false,
						mensaje: "Error al guardar el código",
						errors: err,
					});
				}
				res.status(200).json({
					ok: true,
					codigo: codigoGuardado,
				});
			});
		});
	}
});


/**
 * SERVICIO ALTA LÓGICA CÓDIGO
 *
 * Servicio que da de alta un código poniendo su propiedad activo a true
 *
 * Req.body.codigo: codigo a dar de alta
 */

app.post("/activarCodigo", (req, res) => {
	var body = req.body;
	codigoIntroducido = parseInt(body.codigo);

	/**
	 * Si el tamaño del codigo de iracing no es de 6 devolvemos
	 * un error indicandolo.
	 */
	if (!codigoIntroducido) {
		return res.status(400).json({
			ok: false,
			message: "Código introducido erroneo",
		});
	} else {
		if (codigoIntroducido.toString().length !== 6) {
			return res.status(400).json({
				ok: false,
				message: "El tamaño del código de iracing debe de ser de 6",
			});
		}
		// Tenemos el código validado
		// Buscamos ese código
		Codigo.findOne({ codigo: codigoIntroducido }, (err, codigoDB) => {
			if (err) {
				return res.status(500).json({
					ok: false,
					mensaje: "Error al buscar el código",
					errors: err,
				});
			}
			//Si no viene un codigo
			if (!codigoDB) {
				return res.status(400).json({
					ok: false,
					mensaje: "El código " + codigoIntroducido + " no existe",
					errors: { message: "No existe un código con ese id" },
				});
			}
			codigoDB.activo = true;
			//Guardamos el nuevo código inactivo
			codigoDB.save((err, codigoGuardado) => {
				if (err) {
					return res.status(500).json({
						ok: false,
						mensaje: "Error al guardar el código",
						errors: err,
					});
				}
				res.status(200).json({
					ok: true,
					codigo: codigoGuardado,
				});
			});
		});
	}
});

module.exports = app;
