const express = require("express");
const pool = require("../../database/db");


const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session.loggedin) {
    // Limpiamos la cookie "loggedout"
    return res.redirect("/login");
  } else {
    if (req.session.usuario) {
      return next();
    } else {
      return res.redirect("/login");
    }
  }
}

/* BOTON PARA REGISTRAR CATEGORIAS
--------------------------------------------------------------------------------------------------------------------
*/

router.get("/auth/clientes", async function (req, res) {
  pool.query(
    "SELECT * FROM clientes",
    function (error, results, fields) {
      if (error) throw error;
      res.render("clientes", { clientes: results });
    }
  );
});


router.post("/auth/clientes", (req, res) => {
  const { dni, nombre_cliente, telefono, direccion } = req.body;
  const estado_cliente = "Activo";

  try {
    if (dni.length < 8) {
      // El DNI tiene menos de 8 dígitos, mostrar un mensaje de error
      return res.render("clientes", {
        clientes: [],
        name: "Administrador",
        alert: true,
        alertTitle: "Error De Registro",
        alertMessage: "El DNI debe tener al menos 8 dígitos",
        alertIcon: "error",
        showConfirmButton: true,
        timer: false,
        ruta: "",
      });
    }

    const sqlBuscaCliente = "SELECT * FROM clientes WHERE dni = ? AND telefono = ?";
    pool.query(sqlBuscaCliente, [dni, telefono], async (err, results) => {
      if (err) throw err;
    
      if (results.length > 0) {
        // El cliente ya existe, mostrar un mensaje de error
        return res.render("clientes", {
          clientes: results,
          name: "Administrador",
          alert: true,
          alertTitle: "Error De Registro",
          alertMessage: "El DNI O EL TELEFONO YA EXISTEN",
          alertIcon: "error",
          showConfirmButton: true,
          timer: false,
          ruta: "",
        });
      }

      // El cliente no existe, insertar datos en la tabla clientes
      const sqlCliente =
        "INSERT INTO clientes (dni, nombre_cliente, telefono, direccion, estado_cliente) VALUES (?,?,?,?,?)";
      pool.query(
        sqlCliente,
        [dni, nombre_cliente, telefono, direccion, estado_cliente],
        (err, _) => {
          if (err) throw err;

          // Realizar la consulta para obtener los datos actualizados de la base de datos
          const sqlSelectClientes = "SELECT * FROM clientes";
          pool.query(sqlSelectClientes, (err, updatedClientes) => {
            if (err) throw err;

            res.render("clientes", {
              clientes: updatedClientes,
              name: "Administrador",
              alert: true,
              alertTitle: "Registro Exitoso",
              alertMessage: "Cliente Registrado",
              alertIcon: "success",
              showConfirmButton: true,
              timer: 1500,
              ruta: "",
            });
          });
        }
      );
    });
  } catch (error) {
    res.render("clientes", {
      clientes: [],
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



router.get("/auth/actualizarcliente/:id", async function (req, res) {
  const idCliente = req.params.id;
  try {
    const [results, fields] = await pool.promise().query(
      "SELECT * FROM clientes WHERE idcliente = ?",
      [idCliente]
    );
    res.render("clientes", { productos: results });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al obtener la categoría");
  }
});



 router.post("/auth/actualizarcliente/:idcliente", async function (req, res) {
  const idCliente = req.params.idcliente;
  const { dni, nombre_cliente, telefono, direccion, estado_cliente } = req.body;
  
  try {
    // Verificar si el número de DNI ya está en uso por otro cliente
    const [existingClients, _] = await pool.promise().query(
      "SELECT idcliente FROM clientes WHERE dni = ? AND idcliente <> ?",
      [dni, idCliente]
    );

    if (existingClients.length > 0) {
      // Si existen clientes con el mismo DNI, mostrar un mensaje de error
      return res.status(400).send("El número de DNI ya está en uso por otro cliente");
    }

    // Actualizar el cliente si el número de DNI no está repetido
    const [results, fields] = await pool.promise().query(
      "UPDATE clientes SET dni = ?, nombre_cliente = ?, telefono = ?, direccion=?, estado_cliente = ? WHERE idcliente = ?",
      [dni, nombre_cliente, telefono, direccion, estado_cliente, idCliente]
    );
    res.redirect("/auth/clientes");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al actualizar el cliente");
  }
}); 



router.delete("/auth/eliminarcliente2/:idcliente", async function (req, res) {
  const idCliente = req.params.idcliente;
  try {
    const [results, fields] = await pool.promise().query(
      "DELETE FROM clientes WHERE idcliente = ?",
      [idCliente]
    );
    res.sendStatus(200); // Respuesta exitosa
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al eliminar el cliente"); // Error en el servidor
  }
});






module.exports = router;
