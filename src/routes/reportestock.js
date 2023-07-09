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

router.get("/auth/reportestock", requireAuth, async function (req, res) {
  pool.query(
   `SELECT p.*, c.nombre_categoria AS nombre_categoria, u.nombre_unidad AS nombre_unidad
   FROM productos p
   JOIN categoria c ON p.idcategoria = c.idcategoria
   JOIN unidad u ON p.idunidad = u.idunidad
   ORDER BY p.idproducto ASC;
   `,
    function (error, results, fields) {
      if (error) throw error;
      res.render("reportestock", { reportes: results });
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
