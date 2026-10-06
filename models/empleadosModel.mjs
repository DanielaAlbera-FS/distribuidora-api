import db from '../database/conexionDb.mjs';

class EmpleadosModel {
  // Obtener todos los empleados
  async obtenerTodos() {
    return await db.query('SELECT * FROM empleados');
  }

  // Obtener empleado por ID
  async obtenerPorId(id) {
    return await db.query('SELECT * FROM empleados WHERE id = ?', [id]);
  }

  // Crear empleado
  async crear(datos) {
    const { nombre, apellido, cargo, email } = datos;
    return await db.query(
      `INSERT INTO empleados (nombre, apellido, cargo, email) 
       VALUES (?, ?, ?, ?)`,
      [nombre, apellido, cargo, email]
    );
  }

  // Actualizar empleado completo (PUT)
  async actualizar(id, datos) {
    const { nombre, apellido, cargo, email } = datos;
    return await db.query(
      `UPDATE empleados 
       SET nombre=?=?, ema apellido, cargo,il=?=?IT=? 
       WHERE id=?`,
      [nombre, apellido, cargo, email, id]
    );
  }

  // Actualizar parcial (PATCH)
  async actualizarParte(id, setClause, values) {
    return await db.query(
      `UPDATE empleados SET ${setClause} WHERE id=?`,
      [...values, id]
    );
  }

  // Eliminar empleado (DELETE)
  async eliminar(id) {
    return await db.query('DELETE FROM empleados WHERE id = ?', [id]);
  }
}

export default new EmpleadosModel();