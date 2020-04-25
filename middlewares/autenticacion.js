var jwt = require("jsonwebtoken");
var SEED = require("../config/config").SEED;

/**
 * MIDDLEWARE VERIFICAR TOKEN
 *
 * Middleware que verifica que el token del usuario que está intentando acceder
 * al servicio es válido
 */

exports.verificaToken = function (req, res, next) {
	try {
		var token = req.query.token;

		jwt.verify(token, SEED, (err, decoded) => {
			if (err) {
				// 401: Unauthorized
				return res.status(401).json({
					ok: false,
					message: "Token incorrecto",
					errors: err,
				});
			}
			/**
			 * Modificamos la rquest y le añadimos el payload que viene
			 * de la verificación del jwt, que contiene el usuario.
			 */
			req.usuario = decoded.usuario;
			next();
		});
	} catch (error) {
		return res.status(500).json({
			ok: false,
			error,
		});
	}
};
