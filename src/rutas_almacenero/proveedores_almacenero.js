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

router.get("/proveedores", requireAuth, async function (req, res) {
  pool.query(
    "SELECT * FROM proveedores",
    function (error, results, fields) {
      if (error) throw error;
      res.render("proveedores_almacenero", { proveedores: results });
    }
  );
});

router.post("/proveedores", async (req, res) => {
  const { nombre_empresa, ruc, direccion, ciudad, pais, telefono, email, estado_proveedor } = req.body;

  try {
    const sqlBuscaProveedor = "SELECT * FROM proveedores WHERE telefono = ?";
    pool.query(sqlBuscaProveedor, [telefono], (err, results) => {
      if (err) throw err;

      if (results.length > 0) {
        // El proveedor ya existe, mostrar un mensaje de error
        res.render("proveedores_almacenero", {
          proveedores: results,
          name: "Administrador",
          alert: true,
          alertTitle: "Error De Registro",
          alertMessage: "Este Número de Teléfono ya está registrado para otro proveedor",
          alertIcon: "error",
          showConfirmButton: true,
          timer: false,
          ruta: req.path,
        });
      } else {
        // El proveedor no existe, insertar datos en la tabla proveedor
        const sqlProveedor = "INSERT INTO proveedores (nombre_empresa, ruc, direccion, ciudad, pais, telefono, email, estado_proveedor) VALUES (?, ?, ?, ?, ?,  ?, ?,?)";
        pool.query(sqlProveedor, [nombre_empresa, ruc, direccion, ciudad, pais, telefono, email, estado_proveedor], (err, resultsProveedor) => {
          if (err) throw err;

          // Obtener los resultados y renderizar la vista
          pool.query("SELECT * FROM proveedores", (error, results, fields) => {
            if (error) throw error;
            res.render("proveedores_almacenero", {
              proveedores: results,
              name: "Administrador",
              alert: true,
              alertTitle: "Registro Exitoso",
              alertMessage: "Proveedor Registrado",
              alertIcon: "success",
              showConfirmButton: true,
              timer: 1500,
              ruta: req.path,
            });
          });
        });
      }
    });
  } catch (error) {
    res.render("proveedores_almacenero", {
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

/*-------------------------------------------------------------------------------------------------------------------------------*/




/* PARA MODIFICAR CATEGORIAS
---------------------------------------------------------------------------------------------------- */

router.get("/actualizarproveedor/:id", async function (req, res) {
  const idproveedor = req.params.id;
  try {
    const [results, fields] = await pool.promise().query(
      "SELECT * FROM proveedores WHERE idproveedor = ?",
      [idproveedor]
    );
    res.render("proveedores_almacenero", { productos: results });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al obtener la categoría");
  }
});


router.post("/actualizarproveedor/:id", async function (req, res) {
  const idproveedor = req.params.id;
  const {
    nombre_empresa,
    ruc,
    direccion,
    ciudad,
    pais,
    telefono,
    email,
    estado_proveedor
  } = req.body;

  try {
    // Verificar si el nombre de proveedor ya está en uso
    const [existingProvider, _] = await pool.promise().query(
      "SELECT * FROM proveedores ",
      [telefono]
    );
   

    // Actualizar el proveedor
    await pool.promise().query(
      "UPDATE proveedores SET nombre_empresa = ?, ruc = ?, direccion = ?, ciudad = ?, pais = ?, telefono = ?, email = ?, estado_proveedor = ? WHERE idproveedor = ?",
      [nombre_empresa, ruc, direccion, ciudad, pais, telefono, email, estado_proveedor, idproveedor]
    );

    res.redirect("/proveedores");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al actualizar proveedor");
  }
});



router.delete("/eliminarproveedor/:idproveedor", async function (req, res) {
  const idproveedor = req.params.idproveedor;
  try {
    const [results, fields] = await pool
      .promise()
      .query("DELETE FROM proveedores WHERE idproveedor= ?", [idproveedor]);
    res.sendStatus(200); // Respuesta exitosa
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al eliminar el proveedor"); // Error en el servidor
  }
});






module.exports = router;
