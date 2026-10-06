import db from '../database/conexionDb.mjs';

class ClientesModel {
  // Obtener todos los clientes
  async obtenerTodos() {
    return await db.query('SELECT * FROM clientes');
  }

  // Obtener cliente por ID
  async obtenerPorId(id) {
    return await db.query('SELECT * FROM clientes WHERE id = ?', [id]);
  }

  // Crear cliente
  async crear(datos) {
    const { nombre, telefono, email, direccion, CUIL_CUIT } = datos;
    return await db.query(
      `INSERT INTO clientes (nombre, telefono, email, direccion, CUIL_CUIT) 
       VALUES (?, ?, ?, ?, ?)`,
      [nombre, telefono, email, direccion, CUIL_CUIT]
    );
  }

  // Actualizar cliente completo (PUT)
  async actualizar(id, datos) {
    const { nombre, telefono, email, direccion, CUIL_CUIT } = datos;
    return await db.query(
      `UPDATE clientes 
       SET nombre=?, telefono=?, email=?, direccion=?, CUIL_CUIT=? 
       WHERE id=?`,
      [nombre, telefono, email, direccion, CUIL_CUIT, id]
    );
  }

  // Actualizar parcial (PATCH)
  async actualizarParte(id, setClause, values) {
    return await db.query(
      `UPDATE clientes SET ${setClause} WHERE id=?`,
      [...values, id]
    );
  }

  // Eliminar cliente (DELETE)
  async eliminar(id) {
    return await db.query('DELETE FROM clientes WHERE id = ?', [id]);
  }
}

export default new ClientesModel();