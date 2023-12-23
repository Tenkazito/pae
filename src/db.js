const mysql = require("mysql2/promise");

const conexion = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "pae"
});

//conexion.connect((error) => {
//    if (error) {
//        console.log("Error al conectarse: " + error);
//    } else {
//        console.log("!Conectado a base de datos!");
//    }
//})

module.exports = conexion;