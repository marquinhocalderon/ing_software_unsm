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

/* BOTON PARA REGISTRAR CATEGORIAS
--------------------------------------------------------------------------------------------------------------------
*/

router.get("/auth/perfiles", requireAuth, async function (req, res) {
  pool.query(
    "SELECT * FROM perfil",
    function (error, results, fields) {
      if (error) throw error;
      res.render("perfil", { perfiles: results });
    }
  );
});

router.post("/auth/perfiles", async (req, res) => {
  const { cargo, estado } = req.body;

  try {
    const sqlBuscaPerfil = "SELECT * FROM perfil WHERE cargo = ?";
    pool.query(sqlBuscaPerfil, [cargo], (err, results) => {
      if (err) {
        throw err;
      }

      if (results.length > 0) {
        // El perfil ya existe, mostrar un mensaje de error
        res.render("perfil", {
          perfiles:results,
          name: "Administrador",
          alert: true,
          alertTitle: "Error De Registro",
          alertMessage: "Este Perfil Ya Existe",
          alertIcon: "error",
          showConfirmButton: true,
          timer: false,
          ruta: "",
        });
      } else {
        // El perfil no existe, insertar datos en la tabla perfil
        const sqlInsertarPerfil = "INSERT INTO perfil (cargo, estado) VALUES (?, ?)";
        pool.query(sqlInsertarPerfil, [cargo, estado], (err, result) => {
          if (err) {
            throw err;
          }

          // Obtener todos los perfiles después de la inserción
          const sqlObtenerPerfiles = "SELECT * FROM perfil";
          pool.query(sqlObtenerPerfiles, (err, resultadosPerfiles) => {
            if (err) {
              throw err;
            }

            res.render("perfil", {
              perfiles: resultadosPerfiles,
              name: "Administrador",
              alert: true,
              alertTitle: "Registro Exitoso",
              alertMessage: "Perfil Registrado",
              alertIcon: "success",
              showConfirmButton: true,
              timer: 1500,
              ruta: "",
            });
          });
        });
      }
    });
  } catch (error) {
    res.render("perfil", {
      perfiles: [],
      name: "Administrador",
      alert: true,
      alertTitle: "Error",
      alertMessage: "Hubo un error en la solicitud",
      alertIcon: "error",
      showConfirmButton: true,
      timer: false,
      ruta: "",
    });
  }
});

router.get("/auth/perfiles/:id", requireAuth, async function (req, res) {
  const idPerfil = req.params.id;
  try {
    const [results, fields] = await pool.promise().query(
      "SELECT * FROM perfil WHERE idperfil = ?",
      [idPerfil]
    );
    res.render("perfil", { perfiles: results });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al obtener la categoría");
  }
});

router.post("/auth/perfiles/:id", async function (req, res) {
  const idPerfil = req.params.id;
  const { cargo, estado } = req.body;
  
  try {
    // Verificar si el cargo ya existe en otro perfil
    const [existingProfile, _] = await pool.promise().query(
      "SELECT idperfil FROM perfil WHERE cargo = ? AND idperfil <> ?",
      [cargo, idPerfil]
    );
    
    if (existingProfile.length > 0) {
      // El cargo ya existe en otro perfil, mostrar un mensaje de error
      res.status(400).send("El cargo ya está en uso en otro perfil");
    } else {
      // El cargo no está duplicado, realizar la actualización
      const [results, fields] = await pool.promise().query(
        "UPDATE perfil SET cargo = ?, estado = ? WHERE idperfil = ?",
        [cargo, estado, idPerfil]
      );
      
      res.redirect("/auth/perfiles");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al actualizar el perfil");
  }
});






/* PARA MODIFICAR CATEGORIAS
---------------------------------------------------------------------------------------------------- */




module.exports = router;
