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
  
  function otro(req, res, next) {
      if (!req.session.loggedin) {
        // Limpiamos la cookie "loggedout"
        return res.redirect("/login");
      } else {
        if (req.session) {
          // Aquí puedes acceder a los datos de usuario de la sesión
    
          // Verifica el cargo del usuario permitido para acceder a /auth/compras
          if (req.session.cargo === "Almacenero" || req.session.cargo === "Administrador") {
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

router.get("/unidad", requireAuth, async function (req, res) {
  pool.query(
    "SELECT * FROM unidad",
    function (error, results, fields) {
      if (error) throw error;
      res.render("unidad_almacenero", { unidades: results });
    }
  );
});

router.post("/unidad", async (req, res) => {
  const { nombre_unidad, estado_unidad } = req.body;

  // Resto del código para validar y guardar los datos en la base de datos

  try {
    const sqlBuscaCategoria = "SELECT * FROM unidad WHERE nombre_unidad = ?";
    pool.query(sqlBuscaCategoria, [nombre_unidad], (err, results) => {
      if (err) throw err;

      if (results.length > 0) {
        // La categoría ya existe, mostrar un mensaje de error
        res.render("unidad_almacenero", {
          unidades: results,
          name: "Administrador",
          alert: true,
          alertTitle: "Error De Registro",
          alertMessage: "Esta Unidad Ya Existe",
          alertIcon: "error",
          showConfirmButton: true,
          timer: false,
          ruta: req.path,
        });
      } else {
        // La categoría no existe, insertar datos en la tabla categoria
        const sqlCategoria = "INSERT INTO unidad (nombre_unidad, estado_unidad) VALUES (?,?)";
        pool.query(sqlCategoria, [nombre_unidad, estado_unidad], (err, resultsCategoria) => {
          if (err) throw err;
          
          pool.query(
            "SELECT * FROM unidad",
            function (error, results, fields) {
              if (error) throw error;
              res.render("unidad_almacenero", {
                unidades: results,
                name: "Administrador",
                alert: true,
                alertTitle: "Registro Exitoso",
                alertMessage: "Unidad Registrada",
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
    res.render("unidad_almacenero", {
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

 router.get("/actualizarunidad/:id", requireAuth, async function (req, res) {
   const idUnidad = req.params.id;
   try {
     const [results, fields] = await pool.promise().query(
       "SELECT * FROM unidad WHERE idunidad = ?",
       [idUnidad]
     );
     res.render("unidad_almacenero", { productos: results });
   } catch (error) {
     console.error(error);
     res.status(500).send("Error al obtener la categoría");
   }
 });


 router.post("/actualizarunidad/:id", async function (req, res) {
  const idUnidad = req.params.id;
  const { nombre_unidad, estado_unidad } = req.body;
  try {
    // Verificar si el nombre de unidad ya existe en otra unidad
    const [existingUnit, _] = await pool.promise().query(
      "SELECT idunidad FROM unidad WHERE nombre_unidad = ? AND idunidad != ?",
      [nombre_unidad, idUnidad]
    );
    if (existingUnit.length > 0) {
      return res.status(400).send("El nombre de unidad ya está en uso en otra unidad");
    }

    // Actualizar la unidad
    await pool.promise().query(
      "UPDATE unidad SET nombre_unidad = ?, estado_unidad = ? WHERE idunidad = ?",
      [nombre_unidad, estado_unidad, idUnidad]
    );
    res.redirect("/unidad");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al actualizar la unidad");
  }
});






module.exports = router;
