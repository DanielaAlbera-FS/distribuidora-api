// Middlewares de manejo de errores de la API.
// Garantizan que el cliente siempre reciba un JSON controlado
// y que nunca se exponga un stack trace ni detalles internos de SQL.

// Responde 404 en formato JSON cuando se solicita una ruta inexistente.
// Debe registrarse después de todos los routers.
export const rutaNoEncontrada = (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
};

// Middleware global de errores (Express lo identifica por sus cuatro parámetros).
// Debe registrarse al final, después de las rutas y de rutaNoEncontrada.
export const manejadorErrores = (err, req, res, next) => {
  // Si la respuesta ya comenzó a enviarse, se delega en el manejador por defecto de Express.
  if (res.headersSent) {
    return next(err);
  }

  // El detalle técnico se registra únicamente en la consola del servidor.
  console.error(err);

  // Cuerpo de la petición con JSON mal formado: error del cliente.
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido' });
  }

  // Errores de MySQL originados por datos del cliente, traducidos a mensajes controlados.
  switch (err.errno) {
    case 1451: // Se intenta borrar un registro referenciado por otros (ON DELETE RESTRICT).
      return res.status(400).json({ error: 'No se puede eliminar: existen registros asociados' });
    case 1452: // Clave foránea que apunta a un registro inexistente.
      return res.status(400).json({ error: 'Referencia inválida: el registro relacionado no existe' });
    case 1062: // Clave primaria duplicada (mismo producto repetido en un pedido).
      return res.status(400).json({ error: 'El registro ya existe' });
    default:
      // Cualquier otro error se considera una falla interna del servidor.
      return res.status(500).json({ error: 'Error interno del servidor' });
  }
};