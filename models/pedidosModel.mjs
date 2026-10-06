import db from '../database/conexionDb.mjs';

// Consulta base compartida: pedido con los datos de su cliente, empleado y compañía de envío (JOIN).
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
  // Lista los pedidos con filtros opcionales de estado y fecha (AAAA-MM-DD)
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

    const filtro = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
    return await db.query(`${CONSULTA_BASE} ${filtro} ORDER BY p.id`, valores);
  }

  // Busca un pedido por ID
  async obtenerPorId(id) {
    return await db.query(`${CONSULTA_BASE} WHERE p.id = ?`, [id]);
  }

  // Inserta un pedido nuevo
  async crear(datos) {
    const { fecha, estado, id_cliente, id_empleado, id_compania_envio } = datos;
    return await db.query(
      `INSERT INTO pedidos (fecha, estado, id_cliente, id_empleado, id_compania_envio)
       VALUES (?, ?, ?, ?, ?)`,
      [fecha, estado, id_cliente, id_empleado, id_compania_envio]
    );
  }

  // Reemplaza todos los campos de un pedido (PUT)
  async actualizar(id, datos) {
    const { fecha, estado, id_cliente, id_empleado, id_compania_envio } = datos;
    return await db.query(
      `UPDATE pedidos
       SET fecha = ?, estado = ?, id_cliente = ?, id_empleado = ?, id_compania_envio = ?
       WHERE id = ?`,
      [fecha, estado, id_cliente, id_empleado, id_compania_envio, id]
    );
  }

  // Actualización parcial de pedido (PATCH)
  async actualizarParte(id, setClause, values) {
    return await db.query(
      `UPDATE pedidos SET ${setClause} WHERE id = ?`,
      [...values, id]
    );
  }

  // Elimina un pedido (las líneas de detalle se eliminan en cascada)
  async eliminar(id) {
    return await db.query('DELETE FROM pedidos WHERE id = ?', [id]);
  }

  // Total acumulado del pedido
  async obtenerTotal(idPedido) {
    return await db.query(
      `SELECT COALESCE(SUM(cantidad * precio_unitario), 0) AS total
       FROM detalle_pedido
       WHERE id_pedido = ?`,
      [idPedido]
    );
  }

  // Líneas de detalle de un pedido
  async obtenerLineas(idPedido) {
    return await db.query(
      `SELECT d.id_pedido, d.id_producto, pr.nombre AS producto,
              d.cantidad, d.precio_unitario
       FROM detalle_pedido d
       INNER JOIN productos pr ON d.id_producto = pr.id
       WHERE d.id_pedido = ?
       ORDER BY d.id_producto`,
      [idPedido]
    );
  }

  // Agrega una línea al pedido
  async crearLinea(idPedido, idProducto, cantidad, precioUnitario) {
    return await db.query(
      `INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario)
       VALUES (?, ?, ?, ?)`,
      [idPedido, idProducto, cantidad, precioUnitario]
    );
  }

  // Modifica cantidad y precio de una línea del pedido
  async actualizarLinea(idPedido, idProducto, cantidad, precioUnitario) {
    return await db.query(
      `UPDATE detalle_pedido
       SET cantidad = ?, precio_unitario = ?
       WHERE id_pedido = ? AND id_producto = ?`,
      [cantidad, precioUnitario, idPedido, idProducto]
    );
  }

  // Elimina una línea del pedido
  async eliminarLinea(idPedido, idProducto) {
    return await db.query(
      'DELETE FROM detalle_pedido WHERE id_pedido = ? AND id_producto = ?',
      [idPedido, idProducto]
    );
  }
}

export default new PedidosModel();