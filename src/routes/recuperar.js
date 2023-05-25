const express = require("express");
const pool = require("../../database/db");

const bcryptjs = require("bcryptjs");
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

router.get("/auth/recuperar", requireAuth, async function (req, res) {
  pool.query(
    "SELECT * FROM usuarios JOIN perfil ON usuarios.idperfil = perfil.idperfil",
    function (error, results, fields) {
      if (error) throw error;

      // Consulta adicional a la tabla "perfil"
      pool.query('SELECT * FROM perfil WHERE estado = "Activo"', function (errorPerfil, perfiles, fieldsPerfil) {
        if (errorPerfil) throw errorPerfil;

        res.render("recuperar", { usuarios: results, perfiles: perfiles });
      });
    }
  );
});


router.post("/auth/recuperar/:id", async function (req, res) {
  const idusuario = req.params.id;
  const { usuario, password } = req.body;

  try {
    // Cifrar el password
    const hashedPassword = await bcryptjs.hash(password, 8);

    await pool.promise().query(
      "UPDATE usuarios SET usuario = ?, password = ? WHERE idusuario = ?",
      [usuario, hashedPassword, idusuario]
    );

    // Consultar los datos actualizados en la base de datos
    const [results, fields] = await pool.promise().query(
      "SELECT * FROM usuarios WHERE idusuario = ?",
      [idusuario]
    );

    // Renderizar archivo "recuperar" y mostrar mensaje de éxito junto con los resultados
    res.render("recuperar", {
      name: "Administrador",
      alert: true,
      alertTitle: "Datos Actualizados",
      alertMessage: "Datos Registrados",
      alertIcon: "success",
      showConfirmButton: true,
      timer: 1500,
      ruta: "",
      usuarios: results
    });
  } catch (error) {
    console.error(error);
    // Renderizar archivo "recuperar" y mostrar mensaje de error
    res.render("recuperar", {
      name: "Administrador",
      alert: true,
      alertTitle: "Error al Actualizar",
      alertMessage: "Error en el Registro",
      alertIcon: "error",
      showConfirmButton: true,
      timer: 1500,
      ruta: ""
    });
  }
});






module.exports = router;
