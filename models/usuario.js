var mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");

var Schema = mongoose.Schema;

var rolesValidos = {
	values: ["ADMIN_ROLE", "STAFF_ROLE", "PILOTO_ROLE", "CLUB_ROLE"],
	message: "{VALUE} no es un rol permitido",
};

var usuarioSchema = new Schema({
	nombre: {
		type: String,
		required: [true, "El nombre del piloto es necesario"],
	},
	email: {
		type: String,
		unique: [true, "El email introducido ya ha sido utilizado"],
		required: [true, "El correo es necesario"],
	},
	password: {
		type: String,
		required: [true, "La contraseña es necesaria"],
	},
	role: {
		type: String,
		required: true,
		default: "CLUB_ROLE",
		enum: rolesValidos,
	},
	cod_iracing: {
		type: Schema.Types.ObjectId,
		ref: "Codigo",
		required: [true, "El código de piloto de iracing es necesario"],
		unique: [
			true,
			"El código de iracing ya se ha introducido en otra cuenta",
		],
	},
	google: {
		type: Boolean,
		default: false,
	},
	img: {
		type: String,
		default: '',
	},
	setup_pure: {
		type: Boolean,
		default: false,
	},
	setup_vrs: {
		type: Boolean,
		default: false,
	},
	setup_craig: {
		type: Boolean,
		default: false,
	},
	activo: {
		type: Boolean,
		required: true,
		default: false,
	},
	passwordResetToken:{
		type: String,
		default: ''
	},
	passwordResetExpires:{
		type: Date,
		default: new Date('12/12/2099')
	}
});

usuarioSchema.plugin(uniqueValidator, { message: "{PATH} debe de ser único" });

module.exports = mongoose.model("Usuario", usuarioSchema);
