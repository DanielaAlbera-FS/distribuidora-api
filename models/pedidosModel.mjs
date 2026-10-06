// Modelo del recurso pedidos y de su detalle (tabla detalle_pedido).
// Capa de acceso a datos: ejecuta exclusivamente consultas SQL parametrizadas
// mediante el pool de conexiones. No conoce req ni res y no valida datos.
// Cada método devuelve el resultado crudo de pool.query:
//   SELECT                  -> [filas, campos]
//   INSERT / UPDATE / DELETE -> [resultado, campos], con insertId y affectedRows.
import pool from '../config/db.mjs';

// Consulta base compartida: pedido con los datos de su cliente, empleado y compañía de envío (JOIN).
// La fecha se formatea en la base para evitar desfases de zona horaria en el JSON.
const CONSULTA_BASE = `
  SELECT p.id, DATE_FORMAT(p.fecha, '%Y-%m-%d') AS fecha, p.estado,
         p.id_cliente, c.nombre AS cliente,
         p.id_empleado, CONCAT(e.nombre, ' ', e.apellido) AS empleado,
         p.id_compania_envio, ce.nombre AS compania_envio
  FROM pedidos p
  INNER JOIN clientes c ON p.id_cliente = c.id
  INNER JOIN empleados e ON p.id_empleado = e.id
  INNER JOIN companias_envio ce ON p.id_compania_envio = ce.id`;

class PedidosModel {
  // Lista los pedidos. Acepta los filtros opcionales estado y fecha (AAAA-MM-DD).
  async obtenerTodos(estado, fecha) {
    const condiciones = [];
    const valores = [];

    if (estado !== undefined) {
      condiciones.push('p.estado = ?');
      valores.push(estado);
    }
    if (fecha !== undefined) {
      condiciones.push('p.fecha = ?');
      valores.push(fecha);
    }

    // Solo se concatenan fragmentos fijos; los valores del cliente viajan siempre por "?".
    const filtro = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
    return await pool.query(`${CONSULTA_BASE} ${filtro} ORDER BY p.id`, valores);
  }

  // Busca un pedido por id.
  async obtenerPorId(id) {
    return await pool.query(`${CONSULTA_BASE} WHERE p.id = ?`, [id]);
  }

  // Inserta un pedido nuevo.
  async crear(fecha, estado, idCliente, idEmpleado, idCompaniaEnvio) {
    return await pool.query(
      `INSERT INTO pedidos (fecha, estado, id_cliente, id_empleado, id_compania_envio)
       VALUES (?, ?, ?, ?, ?)`,
      [fecha, estado, idCliente, idEmpleado, idCompaniaEnvio]
    );
  }

  // Reemplaza todos los campos de un pedido.
  async actualizar(id, fecha, estado, idCliente, idEmpleado, idCompaniaEnvio) {
    return await pool.query(
      `UPDATE pedidos
       SET fecha = ?, estado = ?, id_cliente = ?, id_empleado = ?, id_compania_envio = ?
       WHERE id = ?`,
      [fecha, estado, idCliente, idEmpleado, idCompaniaEnvio, id]
    );
  }

  // Elimina un pedido. Sus líneas de detalle se eliminan en cascada (ON DELETE CASCADE).
  async eliminar(id) {
    return await pool.query('DELETE FROM pedidos WHERE id = ?', [id]);
  }

  // Total del pedido: suma de cantidad * precio_unitario (función de agregación SUM).
  // Si el pedido no tiene líneas, COALESCE devuelve 0 en lugar de NULL.
  async obtenerTotal(idPedido) {
    return await pool.query(
      `SELECT COALESCE(SUM(cantidad * precio_unitario), 0) AS total
       FROM detalle_pedido
       WHERE id_pedido = ?`,
      [idPedido]
    );
  }

  // Líneas de detalle de un pedido, con el nombre de cada producto (JOIN).
  async obtenerLineas(idPedido) {
    return await pool.query(
      `SELECT d.id_pedido, d.id_producto, pr.nombre AS producto,
              d.cantidad, d.precio_unitario
       FROM detalle_pedido d
       INNER JOIN productos pr ON d.id_producto = pr.id
       WHERE d.id_pedido = ?
       ORDER BY d.id_producto`,
      [idPedido]
    );
  }

  // Agrega una línea al pedido. Si el producto ya figura en el pedido, MySQL lo rechaza
  // por la clave primaria compuesta (error 1062).
  async crearLinea(idPedido, idProducto, cantidad, precioUnitario) {
    return await pool.query(
      `INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario)
       VALUES (?, ?, ?, ?)`,
      [idPedido, idProducto, cantidad, precioUnitario]
    );
  }

  // Modifica la cantidad y el precio de una línea del pedido.
  async actualizarLinea(idPedido, idProducto, cantidad, precioUnitario) {
    return await pool.query(
      `UPDATE detalle_pedido
       SET cantidad = ?, precio_unitario = ?
       WHERE id_pedido = ? AND id_producto = ?`,
      [cantidad, precioUnitario, idPedido, idProducto]
    );
  }

  // Elimina una línea del pedido.
  async eliminarLinea(idPedido, idProducto) {
    return await pool.query(
      'DELETE FROM detalle_pedido WHERE id_pedido = ? AND id_producto = ?',
      [idPedido, idProducto]
    );
  }
}

export default new PedidosModel();