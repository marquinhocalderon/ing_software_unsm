const express = require("express");
const pool = require("../../database/db");
const bcryptjs = require("bcryptjs");
const router = express.Router();
const fs = require('fs');


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

/* PARA MODIFICAR USUARIOS
---------------------------------------------------------------------------------------------------- */

router.get("/auth/usuarios", async function (req, res) {
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





router.post("/auth/usuarios", async (req, res) => {
  const { dni_usuario, nombre, usuario, password, estado_usuario } = req.body;
  const idPerfil = req.body.cargo;
  const imagen = req.file;

  // Encriptar el password
  const hashedPassword = await bcryptjs.hash(password, 8);

 // Lee el contenido del archivo

  const query = 'INSERT INTO usuarios (dni_usuario, nombre, usuario, password, imagen, estado_usuario, idperfil) VALUES (?, ?, ?, ?, ?, ?, ?)';
  const values = [dni_usuario, nombre, usuario, hashedPassword, imagen.filename, estado_usuario, idPerfil];

  pool.query(query, values, function(error, result) {
    if (error) throw error;

    // Realizar las acciones necesarias después de la inserción, como redirigir o enviar una respuesta al cliente
    res.redirect('/auth/usuarios');
  });
});



router.get("/auth/usuarios/:id", requireAuth, async function (req, res) {
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
