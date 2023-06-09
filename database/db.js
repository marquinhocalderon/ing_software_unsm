const mysql = require('mysql2'); // o 'mysql' si prefieres

// Crea el pool de conexiones
const pool = mysql.createPool({
  host: process.env.DB_HOST, 
  user: process.env.DB_USERNAME, 
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DBNAME,
  waitForConnections: true,
  queueLimit: 0
});
// Exporta el pool para que pueda ser utilizado desde otros módulos
module.exports = pool;
