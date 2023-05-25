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
router.get("/auth/lista", requireAuth, async function (req, res) {
  pool.query(
    "SELECT p.*,c.nombre_categoria AS nombre_categoria, u.nombre_unidad AS nombre_unidad " +
      "FROM productos p " +
      "JOIN categoria c ON p.idcategoria = c.idcategoria " +
      "JOIN unidad u ON p.idunidad = u.idunidad " +
      "ORDER BY p.idproducto ASC", // Add ORDER BY clause to sort products in descending order based on ID
    function (error, productos, fields) {
      if (error) throw error;

      pool.query(
        'SELECT idproveedor, nombre_empresa FROM proveedores  WHERE estado_proveedor = "Activo" ',
        function (error, proveedores, fields3) {
          if (error) throw error;

          pool.query(
            'SELECT * FROM categoria WHERE estado_categoria = "Activo"',
            function (error, categorias, fields3) {
              if (error) throw error;
              pool.query(
                'SELECT * FROM unidad  WHERE estado_unidad = "Activo" ',
                function (error, unidades, fields3) {
                  if (error) throw error;
                  res.render("productos", {
                    proveedores: proveedores,
                    proveedorid: Object.values(proveedores).map(
                      (proveedor) => proveedor.idproveedor
                    ),
                    categorias: categorias,
                    productos: productos,
                    unidades: unidades,
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

router.post("/auth/lista", function (req, res) {
  const codigoProducto = req.body.codigo_producto;
  const nombreProducto = req.body.nombre_producto;
  const descripcion = req.body.descripcion;
  const stock = req.body.stock;
  const precio_venta = req.body.precio_venta;
  const estadoProducto = req.body.estado_producto;
  const idCategoria = req.body.nombre_categoria;
  const idUnidad = req.body.nombre_unidad;

  // Realizar la consulta para validar el código de producto existente
  const checkQuery = "SELECT * FROM productos WHERE codigo_producto = ?";
  const checkValues = [codigoProducto];

  pool.query(checkQuery, checkValues, function (checkError, checkResult) {
    if (checkError) throw checkError;

    // Verificar si el código de producto ya existe
    if (checkResult.length > 0) {
      // El código de producto ya existe, puedes manejar la respuesta apropiada aquí

      // Realizar una consulta SELECT desde la tabla categoría
      const selectCategoriaQuery = "SELECT * FROM categoria";
      const selectUnidadQuery = "SELECT * FROM unidad";

      pool.query(selectCategoriaQuery, function (selectCategoriaError, selectCategoriaResult) {
        if (selectCategoriaError) throw selectCategoriaError;

        // Aquí tienes el resultado de la consulta a la tabla categoría (selectCategoriaResult)
        // Puedes utilizarlo según tus necesidades

        pool.query(selectUnidadQuery, function (selectUnidadError, selectUnidadResult) {
          if (selectUnidadError) throw selectUnidadError;

          // Aquí tienes el resultado de la consulta a la tabla unidad (selectUnidadResult)
          // Puedes utilizarlo según tus necesidades

          res.render("productos", {
            productos: checkResult,
            name: "Administrador",
            alert: true,
            alertTitle: "Error",
            alertMessage: "Hubo un error en la solicitud , No puede repetir el Codigo del Producto",
            alertIcon: "error",
            showConfirmButton: true,
            timer: false,
            ruta: req.path,
            categorias: selectCategoriaResult, // Agregar el resultado de la consulta a la variable categorias
            unidades: selectUnidadResult // Agregar el resultado de la consulta a la variable unidades
          });
        });
      });
    } else {
      // El código de producto es único, realizar la inserción en la base de datos
      const insertQuery =
        "INSERT INTO productos (codigo_producto, nombre_producto, idcategoria, idunidad, stock, precio_venta, descripcion, estado_producto) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
      const insertValues = [
        codigoProducto,
        nombreProducto,
        idCategoria,
        idUnidad,
        stock,
        precio_venta,
        descripcion,
        estadoProducto,
      ];

      pool.query(insertQuery, insertValues, function (insertError, insertResult) {
        if (insertError) throw insertError;

        // Realizar las acciones necesarias después de la inserción, como redirigir o enviar una respuesta al cliente
        res.redirect("/auth/lista");
      });
    }
  });
});



//editas productos

// ...

router.get("/auth/lista/:id", requireAuth, async function (req, res) {
  try {
    const { id } = req.params;

    pool.query(
      "SELECT p.*, c.nombre_categoria AS nombre_categoria, u.nombre_unidad AS nombre_unidad " +
      "FROM productos p " +
      "JOIN categoria c ON p.idcategoria = c.idcategoria " +
      "JOIN unidad u ON p.idunidad = u.idunidad " +
      "WHERE p.idproducto = ? " +
      "ORDER BY p.idproducto ASC",
      [id],
      function (error, results, fields) {
        if (error) {
          throw error;
        }
        // Envía los resultados en formato json
        res.json(results);
      }
    );
  } catch (error) {
    // Manejar errores aquí
    console.error(error);
    res.status(500).send("Error en el servidor");
  }
});




router.get("/auth/categoria1", async function (req, res) {
  pool.query("SELECT * FROM categoria", function (error, results, fields) {
    if (error) throw error;
    res.json(results);
  });
});




router.get("/auth/unidad1", async function (req, res) {
  pool.query("SELECT * FROM unidad", function (error, results, fields) {
    if (error) throw error;
    res.json(results);
  });
});

router.post("/auth/actualizar/:id", async function (req, res) {
  const codigoProducto = req.body.codigo_producto;
  const nombreProducto = req.body.nombre_producto;
  const stock = req.body.stock;
  const precio_venta = req.body.precio_venta;
  const descripcion = req.body.descripcion;
  const estadoProducto = req.body.estado_producto;
  const idCategoria = req.body.nombre_categoria;
  const idUnidad = req.body.nombre_unidad;
  const { id } = req.params; // Agrega esta línea para obtener el valor de id_producto
  // Verificar la carga útil de la solicitud

  try {
    await pool
      .promise()
      .query(
        "UPDATE productos SET codigo_producto = ?, nombre_producto = ?,  idcategoria = ?, idunidad = ?, stock=?, precio_venta =?, descripcion = ?, estado_producto =? WHERE idproducto = ?",
        [
          codigoProducto,
          nombreProducto,
          idCategoria,
          idUnidad,
          stock,
          precio_venta,
          descripcion,
          estadoProducto,
          id,
        ]
      );

    res.redirect("/auth/lista");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al actualizar");
  }
});

router.delete("/auth/eliminarcliente/:idproducto", async function (req, res) {
  const idproducto = req.params.idproducto;
  try {
    const [results, fields] = await pool
      .promise()
      .query("DELETE FROM productos WHERE idproducto= ?", [idproducto]);
    res.sendStatus(200); // Respuesta exitosa
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al eliminar el cliente"); // Error en el servidor
  }
});

module.exports = router;
