const mysql = require('mysql2'); // o 'mysql' si prefieres

// Crea el pool de conexiones
const pool = mysql.createPool({
  host: 'buh5pev0wmpkxzzzunkj-mysql.services.clever-cloud.com',
  user: 'uxsvg0q0r58hniyu',
  password: 'BOHAFwBGKvil2t1JoGSO',
  port: 3306,
  database: 'buh5pev0wmpkxzzzunkj'
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
