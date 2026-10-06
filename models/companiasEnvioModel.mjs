import db from '../database/conexionDb.mjs';

class CompaniasEnvioModel {
  // Obtener todas las compañías de envío
  async obtenerTodos() {
    return await db.query('SELECT * FROM companias_envio');
  }

  // Obtener compañía de envío por ID
  async obtenerPorId(id) {
    return await db.query('SELECT * FROM companias_envio WHERE id = ?', [id]);
  }

  // Crear compañía de envío
  async crear(datos) {
    const { nombre, telefono } = datos;
    return await db.query(
      `INSERT INTO companias_envio (nombre, telefono) 
       VALUES (?, ?)`,
      [nombre, telefono]
    );
  }

  // Actualizar compañía de envío completa (PUT)
  async actualizar(id, datos) {
    const { nombre, telefono } = datos;
    return await db.query(
      `UPDATE companias_envio 
       SET nombre=?, telefono=? 
       WHERE id=?`,
      [nombre, telefono, id]
    );
  }

  // Actualizar parcial (PATCH)
  async actualizarParte(id, setClause, values) {
    return await db.query(
      `UPDATE companias_envio SET ${setClause} WHERE id=?`,
      [...values, id]
    );
  }

  // Eliminar compañía de envío (DELETE)
  async eliminar(id) {
    return await db.query('DELETE FROM companias_envio WHERE id = ?', [id]);
  }
}

export default new CompaniasEnvioModel();