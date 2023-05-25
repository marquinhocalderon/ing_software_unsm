const express = require("express");
const pool = require("../../database/db");

const router = express.Router();
router.use(express.json());

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
router.get("/auth/ventas", async function (req, res) {
  pool.query(
    "SELECT v.*, c.*, p.*, u.*, dv.*, pr.*, ma.*, ca.*, un.* " +
      "FROM ventas v " +
      "INNER JOIN clientes c ON v.idcliente = c.idcliente " +
      "INNER JOIN detalle_venta dv ON v.idventa = dv.idventa " +
      "INNER JOIN productos p ON dv.idproducto = p.idproducto " +
      "INNER JOIN usuarios u ON v.idusuario = u.idusuario " +
      "INNER JOIN proveedores pr ON p.idproveedor = pr.idproveedor " +
      "INNER JOIN marca ma ON p.idmarca = ma.idmarca " +
      "INNER JOIN categoria ca ON p.idcategoria = ca.idcategoria " +
      "INNER JOIN unidad un ON p.idunidad = un.idunidad " +
      "ORDER BY dv.iddetalle ASC",
    function (error, results, fields) {
      if (error) throw error;
      pool.query(
        "SELECT * FROM productos",
        function (error, productos, fields) {
          if (error) throw error;
          res.render("ventas", { ventas: results, productos: productos });
        }
      );
    }
  );
});

router.get("/api/cliente", async function (req, res) {
  const dni = req.query.dni;

  // Realizar la consulta a la base de datos para obtener los datos del cliente según el DNI
  pool.query(
    "SELECT * FROM clientes WHERE dni = ?",
    [dni],
    function (error, results, fields) {
      if (error) {
        console.error("Error al obtener los datos del cliente:", error);
        res
          .status(500)
          .json({ error: "Error al obtener los datos del cliente" });
      } else {
        // Devolver los datos del cliente en formato JSON
        res.json(results[0]);
      }
    }
  );
});

router.get("/api/producto", async function (req, res) {
  const codigoProducto = req.query.codigo_producto;

  // Realizar la consulta a la base de datos para obtener los datos del producto según el código
  pool.query(
    "SELECT * FROM productos WHERE codigo_producto = ?",
    [codigoProducto],
    function (error, results, fields) {
      if (error) {
        console.error("Error al obtener los datos del producto:", error);
        res
          .status(500)
          .json({ error: "Error al obtener los datos del producto" });
      } else {
        if (results.length > 0) {
          // Devolver los datos del producto en formato JSON
          res.json(results[0]);
        } else {
          // No se encontró ningún producto con el código proporcionado
          res.status(404).json({ error: "Producto no encontrado" });
        }
      }
    }
  );
});

router.get("/api/usuario", async function (req, res) {
  const idUsuario = req.query.id;

  // Realizar la consulta a la base de datos para obtener los datos del usuario según el ID
  pool.query(
    "SELECT * FROM usuarios JOIN perfil ON usuarios.idperfil = perfil.idperfil WHERE perfil.cargo IN (?, ?) AND usuarios.idusuario = ?",
    ["Administrador", "Cajero", idUsuario],
    function (error, results, fields) {
      if (error) {
        console.error("Error al obtener los datos del usuario:", error);
        res
          .status(500)
          .json({ error: "Error al obtener los datos del usuario" });
      } else {
        // Devolver los datos del usuario en formato JSON
        res.json(results[0]);
      }
    }
  );
});

// Importa los módulos necesarios para tu aplicación Node.js

// Definir la ruta POST '/auth/ventas' para procesar el formulario

router.post("/auth/ventas", (req, res) => {
  const { idusuario, idcliente, productojson ,total_venta} = req.body;

  // Verificar el contenido de productojson
  console.log(productojson);

  // Convertir productojson en un arreglo
  let productos = [];

  try {
    // Parsear el JSON si productojson es un string
    const productojsonArray = Array.isArray(productojson) ? productojson : JSON.parse(productojson);

    // Recorrer el arreglo y obtener los valores de idproducto, cantidadVendida y total
    for (let i = 0; i < productojsonArray.length; i++) {
      if (productojsonArray[i].hasOwnProperty("idproducto")) {
        const { idproducto, cantidadVendida, total } = productojsonArray[i];
        productos.push({ idproducto, cantidadVendida, total });
      }
    }

    console.log(productos);

    // Insertar los datos de venta en la tabla 'ventas'
    const venta = {
      idusuario: idusuario,
      idcliente: idcliente,
      fechaventa: new Date(),
      total_venta: total_venta,
    };

    pool.query("INSERT INTO ventas SET ?", venta, (error, result) => {
      if (error) throw error;

      const idventa = result.insertId;

      // Insertar los detalles de venta en la tabla 'detalle_venta'
      const detalles = productos.map((producto) => {
        return {
          idventa: idventa,
          idproducto: producto.idproducto,
          cantidad_vendida: producto.cantidadVendida, // Valor predeterminado para cantidad_vendida
          total: producto.total , // Valor predeterminado para total
        };
      });

      pool.query(
        "INSERT INTO detalle_venta (idventa, idproducto, cantidad_vendida, total) VALUES ?",
        [
          detalles.map((detalle) => [
            detalle.idventa,
            detalle.idproducto,
            detalle.cantidad_vendida,
            detalle.total,
          ]),
        ],
        (error, result) => {
          if (error) throw error;

          // Éxito en la inserción de datos

          // Generar boleta en HTML

          // Enviar la boleta como respuesta
          res.render("ventas");
        }
      );
    });
  } catch (error) {
    console.error("Error al procesar productojson:", error);
    res.status(400).json({ error: "El formato de productojson es incorrecto" });
  }
});












/* PARA MODIFICAR CATEGORIAS
---------------------------------------------------------------------------------------------------- */

module.exports = router;
