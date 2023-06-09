const express = require("express");
const pool = require("../../database/db");
const bcryptjs = require("bcryptjs");
const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session.loggedin) {
    return res.redirect("/login");
  } else {
    if (req.session.cargo === "Caja") {
      return next();
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

router.get("/caja", requireAuth, (req, res) => {
  const perfilId = req.session.idperfil;
  pool.query(
    'SELECT * FROM usuarios JOIN perfil ON usuarios.idperfil = perfil.idperfil WHERE perfil.estado = "Activo"',
    (error, results) => {
      if (error) throw error;
      res.render("cajero", {
        usuarios: results,
        name: req.session.cargo,
        usuario: req.session.usuario,
      });
    }
  );
});

router.post("/auth", requireAuth, async (req, res) => {
  const { usuario, password } = req.body;

  if (usuario && password) {
    pool.query(
      "SELECT * FROM usuarios u JOIN perfil p ON u.idperfil = p.idperfil WHERE u.usuario = ?",
      [usuario],
      async (error, results) => {
        if (error) {
          console.error(error);
          res.status(500).send("Internal Server Error");
          return;
        }

        if (results.length === 0 || !(await bcryptjs.compare(password, results[0].password))) {
          return res.render("login", {
            alert: true,
            alertTitle: "Error",
            alertMessage: "Usuario y/o contraseña incorrectos",
            alertIcon: "error",
            showConfirmButton: true,
            timer: false,
            ruta: "login",
          });
        } else if (results[0].estado === "Inactivo") {
          return res.render("login", {
            alert: true,
            alertTitle: "Error",
            alertMessage: "Este usuario ya no tiene acceso a esta página",
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
          req.session.idperfil = results[0].idperfil;
          
          const cargo = results[0].cargo;
          if (cargo === "Administrador") {
            return res.render("index", {
              login: true,
              name: req.session.cargo,
            });
          } else if (cargo === "Cajero") {
            return res.redirect("/caja");
          } else if (cargo === "Almacenero") {
            return res.redirect("/almacen");
          } else {
            return res.redirect("/");
          }
        }
      }
    );
  } else {
    return res.render("login", {
      alert: true,
      alertTitle: "Error",
      alertMessage: "Por favor, ingrese un usuario y contraseña",
      alertIcon: "error",
      showConfirmButton: true,
      timer: false,
      ruta: "login",
    });
  }
});

module.exports = router;
