const express = require("express");
const pool = require("../../database/db");
const bcryptjs = require("bcryptjs");
const router = express.Router();
const axios = require("axios");

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

/* PARA INSERTAR PRODUCTOS
----------------------------------------------------------------------------------------------------  WHERE categoria.estado= "Activo" */
router.get("/auth/compras", async function (req, res) {
  try {
    const data = await new Promise((resolve, reject) => {
      pool.query(
        "SELECT c.*, p.nombre_empresa AS nombre_proveedor, dc.* " +
          "FROM compras c " +
          "JOIN proveedores p ON c.idproveedor = p.idproveedor " +
          "JOIN detalle_compras dc ON c.idcompra = dc.idcompra",
        function (error, data, fields) {
          if (error) reject(error);
          resolve(data);
        }
      );
    });

    const proveedores = await new Promise((resolve, reject) => {
      pool.query(
        "SELECT * FROM proveedores",
        function (error, proveedores, fields) {
          if (error) reject(error);
          resolve(proveedores);
        }
      );
    });

    const productos = await new Promise((resolve, reject) => {
      pool.query(
        "SELECT p.*,c.nombre_categoria AS nombre_categoria, u.nombre_unidad AS nombre_unidad " +
          "FROM productos p " +
          "JOIN categoria c ON p.idcategoria = c.idcategoria " +
          "JOIN unidad u ON p.idunidad = u.idunidad " +
          "ORDER BY p.idproducto ASC",
        function (error, productos, fields) {
          if (error) reject(error);
          resolve(productos);
        }
      );
    });
    const facturaResult = await new Promise((resolve, reject) => {
      pool.query(
        `SELECT serie, numero_correlativo, tipo_comprobante, idcompra
        FROM compras
        WHERE tipo_comprobante = 'factura'
        ORDER BY idcompra DESC
        LIMIT 1;
        `,
        function (error, factura, fields) {
          if (error) reject(error);
          resolve(factura);
        }
      );
    });

    const boletaResult = await new Promise((resolve, reject) => {
      pool.query(
        `SELECT serie, numero_correlativo, tipo_comprobante, idcompra
        FROM compras
        WHERE tipo_comprobante = 'boleta'
        ORDER BY idcompra DESC
        LIMIT 1;
        `,
        function (error, boleta, fields) {
          if (error) reject(error);
          resolve(boleta);
        }
      );
    });

    const idUsuario = req.session.idusuario;
    res.render("compras", {
      idUsuario: idUsuario,
      compras: data,
      proveedores: proveedores,
      productos: productos,
      factura: facturaResult[0],
      boleta: boletaResult[0],
    });

    console.log(facturaResult, boletaResult);
  } catch (error) {
    throw error;
  }
});

router.get("/api/proveedor", async function (req, res) {
  const proveedor = req.query.ruc;

  // Realizar la consulta a la base de datos para obtener los datos del proveedor según el RUC
  pool.query(
    "SELECT * FROM proveedores WHERE ruc = ?",
    [proveedor],
    function (error, results, fields) {
      if (error) {
        console.error("Error al obtener los datos del proveedor:", error);
        res
          .status(500)
          .json({ error: "Error al obtener los datos del proveedor" });
      } else {
        // Verificar si se encontraron resultados
        if (results.length > 0) {
          // Devolver el primer resultado encontrado en formato JSON
          res.json(results[0]);
        } else {
          // No se encontró ningún proveedor con el RUC especificado
          res.status(404).json({ error: "Esta pagina no encontrado" });
        }
      }
    }
  );
});

