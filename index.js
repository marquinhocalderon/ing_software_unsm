const express = require("express");
const pool = require("./database/db");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const brypts = require("bcryptjs");
const bodyParser = require('body-parser');
const cors = require('cors');
const ventasRouter = require('./src/routes/ventas');
const multer = require('multer');
const path = require("path");

const app = express();
app.use("/public", express.static("public"));
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/auth/ventas', ventasRouter);

app.use("/src", express.static("src"));
app.use("/src", express.static(__dirname + "/src"));

const storage = multer.diskStorage({
  destination: path.join(__dirname, "public/uploads"),
  filename: (req, file, cb) => {
    // Obtener la extensión del archivo
    const ext = path.extname(file.originalname);

    // Validar que la extensión sea jpeg, jpg, png o gif
    if (
      ext !== ".jpeg" &&
      ext !== ".jpg" &&
      ext !== ".png" &&
      ext !== ".gif"
    ) {
      return cb(new Error("Solo se permiten archivos JPEG, JPG, PNG y GIF."));
    }

    // Generar el nombre de archivo único
    const uniqueSuffix = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${ext}`;

    cb(null, uniqueSuffix);
  },
});


app.use(
  multer({
    storage,
    dest: path.join(__dirname, "public/uploads"),
  }).single("imagen")
);

app.use(cookieParser());

app.use(
  session({
    key: "my-cookie",
    secret: "my-secret",
    resave: false,
    saveUninitialized: true,
  })
);

const viewsDirectories = [
  path.join(__dirname, "./src/views"),
  path.join(__dirname, "./src/vista_almacenero"),
  path.join(__dirname, "./src/vista_cajero")
];

// Establecer el motor de plantillas y los directorios de vistas
app.set("view engine", "ejs");
app.set("views", viewsDirectories);

//MIS RUTAS
const login = require("./src/routes/login");
app.use(login);
const usuarios = require("./src/routes/usuarios");
app.use(usuarios);
const perfiles= require("./src/routes/perfiles");
app.use(perfiles);
const productos = require("./src/routes/productos");
app.use(productos);
const categoria = require("./src/routes/categoria");
app.use(categoria);
const proveedores = require("./src/routes/proveedores");
app.use(proveedores);
const recuperar = require("./src/routes/recuperar");
app.use(recuperar);
const unidad = require("./src/routes/unidad");
app.use(unidad);
const ventas = require("./src/routes/ventas");
app.use(ventas);
const clientes = require("./src/routes/clientes");
app.use(clientes);
const compras = require("./src/routes/compras");
app.use(compras);
const ingreso_almacen = require("./src/routes/ingreso_almacen");
app.use(ingreso_almacen);
const ingreso_venta = require("./src/routes/ingreso_ventas");
app.use(ingreso_venta);
const loginalmacen = require("./src/rutas_almacenero/almacenero_login")
app.use(loginalmacen)
const productos_almacenero = require("./src/rutas_almacenero/productos_almacenero")
app.use(productos_almacenero)
const unidad_almacenero = require("./src/rutas_almacenero/unidad_almacenero")
app.use(unidad_almacenero)
const categoria_almacenero = require("./src/rutas_almacenero/categoria_almacenero")
app.use(categoria_almacenero)
const proveedores_almacenero = require("./src/rutas_almacenero/proveedores_almacenero")
app.use(proveedores_almacenero)
const compras_almacenero = require("./src/rutas_almacenero/compras_almacenero")
app.use(compras_almacenero)
const lista_compra_almacenero = require("./src/rutas_almacenero/lista_compra_almacenero")
app.use(lista_compra_almacenero)


const logincaja = require("./src/rutas_cajero/login_cajero")
app.use(logincaja)
const clientes_cajero = require("./src/rutas_cajero/clientes_cajero")
app.use(clientes_cajero)
const ventas_cajero = require("./src/rutas_cajero/ventas_cajero")
app.use(ventas_cajero)
const lista_ventas = require("./src/rutas_cajero/facturaciones_cajero")
app.use(lista_ventas)


// reportes ventas
const reporteventas = require("./src/routes/reporteventas")
app.use(reporteventas)

// reportes compras
const reportecompras = require("./src/routes/reportecompras")
app.use(reportecompras)




//PRUEBA DE LA CONEXION A LA BASE DE DATOS MYSQL
pool.getConnection((err, connection) => {
  if (err) {
    console.error("Error al conectar a la base de datos:", err);
    return;
  } else {
    console.log("Conexión a la base de datos de mysql con éxito!");
  }
});







// El puerto de local host para ver en el navegador
app.listen(3000, () => {
  console.log(
    "El servidor esta corriendo el puerto 3000 ---> " + "http://localhost:3000/"
  );
});
