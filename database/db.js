const mysql = require('mysql2'); // o 'mysql' si prefieres

// Crea el pool de conexiones
const pool = mysql.createPool({
  host: 'bt1smpsjp9qigmz6opgy-mysql.services.clever-cloud.com',
  user: 'ufjxjnwqralpcyhd',
  password: 'KA1MkRv4zRGd2FsJlHHa',
  port: 3306,
  database: 'bt1smpsjp9qigmz6opgy'
});

// // Crea el pool de conexiones
// const pool = mysql.createPool({
//   host: 'localhost',
//   user: 'root',
//   password: 'marquinho1701',
//   port: 3306,
//   database: 'ingenieria'
// });
// Exporta el pool para que pueda ser utilizado desde otros módulos
module.exports = pool;
