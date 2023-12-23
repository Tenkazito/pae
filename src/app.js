// Require
const express = require("express");
const app = express();
const morgan = require("morgan");
const path = require("path");
const moment = require("moment");

//Config
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

//Middlewares
app.use(morgan("dev"));
app.use(express.urlencoded());
app.use(express.json());
app.use(express.static("public"));

// Base de datos
const conexion = require("./db.js");
const { error } = require("console");

//Routes
app.get("/", (req, res) => {
    res.redirect("/login");
}); 

//---------------------------
//          LOGIN
// --------------------------

app.get("/login", (req, res) => {
    res.render("index");
});

app.post("/login", async (req, res) => {
    
    const db = await conexion;

    try {
        var [consulta1] = await db.query('SELECT * FROM superusuario WHERE nombre_super = ? AND documento_super = ?;', [req.body.usuario, req.body.identificacion]);
        if (consulta1.length > 0) {
            console.log(req.body.usuario + " ha accedido al sistema.");
            return res.redirect("/pp");
        } else {
            return res.render("index", {msg: "Usuario y/o identificacion incorrectas."});
        }
    } catch (error) {
        console.log("Ha ocurrido un error: " + error);
        return res.render("index", {msg: "Ha ocurrido un error."});
    }
});

//---------------------------
//          Pagina principal
// --------------------------

app.get("/pp", (req, res) => {
    res.render("pp");
});

//---------------------------
//          Registro
// --------------------------

app.get("/registro", (req, res) => {
    res.render("registro.ejs");
});

app.post("/registro", async (req, res) => {
    try {
        const db = await conexion;

        var [consulta1] = await db.query('SELECT * FROM estudiante WHERE documento_estudiante = ? AND estado = "activo"', [req.body.documento]);
        if (consulta1.length > 0) {
            return res.render("registro", {msg: "Ya existe un estudiante activo con este documento."});
        }

        var [consulta2] = await db.query('UPDATE estudiante SET estado = "activo" WHERE documento_estudiante = ? AND estado = "inactivo";', [req.body.documento]);
        if (consulta2.affectedRows > 0) {
            return res.render("registro", {msg: "Un estudiante con este documento ya existia, se ha vuelto a activar."});
        }

        await db.query('INSERT INTO estudiante VALUES(?,?,?,"activo");', [req.body.nombre, req.body.documento, req.body.grupo]);
        console.log("Usuario " + req.body.nombre + " registrado.");
        return res.render("registro", {msg: "Usuario registrado correctamente."});
    } catch (error) {
        console.error("Error: " + error);
        return res.render("registro", {msg: "Ha ocurrido un error."});
    }
});

//---------------------------
//        Validar Asistencia
// --------------------------

app.get("/ValidarAsistencia", (req, res) => {
    res.render("ValidarAsistencia.ejs");
});

app.post("/ValidarAsistencia", async (req, res) => {
    try {
        const date = new Date();
        const hoy = date.toISOString().substring(0, 10);
        const db = await conexion;
        
        var [consulta1] = await db.query('SELECT * FROM estudiante WHERE documento_estudiante = ? AND estado = ?', [req.body.documento, 'activo']);
        if (consulta1.length < 1) {
          return res.render("ValidarAsistencia", {msg: "Estudiante no registrado o inactivo."});
        }
        
        var [consulta2] = await db.query('SELECT fecha FROM entregas WHERE documento_estudiante = ? AND fecha = ?', [req.body.documento, hoy]);
        if (consulta2.length > 0) {
            return res.render("ValidarAsistencia", {msg: "Este estudiante ya ha recibido PAE hoy."});
        } else {
            await db.query('INSERT INTO entregas VALUES(null, ?, ?)', [req.body.documento, hoy]);
            return res.render("ValidarAsistencia", {msg: "Puede recibir PAE."});
        }

    } catch (error) {
        console.error("Error: " + error);
        return res.render("ValidarAsistencia", {msg: "Ha ocurrido un error."});
    }
});

//---------------------------
//       Generar Reporte
// --------------------------

app.get("/GenerarReporte", async (req, res) => {
    try {
        const db = await conexion;

        var [nombres] = await db.query('SELECT nombre_estudiante, grupo, documento_estudiante FROM estudiante WHERE estado = "activo" ORDER BY nombre_estudiante ASC;');
        if (nombres.length < 1) {
            return res.render("GenerarReporte", {msg: "No hay ningun estudiante registrado."})
        }
        var largo = nombres.length;
        return res.render("GenerarReporte", {nombres: nombres, largo: largo});
    } catch (error) {
        console.log("Error: " + error);
        return res.render("GenerarReporte", {msg: "Ha ocurrido un error."});
    }
});

app.post("/GenerarReporte", async (req, res) => {
    try {
        const dia = req.body.dia;
        const mes = req.body.mes;
        const año = req.body.año;
        const db = await conexion;

        let query = 'SELECT estudiante.nombre_estudiante, COUNT(*) AS cantidad, estudiante.documento_estudiante FROM entregas INNER JOIN estudiante ON entregas.documento_estudiante = estudiante.documento_estudiante WHERE ';

        const conditions = [];

        if (dia !== "no") {
            conditions.push(`DAY(fecha) = ${dia}`);
        }

        if (mes !== "no") {
            conditions.push(`MONTH(fecha) = ${mes}`);
        }

        if (año !== "no") {
            conditions.push(`YEAR(fecha) = ${año}`);
        }

        if (conditions.length === 0) {
            return res.render("GenerarReporte", { msg: "Debe seleccionar fechas para poder filtrar." });
        }

        query += conditions.join(" AND ");
        query += ' GROUP BY estudiante.nombre_estudiante';

        const [consulta] = await db.query(query);
        const cuando = "Fecha de búsqueda: " + (dia !== "no" ? `Día: ${dia} ` : "") + (mes !== "no" ? `Mes: ${mes} ` : "") + (año !== "no" ? `Año: ${año}` : "");
        const largo = consulta.length;

        return res.render("GenerarReporte", { results: consulta, largo: largo, cuando: cuando });

    } catch (error) {
        console.log("Error: " + error);
        return res.render("GenerarReporte", { msg: "Ha ocurrido un error." });
    }
});


//---------------------------
//          Eliminar Usuario
// --------------------------

app.get("/EliminarUsuario", (req, res) => {
    res.render("Eliminar.ejs");
});

app.post("/EliminarUsuario", async (req, res) => {
    try {
        const db = await conexion;

        var [consulta] = await db.query('SELECT * FROM estudiante WHERE documento_estudiante = ?;', [req.body.documento]);
        if (consulta.length < 1) {
            return res.render("Eliminar", {msg: "No se ha encontrado el estudiante"});
        }

        await db.query('UPDATE estudiante SET estado = "inactivo" WHERE documento_estudiante = ?;', [req.body.documento]);
        return res.render("Eliminar", {msg: "Estudiante eliminado correctamente."});
    } catch (error) {
        console.log("Error: " + error);
        return res.render("Eliminar", {msg: "Ha ocurrido un error"});
    }
});

//Listen
app.listen(3000);
console.log("Escuchando en http://localhost:3000")