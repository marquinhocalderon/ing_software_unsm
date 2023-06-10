const express = require("express");
const pool = require("../../database/db");
const bcryptjs = require("bcryptjs");
const router = express.Router();


function verificarAutenticacion(req, res, next) {
  if (req.session.loggedin) {
    // Si el usuario está autenticado, pasa al siguiente middleware o ruta
    return next();
  } else {
    // Si el usuario no está autenticado, redirecciona al formulario de login
    res.redirect("/login");
  }
}


router.get("/", (req, res) => {
  res.render("login");
});

router.get("/login", (req, res) => {
  res.render("login");
});

router.get("/auth", verificarAutenticacion, function (req, res) {
  pool.query(
    'SELECT * FROM usuarios JOIN perfil ON usuarios.idperfil = perfil.idperfil  WHERE perfil.estado = "Activo"',
    function (error, results, fields) {
      if (error) throw error;
      pool.query(
        'SELECT SUM(totalventa) AS totalVentas FROM ventas',
        function (error, resultsVentas, fields) {
          if (error) throw error;
          pool.query(
            'SELECT p.nombre_producto, COUNT(*) AS cantidad FROM detalle_venta AS dv JOIN productos AS p ON dv.idproducto = p.idproducto GROUP BY dv.idproducto ORDER BY cantidad DESC',
            function (error, resultsProductos, fields) {
              if (error) throw error;
              res.render("index", {
                usuarios: results,
                name: "Marco",
                usuario: results[0].usuario,
                totalVentas: resultsVentas[0].totalVentas,
                productos: resultsProductos
              });
            }
          );
        }
      );
    }
  );
});

router.get('/jalarproductos', (req, res) => {
  pool.query(
    'SELECT p.nombre_producto, COUNT(*) AS cantidad FROM detalle_venta AS dv JOIN productos AS p ON dv.idproducto = p.idproducto GROUP BY dv.idproducto ORDER BY cantidad DESC',
    function (error, resultsProductos, fields) {
      if (error) throw error;
      res.json(resultsProductos);
    }
  );
});

router.post("/login", async (req, res) => {
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
                pool.query(
                  "SELECT SUM(totalventa) AS totalVentas FROM ventas",
                  (error, resultsVentas) => {
                    if (error) {
                      console.error(error);
                      res.status(500).send("Internal Server Error");
                      return;
                    }
                    req.session.name = "Marco"; // Guardar el nombre en la sesión
                    req.session.totalVentas = resultsVentas[0].totalVentas; // Guardar el total de ventas en la sesión
                    res.render("index", {
                      login: true,
                      name: req.session.name,
                      totalVentas: req.session.totalVentas,
                    });
                  }
                );
              } else if (cargo === "Caja") {
                res.redirect("/caja");
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


router.get("/logout", verificarAutenticacion, function (req, res) {
  req.session.destroy(function (err) {
    if (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
      return;
    }

    // redirect the user to the login page
    res.redirect("/login");
  });
});






module.exports = router;
