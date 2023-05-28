const express = require("express");
const pool = require("../../database/db");


const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session.loggedin) {
    // Limpiamos la cookie "loggedout"
    return res.redirect("/login");
  } else {
    if (req.session) {
      // Aquí puedes acceder a los datos de usuario de la sesión

      // Verifica el cargo del usuario permitido para acceder a /auth/compras
      if (req.session.cargo === "Almacenero") {
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

/* BOTON PARA REGISTRAR CATEGORIAS
--------------------------------------------------------------------------------------------------------------------
*/

router.get("/categoria", requireAuth, async function (req, res) {
  pool.query(
    "SELECT * FROM categoria",
    function (error, results, fields) {
      if (error) throw error;
      res.render("categoria_almacenero", { categorias: results });
    }
  );
});

router.post("/categoria", async (req, res) => {
  const { nombre_categoria, estado_categoria } = req.body;

  // Resto del código para validar y guardar los datos en la base de datos

  try {
    const sqlBuscaCategoria = "SELECT * FROM categoria WHERE nombre_categoria = ?";
    pool.query(sqlBuscaCategoria, [nombre_categoria], (err, results) => {
      if (err) throw err;

      if (results.length > 0) {
        // La categoría ya existe, mostrar un mensaje de error
        res.render("categoria_almacenero", {
          categorias: results,
          name: "Administrador",
          alert: true,
          alertTitle: "Error De Registro",
          alertMessage: "Esta Categoría Ya Existe",
          alertIcon: "error",
          showConfirmButton: true,
          timer: false,
          ruta: req.path,
        });
      } else {
        // La categoría no existe, insertar datos en la tabla categoria
        const sqlCategoria = "INSERT INTO categoria (nombre_categoria, estado_categoria) VALUES (?,?)";
        pool.query(sqlCategoria, [nombre_categoria, estado_categoria], (err, resultsCategoria) => {
          if (err) throw err;
          
          pool.query(
            "SELECT * FROM categoria",
            function (error, results, fields) {
              if (error) throw error;
              res.render("categoria_almacenero", {
                categorias: results,
                name: "Administrador",
                alert: true,
                alertTitle: "Registro Exitoso",
                alertMessage: "Categoría Registrada",
                alertIcon: "success",
                showConfirmButton: true,
                timer: 1500,
                ruta: req.path,
              });
            }
          );
        });
      }
    });
  } catch (error) {
    res.render("categoria_almacenero", {
      name: "Administrador",
      alert: true,
      alertTitle: "Error",
      alertMessage: "Hubo un error en la solicitud",
      alertIcon: "error",
      showConfirmButton: true,
      timer: false,
      ruta: req.path,
    });
  }
});




/* PARA MODIFICAR CATEGORIAS
---------------------------------------------------------------------------------------------------- */

router.get("/actualizarcategoria/:id", requireAuth, async function (req, res) {
  const idCategoria = req.params.id;
  try {
    const [results, fields] = await pool.promise().query(
      "SELECT * FROM categoria WHERE idcategoria = ?",
      [idCategoria]
    );
    res.render("categoria_almacenero", { productos: results });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al obtener la categoría");
  }
});


router.post("/actualizarcategoria/:id", async function (req, res) {
  const idCategoria = req.params.id;
  const { nombre_categoria, estado_categoria } = req.body;
  try {
    // Verificar si el nombre de categoría ya existe en otra categoría
    const [existingCategory, _] = await pool.promise().query(
      "SELECT idcategoria FROM categoria WHERE nombre_categoria = ? AND idcategoria != ?",
      [nombre_categoria, idCategoria]
    );
    if (existingCategory.length > 0) {
      return res.status(400).send("El nombre de categoría ya está en uso en otra categoría");
    }

    // Actualizar la categoría
    await pool.promise().query(
      "UPDATE categoria SET nombre_categoria = ?, estado_categoria = ? WHERE idcategoria = ?",
      [nombre_categoria, estado_categoria, idCategoria]
    );
    res.redirect("/categoria");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al actualizar la categoría");
  }
});






module.exports = router;
