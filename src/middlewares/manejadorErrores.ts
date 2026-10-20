// Middlewares de manejo de errores de la API.
// Garantizan que el cliente siempre reciba un JSON controlado,
// nunca un stack trace ni detalles internos de la base.
import type { Request, Response, NextFunction } from "express";

// Responde 404 en JSON cuando se pide una ruta que no existe.
// Debe registrarse después de todos los routers.
export const rutaNoEncontrada = (req: Request, res: Response) => {
  res.status(404).json({ error: "Ruta no encontrada" });
};

// Un error de Prisma trae un "code" de texto como "P2002".
// Lo detectamos por esa forma, sin importar la clase del cliente generado.
const esErrorPrisma = (err: unknown): err is { code: string } =>
  typeof err === "object" &&
  err !== null &&
  "code" in err &&
  typeof (err as { code: unknown }).code === "string" &&
  (err as { code: string }).code.startsWith("P");

// Middleware global de errores: Express lo reconoce porque tiene cuatro parámetros.
// Debe registrarse al final, después de las rutas y de rutaNoEncontrada.
export const manejadorErrores = (err: unknown, req: Request, res: Response, next: NextFunction) => {
  // Si la respuesta ya empezó a enviarse, se la dejamos al manejador por defecto de Express.
  if (res.headersSent) {
    return next(err);
  }

  // El detalle técnico se muestra solo en la consola del servidor.
  console.error(err);

  // JSON mal formado en el cuerpo de la petición: error del cliente.
  if (typeof err === "object" && err !== null && (err as { type?: string }).type === "entity.parse.failed") {
    return res.status(400).json({ error: "El cuerpo de la petición no es un JSON válido" });
  }

  // Errores de Prisma originados por datos del cliente, traducidos a mensajes controlados.
  if (esErrorPrisma(err)) {
    switch (err.code) {
      case "P2002": // Valor duplicado en una columna UNIQUE.
        return res.status(400).json({ error: "El registro ya existe (valor duplicado)" });
      case "P2003": // Falla una clave foránea.
        if (req.method === "DELETE") {
          return res.status(400).json({ error: "No se puede eliminar: existen registros asociados" });
        }
        return res.status(400).json({ error: "Referencia inválida: el registro relacionado no existe" });
      case "P2025": // update/delete sobre un registro que no existe.
        return res.status(404).json({ error: "El registro solicitado no existe" });
    }
  }

  // Cualquier otro error es una falla interna del servidor.
  return res.status(500).json({ error: "Error interno del servidor" });
};