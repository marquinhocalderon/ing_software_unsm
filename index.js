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


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "./src/views"));
console.log(app.get("view engine"));

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
