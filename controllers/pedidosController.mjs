// Controlador del recurso pedidos y de su detalle.
// Recibe las peticiones HTTP, valida los datos, delega el acceso a datos en el modelo
// y arma la respuesta con el código de estado correspondiente.
// Los errores inesperados se derivan al middleware global con next(error).
// Los métodos no usan "this" porque el router los recibe como funciones sueltas.
import pedidosModel from '../models/pedidosModel.mjs';

const MAX_INT = 2147483647; // Límite del tipo INT de MySQL.
const MAX_PRECIO = 99999999.99; // Límite del tipo DECIMAL(10,2).
const ESTADOS_VALIDOS = ['pendiente', 'enviado', 'entregado'];

// Convierte a número un valor numérico (número, o texto con solo dígitos y punto decimal).
// Devuelve NaN si el valor no es numérico.
const aNumero = (valor) => {
  if (typeof valor === 'number') return valor;
  if (typeof valor === 'string' && /^\d+(\.\d+)?$/.test(valor.trim())) return Number(valor);
  return NaN;
};

// Indica si el valor es un entero dentro del rango [minimo, MAX_INT].
const esEntero = (valor, minimo) => {
  const numero = aNumero(valor);
  return Number.isInteger(numero) && numero >= minimo && numero <= MAX_INT;
};

// Indica si el valor es un precio positivo que entra en DECIMAL(10,2).
const esPrecioValido = (valor) => {
  const numero = aNumero(valor);
  return Number.isFinite(numero) && numero > 0 && numero <= MAX_PRECIO;
};

// Indica si el valor es una fecha real con formato AAAA-MM-DD.
const esFechaValida = (valor) => {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const fecha = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
};

// Valida el cuerpo de un pedido. Devuelve el mensaje de error o null si es válido.
// En el alta (exigirEstado = false) el estado es opcional y por defecto es "pendiente".
const validarPedido = (datos, exigirEstado) => {
  const { fecha, estado, id_cliente, id_empleado, id_compania_envio } = datos;

  if (
    fecha === undefined ||
    id_cliente === undefined ||
    id_empleado === undefined ||
    id_compania_envio === undefined ||
    (exigirEstado && estado === undefined)
  ) {
    return 'Faltan campos obligatorios: fecha, estado, id_cliente, id_empleado e id_compania_envio';
  }
  if (!esFechaValida(fecha)) {
    return 'La fecha debe ser válida y tener formato AAAA-MM-DD';
  }
  if (estado !== undefined && !ESTADOS_VALIDOS.includes(estado)) {
    return `El estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}`;
  }
  if (!esEntero(id_cliente, 1)) {
    return 'El id_cliente debe ser un número entero positivo';
  }
  if (!esEntero(id_empleado, 1)) {
    return 'El id_empleado debe ser un número entero positivo';
  }
  if (!esEntero(id_compania_envio, 1)) {
    return 'El id_compania_envio debe ser un número entero positivo';
  }
  return null;
};

// Valida la cantidad y el precio de una línea de detalle.
const validarCantidadYPrecio = (cantidad, precioUnitario) => {
  if (cantidad === undefined || precioUnitario === undefined) {
    return 'Faltan campos obligatorios: cantidad y precio_unitario';
  }
  if (!esEntero(cantidad, 1)) {
    return 'La cantidad debe ser un número entero positivo';
  }
  if (!esPrecioValido(precioUnitario)) {
    return 'El precio_unitario debe ser un número positivo';
  }
  return null;
};

// Indica si existe un pedido con ese id.
const existePedido = async (id) => {
  const [filas] = await pedidosModel.obtenerPorId(id);
  return filas.length > 0;
};

class PedidosController {
  // GET /pedidos, con los filtros opcionales ?estado= y ?fecha=
  async consultar(req, res, next) {
    try {
      const { estado, fecha } = req.query;

      if (estado !== undefined && !ESTADOS_VALIDOS.includes(estado)) {
        return res.status(400).json({ error: `El estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}` });
      }
      if (fecha !== undefined && !esFechaValida(fecha)) {
        return res.status(400).json({ error: 'La fecha debe ser válida y tener formato AAAA-MM-DD' });
      }

      const [filas] = await pedidosModel.obtenerTodos(estado, fecha);
      res.status(200).json(filas);
    } catch (error) {
      next(error);
    }
  }

