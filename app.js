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
var codigoRoutes = require("./routes/codigo");

// Conexión a la base de datos
mongoose.connection.openUri("mongodb://localhost:27017/idacDB", (err, res) => {
	if (err) throw err;
	console.log("Base de datos: \x1b[32m%s\x1b[0m", "online");
});

// Conectamos los servicios
app.use("/", appRoutes);
app.use("/codigo", codigoRoutes);

// Escuchar Peticiones
app.listen(3000, () => {
	console.log("Express server puerto 3000: \x1b[32m%s\x1b[0m", "online");
});
