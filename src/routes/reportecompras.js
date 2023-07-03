const express = require("express");
const pool = require("../../database/db");

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session.loggedin) {
    // Limpiamos la cookie "loggedout"
    return res.redirect("/login");
  } else {
    if (req.session.usuario) {
      return next();
    } else {
      return res.redirect("/login");
    }
  }
}

/* BOTON PARA REGISTRAR CATEGORIAS
--------------------------------------------------------------------------------------------------------------------
*/

router.get("/auth/reportecompras", async function (req, res) {
  pool.query(
    `SELECT * FROM compras WHERE totalcompra IS NOT NULL`,
    function (error, results, fields) {
      if (error) throw error;
      res.render("reportecompras", { reportes: results });
    }
  );
});


router.get("/auth/reportecomprasjson", async function (req, res) {
  pool.query(
    `SELECT * FROM compras WHERE totalcompra IS NOT NULL`,
    function (error, results, fields) {
      if (error) throw error;
      res.json(results);
    }
  );
});


module.exports = router;
