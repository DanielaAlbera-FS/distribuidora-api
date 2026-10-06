import db from '../database/conexionDb.mjs';

class ProveedoresModel {
  // Obtener todos los proveedores
  async obtenerTodos() {
    return await db.query('SELECT * FROM proveedores');
  }

  // Obtener proveedor por ID
  async obtenerPorId(id) {
    return await db.query('SELECT * FROM proveedores WHERE id = ?', [id]);
  }

  // Crear proveedor
  async crear(datos) {
    const { nombre, telefono, email, direccion, CUIL_CUIT } = datos;
    return await db.query(
      `INSERT INTO proveedores (nombre, telefono, email, direccion, CUIL_CUIT) 
       VALUES (?, ?, ?, ?, ?)`,
      [nombre, telefono, email, direccion, CUIL_CUIT]
    );
  }

  // Actualizar proveedor completo (PUT)
  async actualizar(id, datos) {
    const { nombre, telefono, email, direccion, CUIL_CUIT } = datos;
    return await db.query(
      `UPDATE proveedores 
       SET nombre=?, telefono=?, email=?, direccion=?, CUIL_CUIT=? 
       WHERE id=?`,
      [nombre, telefono, email, direccion, CUIL_CUIT, id]
    );
  }

  // Actualizar parcial (PATCH)
  async actualizarParte(id, setClause, values) {
    return await db.query(
      `UPDATE proveedores SET ${setClause} WHERE id=?`,
      [...values, id]
    );
  }

  // Eliminar proveedor (DELETE)
  async eliminar(id) {
    return await db.query('DELETE FROM proveedores WHERE id = ?', [id]);
  }
}

export default new ProveedoresModel();