import productosModel from '../models/productosModel.mjs';

const MAX_INT = 2147483647;
const MAX_PRECIO = 99999999.99;

const aNumero = (valor) => {
  if (typeof valor === 'number') return valor;
  if (typeof valor === 'string' && /^\d+(\.\d+)?$/.test(valor.trim())) return Number(valor);
  return NaN;
};

const esEntero = (valor, minimo) => {
  const numero = aNumero(valor);
  return Number.isInteger(numero) && numero >= minimo && numero <= MAX_INT;
};

const esPrecioValido = (valor) => {
  const numero = aNumero(valor);
  return Number.isFinite(numero) && numero > 0 && numero <= MAX_PRECIO;
};

const validarProducto = (datos) => {
  const { nombre, precio, stock, id_proveedor } = datos;

  if (nombre === undefined || precio === undefined || stock === undefined || id_proveedor === undefined) {
    return 'Faltan campos obligatorios: nombre, precio, stock e id_proveedor';
  }
  if (typeof nombre !== 'string' || nombre.trim() === '' || nombre.trim().length > 100) {
    return 'El nombre debe ser un texto de 1 a 100 caracteres';
  }
  if (!esPrecioValido(precio)) {
    return 'El precio debe ser un número positivo mayor a 0';
  }
  if (!esEntero(stock, 0)) {
    return 'El stock debe ser un número entero mayor o igual a 0';
  }
  if (!esEntero(id_proveedor, 1)) {
    return 'El id_proveedor debe ser un número entero positivo';
  }
  return null;
};

class ProductosController {

  async consultar(req, res, next) {
    try {
      const { stock_max } = req.query;

      if (stock_max !== undefined && !esEntero(stock_max, 0)) {
        return res.status(400).json({ error: 'El parámetro stock_max debe ser un número entero mayor o igual a 0' });
      }

      const stockMax = stock_max === undefined ? undefined : Number(stock_max);
      const [filas] = await productosModel.obtenerTodos(stockMax);

      res.status(200).json({
        total: filas.length,
        productos: filas
      });
    } catch (error) {
      next(error);
    }
  }

  async consultarDetalle(req, res, next) {
    try {
      const { id } = req.params;
      if (!esEntero(id, 1)) {
        return res.status(400).json({ error: 'El ID debe ser un número entero positivo' });
      }

      const [filas] = await productosModel.obtenerPorId(Number(id));
      if (filas.length === 0) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      res.status(200).json(filas[0]);
    } catch (error) {
      next(error);
    }
  }

  async crear(req, res, next) {
    try {
      const datos = req.body ?? {};
      const errorValidacion = validarProducto(datos);
      if (errorValidacion) {
        return res.status(400).json({ error: errorValidacion });
      }

      const datosLimpios = {
        nombre: datos.nombre.trim(),
        precio: Number(datos.precio),
        stock: Number(datos.stock),
        id_proveedor: Number(datos.id_proveedor)
      };

      const [resultado] = await productosModel.crear(datosLimpios);

      res.status(201).json({
        mensaje: 'Producto creado con éxito',
        id: resultado.insertId
      });
    } catch (error) {
      next(error);
    }
  }

  async actualizar(req, res, next) {
    try {
      const { id } = req.params;
      if (!esEntero(id, 1)) {
        return res.status(400).json({ error: 'El ID debe ser un número entero positivo' });
      }

      const datos = req.body ?? {};
      const errorValidacion = validarProducto(datos);
      if (errorValidacion) {
        return res.status(400).json({ error: errorValidacion });
      }

      const datosLimpios = {
        nombre: datos.nombre.trim(),
        precio: Number(datos.precio),
        stock: Number(datos.stock),
        id_proveedor: Number(datos.id_proveedor)
      };

      const [resultado] = await productosModel.actualizar(Number(id), datosLimpios);

      if (resultado.affectedRows === 0) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      const [filas] = await productosModel.obtenerPorId(Number(id));

      res.status(200).json({
        mensaje: 'Producto actualizado con éxito',
        producto: filas[0]
      });
    } catch (error) {
      next(error);
    }
  }

  async actualizarParte(req, res, next) {
    try {
      const { id } = req.params;
      if (!esEntero(id, 1)) {
        return res.status(400).json({ error: 'El ID debe ser un número entero positivo' });
      }

      const campos = req.body ?? {};
      const camposPermitidos = ['nombre', 'precio', 'stock', 'id_proveedor'];
      const keys = Object.keys(campos).filter(key => camposPermitidos.includes(key));

      if (keys.length === 0) {
        return res.status(400).json({ error: 'No se enviaron campos válidos para actualizar' });
      }

      if (campos.nombre !== undefined && (typeof campos.nombre !== 'string' || !campos.nombre.trim())) {
        return res.status(400).json({ error: 'El nombre debe ser un texto válido' });
      }
      if (campos.precio !== undefined && !esPrecioValido(campos.precio)) {
        return res.status(400).json({ error: 'El precio debe ser un número positivo' });
      }
      if (campos.stock !== undefined && !esEntero(campos.stock, 0)) {
        return res.status(400).json({ error: 'El stock debe ser un número entero mayor o igual a 0' });
      }
      if (campos.id_proveedor !== undefined && !esEntero(campos.id_proveedor, 1)) {
        return res.status(400).json({ error: 'El id_proveedor debe ser un número entero positivo' });
      }

      const setClause = keys.map(key => `${key}=?`).join(', ');
      const values = keys.map(key => key === 'nombre' ? campos[key].trim() : Number(campos[key]));

      const [resultado] = await productosModel.actualizarParte(Number(id), setClause, values);

      if (resultado.affectedRows === 0) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      const [filas] = await productosModel.obtenerPorId(Number(id));

      res.status(200).json({
        mensaje: 'Producto actualizado parcialmente con éxito',
        producto: filas[0]
      });
    } catch (error) {
      next(error);
    }
  }

  async eliminar(req, res, next) {
    try {
      const { id } = req.params;
      if (!esEntero(id, 1)) {
        return res.status(400).json({ error: 'El ID debe ser un número entero positivo' });
      }

      const [resultado] = await productosModel.eliminar(Number(id));
      if (resultado.affectedRows === 0) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      res.status(200).json({ mensaje: 'Producto eliminado con éxito' });
    } catch (error) {
      next(error);
    }
  }

  async resumen(req, res, next) {
    try {
      const [filas] = await productosModel.obtenerResumenPorProveedor();
      res.status(200).json({
        total_proveedores: filas.length,
        resumen: filas
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ProductosController();