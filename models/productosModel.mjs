import db from '../database/conexionDb.mjs';

// Consulta base compartida con JOIN a proveedores usando los nombres reales de la BD
const CONSULTA_BASE = `
  SELECT p.id, p.nombre, p.id_proveedor, p.precio, p.stock,
         pr.nombre AS proveedor
  FROM productos p
  INNER JOIN proveedores pr ON p.id_proveedor = pr.id`;

class ProductosModel {
  // Obtener todos los productos (con filtro opcional de stock)
  async obtenerTodos(stockMax) {
    if (stockMax !== undefined) {
      return await db.query(`${CONSULTA_BASE} WHERE p.stock <= ? ORDER BY p.id`, [stockMax]);
    }
    return await db.query(`${CONSULTA_BASE} ORDER BY p.id`);
  }

  // Obtener producto por ID
  async obtenerPorId(id) {
    return await db.query(`${CONSULTA_BASE} WHERE p.id = ?`, [id]);
  }

  // Crear producto
  async crear(datos) {
    const { nombre, id_proveedor, precio, stock } = datos;
    return await db.query(
      `INSERT INTO productos (nombre, id_proveedor, precio, stock) 
       VALUES (?, ?, ?, ?)`,
      [nombre, id_proveedor, precio, stock]
    );
  }

  // Actualizar producto completo (PUT)
  async actualizar(id, datos) {
    const { nombre, id_proveedor, precio, stock } = datos;
    return await db.query(
      `UPDATE productos 
       SET nombre=?, id_proveedor=?, precio=?, stock=? 
       WHERE id=?`,
      [nombre, id_proveedor, precio, stock, id]
    );
  }

  // Actualizar parcial (PATCH)
  async actualizarParte(id, setClause, values) {
    return await db.query(
      `UPDATE productos SET ${setClause} WHERE id=?`,
      [...values, id]
    );
  }

  // Eliminar producto
  async eliminar(id) {
    return await db.query('DELETE FROM productos WHERE id = ?', [id]);
  }

  // Resumen por proveedor (COUNT, AVG, SUM)
  async obtenerResumenPorProveedor() {
    return await db.query(
      `SELECT pr.id AS id_proveedor, pr.nombre AS proveedor,
              COUNT(p.id) AS cantidad_productos,
              AVG(p.precio) AS precio_promedio,
              SUM(p.stock) AS stock_total
       FROM productos p
       INNER JOIN proveedores pr ON p.id_proveedor = pr.id
       GROUP BY pr.id, pr.nombre
       ORDER BY pr.id`
    );
  }
}

export default new ProductosModel();