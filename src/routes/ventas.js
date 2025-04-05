const express = require("express");
const pool = require("../../database/db");
const bcryptjs = require("bcryptjs");
const router = express.Router();
const axios = require("axios");


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

    const clientes = await new Promise((resolve, reject) => {
      pool.query(
        "SELECT * FROM clientes",
        function (error, clientes, fields) {
          if (error) reject(error);
          resolve(clientes);
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
        `SELECT serie, numero_correlativo, tipo_comprobante, idventa
        FROM ventas
        WHERE tipo_comprobante = 'factura'
        ORDER BY idventa DESC
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
        `SELECT serie, numero_correlativo, tipo_comprobante, idventa
        FROM ventas
        WHERE tipo_comprobante = 'boleta'
        ORDER BY idventa DESC
        LIMIT 1;
        `,
        function (error, boleta, fields) {
          if (error) reject(error);
          resolve(boleta);
        }
      );
    });

    const idUsuario = req.session.idusuario;
    res.render("ventas", {
      idUsuario: idUsuario,
      compras: data,
      clientes: clientes,
      productos: productos,
      factura: facturaResult[0],
      boleta: boletaResult[0],
    });

    console.log(facturaResult, boletaResult);
  } catch (error) {
    throw error;
  }
});

router.post("/auth/ventas", (req, res) => {
  const idUsuario = req.session.idusuario;
  const {
    fecha_venta,
    tipo_comprobante,
    serie,
    numero_correlativo,
    subtotal,
    igv,
    totalventa,
    montocancelado,
    vuelto,
    idcliente,
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
        const { idproducto, cantidad, Total } =
          productosArray[i];
        productos.push({
          idproducto,
          cantidad,
          Total,
        });
      }
    }

    console.log(productos);

    

    // Insertar los datos de compra en la tabla 'compras'
    const venta = {
      idusuario: idUsuario, // Utilizar idUsuario en lugar de idusuario
      idcliente: idcliente,
      fecha_venta: fecha_venta,
      tipo_comprobante: tipo_comprobante,
      serie: serie,
      numero_correlativo: numero_correlativo,
      subtotal: subtotal,
      igv: igv,
      totalventa: totalventa,
      montocancelado: montocancelado,
      vuelto: vuelto,
    };

    pool.query("INSERT INTO ventas SET ?", venta, (error, result) => {
      if (error) throw error;

      const idventa = result.insertId;

      // Insertar los detalles de compra en la tabla 'detalle_compras'
      const detalles = productos.map((producto) => {
        return {
          idventa: idventa,
          idproducto: producto.idproducto,
          cantidad: producto.cantidad,
          total: producto.Total,
        };
      });

      pool.query(
        "INSERT INTO detalle_venta (idventa, idproducto, cantidad_vendida, total) VALUES ?",
        [
          detalles.map((detalle) => [
            detalle.idventa,
            detalle.idproducto,
            detalle.cantidad,
            detalle.total,
          ]),
        ],
        (error, result) => {
          if (error) throw error;

          
          // Actualizar el stock de productos vendidos
          productos.forEach((producto) => {
            const { idproducto, cantidad } = producto;

            // Restar la cantidad vendida al stock actual
            const consultaSQL = "UPDATE productos SET stock = stock - ? WHERE idproducto = ?";
            pool.query(consultaSQL, [cantidad, idproducto], (error, result) => {
              if (error) {
                console.error("Error al actualizar el stock del producto:", error);
                // Manejar el error de actualización del stock, si es necesario
                // ...
              }
            });
          });

          // Éxito en la inserción de datos

          // Realizar la consulta SELECT para obtener todos los proveedores
          pool.query("SELECT * FROM clientes", (error, clientes) => {
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
                  `SELECT serie, numero_correlativo, tipo_comprobante, idventa
                  FROM ventas 
                  WHERE tipo_comprobante = 'factura'
                  ORDER BY idventa DESC
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
                      `  SELECT serie, numero_correlativo, tipo_comprobante, idventa
                      FROM ventas
                      WHERE tipo_comprobante = 'boleta'
                      ORDER BY idventa DESC
                      LIMIT 1;
                      
                      `,
                      (error, boleta) => {
                        if (error) {
                          console.error("Error al obtener correlativo:", error);
                          return res.status(500).json({
                            error: "Ocurrió un error al obtener el correlativo",
                          });
                        }

                        res.render("ventas", {
                          boleta: boleta[0],
                          factura: factura[0],
                          idUsuario: idUsuario,
                          productos: productos,
                          clientes: clientes,
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
    const consultaSQL = "SELECT * FROM clientes;";
    pool.query(consultaSQL, (err, resultados) => {
      if (err) {
        console.error("Error al obtener proveedores:", err);
        // Manejar el error al obtener los proveedores, si es necesario
        // ...
      } else {
        // Renderizar la vista "compras" con los datos obtenidos
        res.render("ventas", {
          idUsuario: idUsuario,
          productos: productos,
          clientes: resultados, // Utilizar los resultados de la consulta
          alert: true,
          alertTitle: "Error",
          alertMessage:
            "No has insertado los productos en la tabla. Por favor, inserta los productos.",
          alertIcon: "error",
          showConfirmButton: true,
          timer: false,
          ruta: "ventas",
        });
      }
    });
  }
});

















/* PARA MODIFICAR CATEGORIAS
---------------------------------------------------------------------------------------------------- */

module.exports = router;