  // POST /pedidos
  async ingresar(req, res, next) {
    try {
      const datos = req.body ?? {};
      const errorValidacion = validarPedido(datos, false);
      if (errorValidacion) {
        return res.status(400).json({ error: errorValidacion });
      }

      const [resultado] = await pedidosModel.crear(
        datos.fecha,
        datos.estado ?? 'pendiente',
        Number(datos.id_cliente),
        Number(datos.id_empleado),
        Number(datos.id_compania_envio)
      );

      res.status(201).json({
        mensaje: 'Pedido creado con éxito',
        id: resultado.insertId
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /pedidos/:id
  async consultarDetalle(req, res, next) {
    try {
      const { id } = req.params;
      if (!esEntero(id, 1)) {
        return res.status(400).json({ error: 'El id debe ser un número entero positivo' });
      }

      const [filas] = await pedidosModel.obtenerPorId(Number(id));
      if (filas.length === 0) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }

      res.status(200).json(filas[0]);
    } catch (error) {
      next(error);
    }
  }

  // PUT /pedidos/:id (se envían todos los campos, excepto el id)
  async actualizar(req, res, next) {
    try {
      const { id } = req.params;
      if (!esEntero(id, 1)) {
        return res.status(400).json({ error: 'El id debe ser un número entero positivo' });
      }

      const datos = req.body ?? {};
      const errorValidacion = validarPedido(datos, true);
      if (errorValidacion) {
        return res.status(400).json({ error: errorValidacion });
      }

      const [resultado] = await pedidosModel.actualizar(
        Number(id),
        datos.fecha,
        datos.estado,
        Number(datos.id_cliente),
        Number(datos.id_empleado),
        Number(datos.id_compania_envio)
      );

      if (resultado.affectedRows === 0) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }

      res.status(200).json({ mensaje: 'Pedido actualizado con éxito' });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /pedidos/:id (sus líneas de detalle se eliminan en cascada)
  async eliminar(req, res, next) {
    try {
      const { id } = req.params;
      if (!esEntero(id, 1)) {
        return res.status(400).json({ error: 'El id debe ser un número entero positivo' });
      }

      const [resultado] = await pedidosModel.eliminar(Number(id));
      if (resultado.affectedRows === 0) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }

      res.status(200).json({ mensaje: 'Pedido eliminado con éxito' });
    } catch (error) {
      next(error);
    }
  }

  // GET /pedidos/:id/total
  async consultarTotal(req, res, next) {
    try {
      const { id } = req.params;
      if (!esEntero(id, 1)) {
        return res.status(400).json({ error: 'El id debe ser un número entero positivo' });
      }
      if (!(await existePedido(Number(id)))) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }

      const [filas] = await pedidosModel.obtenerTotal(Number(id));
      res.status(200).json({ id_pedido: Number(id), total: filas[0].total });
    } catch (error) {
      next(error);
    }
  }

  // GET /pedidos/:id/detalle
  async consultarLineas(req, res, next) {
    try {
      const { id } = req.params;
      if (!esEntero(id, 1)) {
        return res.status(400).json({ error: 'El id debe ser un número entero positivo' });
      }
      if (!(await existePedido(Number(id)))) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }

      const [filas] = await pedidosModel.obtenerLineas(Number(id));
      res.status(200).json(filas);
    } catch (error) {
      next(error);
    }
  }

  // POST /pedidos/:id/detalle (el cuerpo trae id_producto, cantidad y precio_unitario)
  async ingresarLinea(req, res, next) {
    try {
      const { id } = req.params;
      if (!esEntero(id, 1)) {
        return res.status(400).json({ error: 'El id debe ser un número entero positivo' });
      }

      const { id_producto, cantidad, precio_unitario } = req.body ?? {};
      if (id_producto === undefined) {
        return res.status(400).json({ error: 'Faltan campos obligatorios: id_producto, cantidad y precio_unitario' });
      }
      if (!esEntero(id_producto, 1)) {
        return res.status(400).json({ error: 'El id_producto debe ser un número entero positivo' });
      }
      const errorValidacion = validarCantidadYPrecio(cantidad, precio_unitario);
      if (errorValidacion) {
        return res.status(400).json({ error: errorValidacion });
      }

      if (!(await existePedido(Number(id)))) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }

      // Un producto inexistente (error 1452) o repetido en el pedido (error 1062)
      // los traduce el middleware global a un 400.
      await pedidosModel.crearLinea(
        Number(id),
        Number(id_producto),
        Number(cantidad),
        Number(precio_unitario)
      );

      res.status(201).json({ mensaje: 'Línea agregada al pedido con éxito' });
    } catch (error) {
      next(error);
    }
  }

  // PUT /pedidos/:id/detalle/:id_producto (el cuerpo trae cantidad y precio_unitario)
  async actualizarLinea(req, res, next) {
    try {
      const { id, id_producto } = req.params;
      if (!esEntero(id, 1) || !esEntero(id_producto, 1)) {
        return res.status(400).json({ error: 'El id del pedido y el id del producto deben ser números enteros positivos' });
      }

      const { cantidad, precio_unitario } = req.body ?? {};
      const errorValidacion = validarCantidadYPrecio(cantidad, precio_unitario);
      if (errorValidacion) {
        return res.status(400).json({ error: errorValidacion });
      }

      if (!(await existePedido(Number(id)))) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }

      const [resultado] = await pedidosModel.actualizarLinea(
        Number(id),
        Number(id_producto),
        Number(cantidad),
        Number(precio_unitario)
      );

      if (resultado.affectedRows === 0) {
        return res.status(404).json({ error: 'El producto no figura en el pedido' });
      }

      res.status(200).json({ mensaje: 'Línea del pedido actualizada con éxito' });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /pedidos/:id/detalle/:id_producto
  async eliminarLinea(req, res, next) {
    try {
      const { id, id_producto } = req.params;
      if (!esEntero(id, 1) || !esEntero(id_producto, 1)) {
        return res.status(400).json({ error: 'El id del pedido y el id del producto deben ser números enteros positivos' });
      }

      if (!(await existePedido(Number(id)))) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }

      const [resultado] = await pedidosModel.eliminarLinea(Number(id), Number(id_producto));
      if (resultado.affectedRows === 0) {
        return res.status(404).json({ error: 'El producto no figura en el pedido' });
      }

      res.status(200).json({ mensaje: 'Línea eliminada del pedido con éxito' });
    } catch (error) {
      next(error);
    }
  }
}

export default new PedidosController();