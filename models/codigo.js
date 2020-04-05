var mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");

var Schema = mongoose.Schema;

var codigoSchema = new Schema({
	codigo: {
		type: Number,
		required: [true, "El código es necesario"],
		unique: [true, "El código de iracing ya se ha introducido"],
		min: 000000,
		max: 999999,
	},
	activo:{
		type: Boolean,
		required: true,
		default: true
	}
});

codigoSchema.plugin(uniqueValidator, { message: '{PATH} debe de ser único' });

module.exports = mongoose.model('Codigo', codigoSchema);
