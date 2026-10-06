// Controlador del recurso productos. Gestiona las peticiones HTTP y delega el acceso a datos en el modelo.
// Recibe las peticiones HTTP, valida los datos, delega el acceso a datos en el modelo
// y arma la respuesta con el código de estado correspondiente.
// Los errores inesperados se derivan al middleware global con next(error).
// Los métodos no usan "this" porque el router los recibe como funciones sueltas.
import productosModel from '../models/productosModel.mjs';

const MAX_INT = 2147483647; // Límite del tipo INT de MySQL.
const MAX_PRECIO = 99999999.99; // Límite del tipo DECIMAL(10,2).

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

// Valida el cuerpo de un producto. Devuelve el mensaje de error o null si es válido.
const validarProducto = (datos) => {
  const { nombre, precio, stock, id_proveedor } = datos;

  if (nombre === undefined || precio === undefined || stock === undefined || id_proveedor === undefined) {
    return 'Faltan campos obligatorios: nombre, precio, stock e id_proveedor';
  }
  if (typeof nombre !== 'string' || nombre.trim() === '' || nombre.trim().length > 100) {
    return 'El nombre debe ser un texto de 1 a 100 caracteres';
  }
  if (!esPrecioValido(precio)) {
    return 'El precio debe ser un número positivo';
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
  // GET /productos y GET /productos?stock_max=50
  async consultar(req, res, next) {
    try {
      const { stock_max } = req.query;

      if (stock_max !== undefined && !esEntero(stock_max, 0)) {
        return res.status(400).json({ error: 'El parámetro stock_max debe ser un número entero mayor o igual a 0' });
      }

      const stockMax = stock_max === undefined ? undefined : Number(stock_max);
      const [filas] = await productosModel.obtenerTodos(stockMax);
      res.status(200).json(filas);
    } catch (error) {
      next(error);
    }
  }

  // POST /productos
  async ingresar(req, res, next) {
    try {
      const datos = req.body ?? {};
      const errorValidacion = validarProducto(datos);
      if (errorValidacion) {
        return res.status(400).json({ error: errorValidacion });
      }

      const [resultado] = await productosModel.crear(
        datos.nombre.trim(),
        Number(datos.precio),
        Number(datos.stock),
        Number(datos.id_proveedor)
      );

      res.status(201).json({
        mensaje: 'Producto creado con éxito',
        id: resultado.insertId
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /productos/:id
  async consultarDetalle(req, res, next) {
    try {
      const { id } = req.params;
      if (!esEntero(id, 1)) {
        return res.status(400).json({ error: 'El id debe ser un número entero positivo' });
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

  // PUT /productos/:id (se envían todos los campos, excepto el id)
  async actualizar(req, res, next) {
    try {
      const { id } = req.params;
      if (!esEntero(id, 1)) {
        return res.status(400).json({ error: 'El id debe ser un número entero positivo' });
      }

      const datos = req.body ?? {};
      const errorValidacion = validarProducto(datos);
      if (errorValidacion) {
        return res.status(400).json({ error: errorValidacion });
      }

      const [resultado] = await productosModel.actualizar(
        Number(id),
        datos.nombre.trim(),
        Number(datos.precio),
        Number(datos.stock),
        Number(datos.id_proveedor)
      );

      if (resultado.affectedRows === 0) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      res.status(200).json({ mensaje: 'Producto actualizado con éxito' });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /productos/:id
  async eliminar(req, res, next) {
    try {
      const { id } = req.params;
      if (!esEntero(id, 1)) {
        return res.status(400).json({ error: 'El id debe ser un número entero positivo' });
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

  // GET /productos/resumen
  async resumen(req, res, next) {
    try {
      const [filas] = await productosModel.obtenerResumenPorProveedor();
      res.status(200).json(filas);
    } catch (error) {
      next(error);
    }
  }
}

export default new ProductosController();