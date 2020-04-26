// Requires
var express = require("express");
var mongoose = require("mongoose");
//Quitamos los deprecated
mongoose.set("useCreateIndex", true);
mongoose.set("useNewUrlParser", true);
mongoose.set("useUnifiedTopology", true);

var bodyParser = require("body-parser");

// Inicializar variables
var app = express();
const dotenv = require("dotenv");
dotenv.config();

/**
 * CORS
 */
app.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
	res.header(
		"Access-Control-Allow-Headers",
		"Origin, X-Requested-With, Content-Type, Accept"
	);
	res.header(
		"Access-Control-Allow-Methods",
		"POST, GET, PUT, DELETE, OPTIONS"
	);
	next();
});
//Body Parser
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

/**Importar rutas */
var appRoutes = require("./routes/app");
var codigoRoutes = require("./routes/codigo").app;
var usuarioRoutes = require("./routes/usuario").app;
var loginRoutes = require("./routes/login");
var emailVerificationRoutes = require("./routes/emailVerification");
var recoverPasswordRoutes = require("./routes/recoverPassword");

// Conexión a la base de datos

mongoose.connection.openUri(process.env.MONGO_URI, (err, res) => {
	if (err) throw err;
	console.log("Base de datos: \x1b[32m%s\x1b[0m", "online");
});

// Conectamos los servicios
app.use("/", appRoutes);
app.use("/codigo", codigoRoutes);
app.use("/usuario", usuarioRoutes);
app.use("/login", loginRoutes);
app.use("/verificacion", emailVerificationRoutes);
app.use("/recover", recoverPasswordRoutes);

// Escuchar Peticiones
var puerto = process.env.PORT || 3000;
app.listen(puerto, () => {
	console.log(
		"Express server puerto " + puerto + ": \x1b[32m%s\x1b[0m",
		"online"
	);
});
