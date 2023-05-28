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

router.get("/", (req, res) => {
  res.render("login");
});

router.get("/login", (req, res) => {
  res.render("login");
});

router.get("/almacen", requireAuth, function (req, res) {
  pool.query(
    'SELECT * FROM usuarios JOIN perfil ON usuarios.idperfil = perfil.idperfil  WHERE perfil.estado= "Activo"',
    function (error, results, fields) {
      if (error) throw error;
      res.render("almacen", {
        usuarios: results,
        name: results[0].cargo,
        usuario: results[0].usuario,
      });
    }
  );
});

router.post("/auth", async (req, res) => {
  const { usuario, password } = req.body;

  let passEncryptado = await bcryptjs.hash(password, 8);
  if (usuario && password) {
    // use placeholders (?) to avoid SQL injection
    pool.query(
      "SELECT * FROM usuarios u JOIN perfil p ON u.idperfil = p.idperfil WHERE u.usuario = ?",
      [usuario],
      async (error, results) => {
        if (error) {
          console.error(error);
          res.status(500).send("Internal Server Error");
          return;
        }

        if (
          results.length === 0 ||
          !(await bcryptjs.compare(password, results[0].password))
        ) {
          res.render("login", {
            alert: true,
            alertTitle: "Error",
            alertMessage: "USUARIO y/o PASSWORD incorrectas",
            alertIcon: "error",
            showConfirmButton: true,
            timer: false,
            ruta: "login",
          });
        } else if (results[0].estado === "Inactivo") {
          res.render("login", {
            alert: true,
            alertTitle: "Error",
            alertMessage: "Este usuario ya no tiene acceso a esta pagina",
            alertIcon: "error",
            showConfirmButton: true,
            timer: false,
            ruta: "login",
          });
        } else {
          req.session.loggedin = true;
          req.session.idusuario = results[0].idusuario;
          req.session.usuario = results[0].usuario;
          req.session.cargo = results[0].cargo;
          const perfilId = results[0].idperfil;
          pool.query(
            "SELECT * FROM perfil WHERE idperfil = ?",
            [perfilId],
            (error, results) => {
              if (error) {
                console.error(error);
                res.status(500).send("Internal Server Error");
                return;
              }
              const cargo = results[0].cargo;
              if (cargo === "Administrador") {
                res.render("index", {
                  login: true,
                  name: req.session.cargo,
                });
              } else if (cargo === "Cajero") {
                res.redirect("/cajero");
              } else if (cargo === "Almacenero") {
                res.redirect("/almacen");
              } else {
                res.redirect("/");
              }
            }
          );
        }
      }
    );
  } else {
    res.render("login", {
      alert: true,
      alertTitle: "Error",
      alertMessage: "Por Favor Ingrese Usuario",
      alertIcon: "error",
      showConfirmButton: true,
      timer: false,
      ruta: "login",
    });
  }
});

  
module.exports = router;