router.post("/auth/compras", (req, res) => {
  const idUsuario = req.session.idusuario;
  const {
    idusuario,
    fecha_compra,
    tipo_comprobante,
    serie,
    numero_correlativo,
    subtotal,
    igv,
    totalcompra,
    idproveedor,
    comprasjson,
  } = req.body;

  // Verificar el contenido de comprasjson
  console.log(comprasjson);

  // Convertir comprasjson en un arreglo
  let productos = [];

  try {
    // Parsear el JSON si comprasjson es un string
    const productosArray = Array.isArray(comprasjson)
      ? comprasjson
      : JSON.parse(comprasjson);

    // Recorrer el arreglo y obtener los valores de idproducto, cantidad, unidadMedida, precioUnitario y total
    for (let i = 0; i < productosArray.length; i++) {
      if (productosArray[i].hasOwnProperty("idproducto")) {
        const { idproducto, cantidad, precioUnitario, Total } =
          productosArray[i];
        productos.push({
          idproducto,
          cantidad,
          precioUnitario,
          Total,
        });
      }
    }

    console.log(productos);

    // Insertar los datos de compra en la tabla 'compras'
    const compra = {
      idusuario: idUsuario, // Utilizar idUsuario en lugar de idusuario
      idproveedor: idproveedor,
      fecha_compra: fecha_compra,
      tipo_comprobante: tipo_comprobante,
      serie: serie,
      numero_correlativo: numero_correlativo,
      subtotal: subtotal,
      igv: igv,
      totalcompra: totalcompra,
      estado_compra: "Pendiente",
    };

    pool.query("INSERT INTO compras SET ?", compra, (error, result) => {
      if (error) throw error;

      const idcompra = result.insertId;

      // Insertar los detalles de compra en la tabla 'detalle_compras'
      const detalles = productos.map((producto) => {
        return {
          idcompra: idcompra,
          idproducto: producto.idproducto,
          cantidad: producto.cantidad,
          precio_compra: producto.precioUnitario,
          total: producto.Total,
        };
      });

      pool.query(
        "INSERT INTO detalle_compras (idcompra, idproducto, cantidad, precio_compra, total) VALUES ?",
        [
          detalles.map((detalle) => [
            detalle.idcompra,
            detalle.idproducto,
            detalle.cantidad,
            detalle.precio_compra,
            detalle.total,
          ]),
        ],
        (error, result) => {
          if (error) throw error;

          // Éxito en la inserción de datos

          // Realizar la consulta SELECT para obtener todos los proveedores
          pool.query("SELECT * FROM proveedores", (error, proveedores) => {
            if (error) {
              console.error("Error al obtener proveedores:", error);
              return res.status(500).json({ error: "Ocurrió un error al obtener los proveedores" });
            }

            // Realizar la consulta SELECT para obtener todos los productos
            pool.query(
              "SELECT p.*,c.nombre_categoria AS nombre_categoria, u.nombre_unidad AS nombre_unidad " +
              "FROM productos p " +
              "JOIN categoria c ON p.idcategoria = c.idcategoria " +
              "JOIN unidad u ON p.idunidad = u.idunidad " +
              "ORDER BY p.idproducto ASC",
              (error, productos) => {
                if (error) {
                  console.error("Error al obtener productos:", error);
                  return res.status(500).json({
                    error: "Ocurrió un error al obtener los productos",
                  });
                }

                pool.query(
                  `SELECT serie, numero_correlativo, tipo_comprobante, idcompra
                  FROM compras
                  WHERE tipo_comprobante = 'factura'
                  ORDER BY idcompra DESC
                  LIMIT 1;
                  `,
                  (error, factura) => {
                    if (error) {
                      console.error("Error al obtener correlativo:", error);
                      return res.status(500).json({
                        error: "Ocurrió un error al obtener el correlativo",
                      });
                    }

                    pool.query(
                      `SELECT serie, numero_correlativo, tipo_comprobante, idcompra
                      FROM compras
                      WHERE tipo_comprobante = 'boleta'
                      ORDER BY idcompra DESC
                      LIMIT 1;
                      `,
                      (error, boleta) => {
                        if (error) {
                          console.error("Error al obtener correlativo:", error);
                          return res.status(500).json({
                            error: "Ocurrió un error al obtener el correlativo",
                          });
                        }

                        res.render("compras", {
                          boleta: boleta[0],
                          factura: factura[0],
                          idUsuario: idUsuario,
                          productos: productos,
                          proveedores: proveedores,
                        });
                      }
                    );
                  }
                );
              }
            );
          }
    )});
      }
    );
  } catch (error) {
    console.error("Error al procesar comprasjson:", error);
    const consultaSQL = "SELECT * FROM proveedores;";
    pool.query(consultaSQL, (err, resultados) => {
      if (err) {
        console.error("Error al obtener proveedores:", err);
        // Manejar el error al obtener los proveedores, si es necesario
        // ...
      } else {
        // Renderizar la vista "compras" con los datos obtenidos
        res.render("compras", {
          idUsuario: idUsuario,
          productos: productos,
          proveedores: resultados, // Utilizar los resultados de la consulta
          alert: true,
          alertTitle: "Error",
          alertMessage:
            "No has insertado los productos en la tabla. Por favor, inserta los productos.",
          alertIcon: "error",
          showConfirmButton: true,
          timer: false,
          ruta: "compras",
        });
      }
    });
  }
});


module.exports = router;
