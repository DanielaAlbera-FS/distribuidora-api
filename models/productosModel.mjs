// Modelo del recurso productos.
// Capa de acceso a datos: ejecuta exclusivamente consultas SQL parametrizadas
// mediante el pool de conexiones. No conoce req ni res y no valida datos.
// Cada método devuelve el resultado crudo de pool.query:
//   SELECT                  -> [filas, campos]
//   INSERT / UPDATE / DELETE -> [resultado, campos], con insertId y affectedRows.
import pool from '../config/db.mjs';

// Consulta base compartida: producto junto con el nombre de su proveedor (JOIN).
const CONSULTA_BASE = `
  SELECT p.id, p.nombre, p.precio, p.stock, p.id_proveedor,
         pr.nombre AS proveedor
  FROM productos p
  INNER JOIN proveedores pr ON p.id_proveedor = pr.id`;

class ProductosModel {
  // Lista los productos. Si se recibe stockMax, devuelve solo los de stock menor o igual.
  async obtenerTodos(stockMax) {
    if (stockMax !== undefined) {
      return await pool.query(`${CONSULTA_BASE} WHERE p.stock <= ? ORDER BY p.id`, [stockMax]);
    }
    return await pool.query(`${CONSULTA_BASE} ORDER BY p.id`);
  }

  // Busca un producto por id.
  async obtenerPorId(id) {
    return await pool.query(`${CONSULTA_BASE} WHERE p.id = ?`, [id]);
  }

  // Inserta un producto nuevo.
  async crear(nombre, precio, stock, idProveedor) {
    return await pool.query(
      'INSERT INTO productos (nombre, precio, stock, id_proveedor) VALUES (?, ?, ?, ?)',
      [nombre, precio, stock, idProveedor]
    );
  }

  // Reemplaza todos los campos de un producto.
  async actualizar(id, nombre, precio, stock, idProveedor) {
    return await pool.query(
      'UPDATE productos SET nombre = ?, precio = ?, stock = ?, id_proveedor = ? WHERE id = ?',
      [nombre, precio, stock, idProveedor, id]
    );
  }

  // Elimina un producto. Si figura en algún pedido, MySQL lo rechaza (error 1451)
  // y el middleware global lo traduce a un 400.
  async eliminar(id) {
    return await pool.query('DELETE FROM productos WHERE id = ?', [id]);
  }

  // Resumen por proveedor: cantidad de productos, precio promedio y stock total
  // (funciones de agregación COUNT, AVG y SUM con GROUP BY).
  async obtenerResumenPorProveedor() {
    return await pool.query(
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