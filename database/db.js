const mysql = require('mysql2'); // o 'mysql' si prefieres

// Crea el pool de conexiones
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  port: 3306,
  database: 'proyecto'
});
// Exporta el pool para que pueda ser utilizado desde otros módulos
module.exports = pool;
