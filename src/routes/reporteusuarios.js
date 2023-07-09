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

router.get("/auth/reporteusuarios", requireAuth, async function (req, res) {
  pool.query(
    `SELECT *
    FROM usuarios
    JOIN perfil ON usuarios.idperfil = perfil.idperfil
    `,
    function (error, results, fields) {
      if (error) throw error;
      res.render("reporteusuarios", { reportes: results });
    }
  );
});


router.get("/auth/reporteventasjson", async function (req, res) {
  pool.query(
    `SELECT * FROM ventas WHERE totalventa IS NOT NULL`,
    function (error, results, fields) {
      if (error) throw error;
      res.json(results);
    }
  );
});


module.exports = router;
