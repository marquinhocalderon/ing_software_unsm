const express = require("express");
const pool = require("../../database/db");
const bcryptjs = require("bcryptjs");
const router = express.Router();
const fs = require('fs');
const swal = require('sweetalert');

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
                    res.redirect("/auth"); // Redirigir a la página principal ("/auth")
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



router.get("/auth/usuarios", requireAuth, async function (req, res) {
  pool.query(
    "SELECT * FROM usuarios JOIN perfil ON usuarios.idperfil = perfil.idperfil",
    function (error, results, fields) {
      if (error) throw error;

      // Consulta adicional a la tabla "perfil"
      pool.query('SELECT * FROM perfil WHERE estado = "Activo"', function (errorPerfil, perfiles, fieldsPerfil) {
        if (errorPerfil) throw errorPerfil;

        res.render("usuarios", { usuarios: results, perfiles: perfiles });
      });
    }
  );
});





router.post("/auth/usuarios", verificarAutenticacion, async (req, res) => {
  const { dni_usuario, nombre, usuario, password, estado_usuario } = req.body;
  const idPerfil = req.body.cargo;
  const imagen = req.file;

  if (dni_usuario.length !== 8) {
    swal('Error', 'El DNI debe tener 8 dígitos', 'error');
    return res.status(400).json({ error: "El DNI debe tener 8 dígitos" });
  }
  

  // Encriptar el password
  const hashedPassword = await bcryptjs.hash(password, 8);

  // Variables para la consulta SQL
  let query, values;

  if (imagen) {
    // Si se envía una imagen, incluir su nombre en la consulta SQL
    query = 'INSERT INTO usuarios (dni_usuario, nombre, usuario, password, imagen, estado_usuario, idperfil) VALUES (?, ?, ?, ?, ?, ?, ?)';
    values = [dni_usuario, nombre, usuario, hashedPassword, imagen.filename, estado_usuario, idPerfil];
  } else {
    // Si no se envía una imagen, excluir el campo de imagen en la consulta SQL
    query = 'INSERT INTO usuarios (dni_usuario, nombre, usuario, password, estado_usuario, idperfil) VALUES (?, ?, ?, ?, ?, ?)';
    values = [dni_usuario, nombre, usuario, hashedPassword, estado_usuario, idPerfil];
  }

  pool.query(query, values, function(error, result) {
    if (error) throw error;

    // Realizar las acciones necesarias después de la inserción, como redirigir o enviar una respuesta al cliente
    res.redirect('/auth/usuarios');
  });
});



router.get("/auth/usuarios/:id",verificarAutenticacion, async function (req, res) {
  const { id } = req.params;
  pool.query(
    "SELECT * FROM usuarios JOIN perfil ON usuarios.idperfil = perfil.idperfil WHERE usuarios.idusuario = ?", [id], 
    function (error, results, fields) {
      if (error) throw error;

      // Consulta adicional a la tabla "perfil"
      pool.query('SELECT * FROM perfil WHERE estado = "Activo"', function (errorPerfil, perfiles, fieldsPerfil) {
        if (errorPerfil) throw errorPerfil;

        res.redirect("/auth/usuarios")
      });
    }
  );
});

router.get("/auth/usuarios1/:id", verificarAutenticacion, async function (req, res) {
  try {
    const { id } = req.params;

    pool.query(
      "SELECT * FROM usuarios JOIN perfil ON usuarios.idperfil = perfil.idperfil WHERE usuarios.idusuario = ?", 
      [id],
      function (error, results, fields) {
        if (error) {
          throw error;
        }
        // Envía los resultados en formato JSON
        res.json(results);
      }
    );
  } catch (error) {
    // Manejar errores aquí
    console.error(error);
    res.status(500).send('Error en el servidor');
  }
});


router.get("/auth/perfil1", async function (req, res) {
  pool.query(
    "SELECT * FROM perfil",
    function (error, results, fields) {
      if (error) throw error;
      res.json(results);
    }
  );
});

router.post("/auth/usuarios/:id", async function (req, res) {
  const { dni_usuario, nombre, usuario, estado_usuario } = req.body;
  const imagen = req.file;
  const idPerfil = req.body.cargo;
  const { id } = req.params;

  try {
    const connection = await pool.promise().getConnection();

    await connection.beginTransaction();

    // Verificar si el dni_usuario ya está en uso por otro usuario
    const [existingUser] = await connection.query(
      "SELECT idusuario FROM usuarios WHERE dni_usuario = ? AND idusuario != ?",
      [dni_usuario, id]
    );

    const [perfil] = await connection.query("SELECT * FROM perfil");

    if (existingUser.length > 0) {
      await connection.rollback();
      connection.release();
      return res.render("usuarios", {
        usuarios: existingUser,
        perfiles: perfil,
        name: "Administrador",
        alert: true,
        alertTitle: "Error",
        alertMessage:
          "Hubo un error en la solicitud. Este DNI ya está ocupado por otro usuario",
        alertIcon: "error",
        showConfirmButton: true,
        timer: false,
        ruta: req.path,
      });
    }

    // Obtener la imagen actual del usuario
    const [rows] = await connection.query(
      "SELECT imagen FROM usuarios WHERE idusuario = ?",
      [id]
    );

    const imagenActual = rows[0].imagen;

    // Construir la consulta de actualización
    await connection.query(
      "UPDATE usuarios SET dni_usuario = ?, nombre = ?, usuario = ?, imagen = ?, estado_usuario = ?, idperfil = ? WHERE idusuario = ?",
      [
        dni_usuario,
        nombre,
        usuario,
        imagen ? imagen.filename : imagenActual,
        estado_usuario,
        idPerfil,
        id,
      ]
    );

    await connection.commit();
    connection.release();

    res.redirect("/auth/usuarios");
  } catch (error) {
    console.error(error);

    res.status(500).send("Error al actualizar");
  }
});














module.exports = router;





module.exports = router;
