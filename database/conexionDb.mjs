// Configuración del Connection Pool de MySQL.
// Se utiliza mysql2/promise para trabajar con async/await.
// El pool se crea una única vez y es reutilizado por todos los modelos.
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  // Credencial local: cada integrante la ajusta en su equipo.
  // No se debe subir una contraseña real al repositorio.
  password: '',
  database: 'distribuidora',
  waitForConnections: true, // Si todas las conexiones están ocupadas, la petición espera su turno.
  connectionLimit: 10, // Máximo de conexiones abiertas simultáneamente.
  queueLimit: 0 // Sin límite de peticiones en espera.
});

export default pool;