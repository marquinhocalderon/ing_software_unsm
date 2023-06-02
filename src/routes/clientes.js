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

router.get("/auth/clientes", requireAuth, async function (req, res) {
  pool.query(
    "SELECT * FROM clientes",
    function (error, results, fields) {
      if (error) throw error;
      res.render("clientes", { clientes: results });
    }
  );
});

router.post("/auth/clientes", (req, res) => {
  let { dni, ruc, nombre_cliente, razonsocial, telefono, direccion } = req.body;
  const estado_cliente = "Activo";

  // Verificar si dni y ruc no están presentes en la solicitud y establecerlos como null
  dni = dni || null;
  ruc = ruc || null;
  telefono = telefono || null;

  try {
    // Check if the length of ruc is exactly 11 and dni is exactly 8


    // Realizar la consulta para verificar si el DNI o el teléfono ya existen
    const sqlBuscaCliente =
      "SELECT * FROM clientes WHERE dni = ? OR ruc = ? OR telefono = ?";
    pool.query(sqlBuscaCliente, [dni, ruc, telefono], async (err, results) => {
      if (err) throw err;

      if (ruc && ruc.length !== 11) {
            return res.render("clientes", {
          clientes: results,
          name: "Administrador",
          alert: true,
          alertTitle: "Error De Registro",
          alertMessage: "El ruc debe tener 11 digitors",
          alertIcon: "error",
          showConfirmButton: true,
          timer: false,
          ruta: "",
        });
      }
  
      if (dni && dni.length !== 8) {
        return res.render("clientes", {
          clientes: results,
          name: "Administrador",
          alert: true,
          alertTitle: "Error De Registro",
          alertMessage: "El dni debe tener 8 digitors",
          alertIcon: "error",
          showConfirmButton: true,
          timer: false,
          ruta: "",
        });
      }

      if (results.length > 0) {
        // Si el cliente ya existe, mostrar un mensaje de error
        return res.render("clientes", {
          clientes: results,
          name: "Administrador",
          alert: true,
          alertTitle: "Error De Registro",
          alertMessage: "El DNI/RUC o el teléfono ya existen",
          alertIcon: "error",
          showConfirmButton: true,
          timer: false,
          ruta: "",
        });
      }

      // Si el cliente no existe, insertar datos en la tabla clientes
      const sqlCliente =
        "INSERT INTO clientes (ruc, dni, nombre_cliente, razonsocial, telefono, direccion, estado_cliente) VALUES (?,?,?,?,?,?,?)";
      pool.query(
        sqlCliente,
        [
          ruc,
          dni,
          nombre_cliente,
          razonsocial,
          telefono,
          direccion,
          estado_cliente,
        ],
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






router.get("/auth/actualizarcliente/:id", requireAuth, async function (req, res) {
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
  const { ruc, dni, nombre_cliente, razonsocial, telefono, direccion, estado_cliente } = req.body;

  // Verificar si los campos están vacíos y establecerlos como null si es necesario
  const rucValue = ruc ? ruc : null;
  const dniValue = dni ? dni : null;
  const nombreClienteValue = nombre_cliente ? nombre_cliente : null;
  const razonSocialValue = razonsocial ? razonsocial : null;
  const telefonoValue = telefono ? telefono : null;
  const direccionValue = direccion ? direccion : null;
  const estadoClienteValue = estado_cliente ? estado_cliente : null;

  try {
    // Verificar si el número de DNI, RUC o teléfono ya están en uso por otro cliente
    const [existingClients, _] = await pool.promise().query(
      "SELECT idcliente FROM clientes WHERE (dni = ? OR ruc = ? OR telefono = ?) AND idcliente <> ?",
      [dniValue, rucValue, telefonoValue, idCliente]
    );

    if (existingClients.length > 0) {
      // Si existen clientes con el mismo DNI, RUC o teléfono, mostrar un mensaje de error
      return res.status(400).send("El DNI, RUC o teléfono ya están en uso por otro cliente");
    }

    // Actualizar el cliente si los números de DNI, RUC y teléfono no están repetidos
    await pool.promise().query(
      "UPDATE clientes SET ruc=?, dni=?, nombre_cliente=?, razonsocial=?, telefono=?, direccion=?, estado_cliente=? WHERE idcliente=?",
      [rucValue, dniValue, nombreClienteValue, razonSocialValue, telefonoValue, direccionValue, estadoClienteValue, idCliente]
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
