const mysql = require('mysql2'); // o 'mysql' si prefieres

// Crea el pool de conexiones
const pool = mysql.createPool({
  host: "buh5pev0wmpkxzzzunkj-mysql.services.clever-cloud.com",
  user: "uxsvg0q0r58hniyu",
  password: "BOHAFwBGKvil2t1JoGSO",
  database: "buh5pev0wmpkxzzzunkj",
  waitForConnections: true,
  connectionLimit: Infinity, // Establece un límite de conexiones muy alto // Establece un tiempo de espera infinito
});
// Exporta el pool para que pueda ser utilizado desde otros módulos
module.exports = pool;
