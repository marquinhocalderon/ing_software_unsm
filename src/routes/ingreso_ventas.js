const express = require("express");
const pool = require("../../database/db");
const bcryptjs = require("bcryptjs");
const router = express.Router();
const axios = require("axios");


function requireAuth(req, res, next) {
  if (!req.session.loggedin) {
    // Limpiamos la cookie "loggedout"
    return res.redirect("/login");
  } else {
    if (req.session) {
      // Aquí puedes acceder a los datos de usuario de la sesión

      // Verifica el cargo del usuario permitido para acceder a /auth/compras
      if (req.session.cargo === "Administrador") {
        // El usuario tiene un cargo permitido, se permite el acceso a la página /auth/compras
        return next();
      } else {
        // El usuario no tiene un cargo permitido, redirige a la página de inicio de sesión o muestra un mensaje de error
        return res.redirect("/login");
      }
    } else {
      return res.redirect("/login");
    }
  }
}


function poolQuery(query) {
    return new Promise((resolve, reject) => {
      pool.query(query, function (error, result, fields) {
        if (error) reject(error);
        resolve(result);
      });
    });
  }

/* PARA INSERTAR Compras
----------------------------------------------------------------------------------------------------  WHERE categoria.estado= "Activo" */
/* PARA mostrar las ventas
----------------------------------------------------------------------------------------------------  WHERE categoria.estado= "Activo" */
router.get("/auth/facturaciones", async (req, res) => {
    try {
      const data = await poolQuery(`
        SELECT c.*, cl.nombre_cliente AS nombre_cliente, cl.razonsocial AS razonsocial, u.nombre, p2.cargo AS cargo
        FROM ventas c
        JOIN clientes cl ON c.idcliente = cl.idcliente
        JOIN usuarios u ON c.idusuario = u.idusuario
        JOIN perfil p2 ON u.idperfil = p2.idperfil;
      `);
  
      const clientes = await poolQuery("SELECT * FROM clientes");
      const productos = await poolQuery(`
        SELECT p.*, c.nombre_categoria AS nombre_categoria, u.nombre_unidad AS nombre_unidad
        FROM productos p
        JOIN categoria c ON p.idcategoria = c.idcategoria
        JOIN unidad u ON p.idunidad = u.idunidad
        ORDER BY p.idproducto ASC
      `);
  
      res.render("facturaciones", { ventas: data, clientes, productos });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error en el servidor");
    }
  });
  







router.get("/auth/facturaciones/:id",  async function (req, res) {
  try {
    const { id } = req.params; // Capturar el valor del ID
    const results = await poolQuery(
      `
      SELECT c.*, cl.* 
      FROM ventas c
      JOIN clientes cl ON c.idcliente = cl.idcliente
      WHERE c.idventa = ${id}
      `
    );
    const results2 = await poolQuery(
      `
      SELECT dc.*, p.* , pr.*,u.nombre_unidad
      FROM detalle_venta dc
      JOIN ventas c ON dc.idventa = c.idventa
      JOIN clientes p ON c.idcliente = p.idcliente
      JOIN productos pr ON dc.idproducto = pr.idproducto
      JOIN unidad u ON pr.idunidad = u.idunidad
      WHERE c.idventa = ${id};
      `
    );
    
    const combinedResults = {
      results: results,
      results2: results2
    };
    
    res.json(combinedResults);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error en el servidor");
  }
});

/*
router.put("/auth/pagado/:idcompra", async function (req, res) {
  const idcompra = req.params.idcompra;
  try {
    const [results, fields] = await pool
      .promise()
      .query("UPDATE compras SET estado_compra = 'Pagado' WHERE idcompra = ?", [idcompra]);
    res.sendStatus(200); // Respuesta exitosa
  } catch (error) {
    console.error(error);
    res.status(500).send("Hubo un error"); // Error en el servidor
  }
});

*/


module.exports = router;
