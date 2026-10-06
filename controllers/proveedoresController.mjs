import proveedoresModel from '../models/proveedoresModel.mjs';

class ProveedoresController {

  // GET /proveedores
  async consultar(req, res, next) { 
    try {
      const [filas] = await proveedoresModel.obtenerTodos();
      res.status(200).json({
        total: filas.length,
        proveedores: filas
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /proveedores/:id
  async consultarDetalle(req, res, next) {
    try {
      const { id } = req.params;
      const [filas] = await proveedoresModel.obtenerPorId(id);

      if (filas.length === 0) {
        return res.status(404).json({ error: 'Proveedor no encontrado' });
      }

      res.status(200).json(filas[0]);
    } catch (error) {
      next(error);
    }
  }

  // POST /proveedores
  async crear(req, res, next) {
    try {
      const { nombre, telefono, email, direccion, CUIL_CUIT } = req.body;

      if (!nombre || !email || !CUIL_CUIT) {
        return res.status(400).json({ error: 'Nombre, email y CUIL/CUIT son obligatorios' });
      }

      const [resultado] = await proveedoresModel.crear({ nombre, telefono, email, direccion, CUIL_CUIT });

      res.status(201).json({
        mensaje: 'Proveedor creado con éxito',
        id: resultado.insertId
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /proveedores/:id
  async actualizar(req, res, next) {
    try {
      const { id } = req.params;
      const { nombre, telefono, email, direccion, CUIL_CUIT } = req.body;

      if (!nombre || !email || !CUIL_CUIT) {
        return res.status(400).json({ error: 'PUT requiere los campos obligatorios: nombre, email y CUIL/CUIT' });
      }

      const [resultado] = await proveedoresModel.actualizar(id, { nombre, telefono, email, direccion, CUIL_CUIT });

      if (resultado.affectedRows === 0) {
        return res.status(404).json({ error: 'Proveedor no encontrado' });
      }

      const [filas] = await proveedoresModel.obtenerPorId(id);

      res.status(200).json({
        mensaje: 'Proveedor actualizado con éxito',
        proveedor: filas[0]
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /proveedores/:id
  async actualizarParte(req, res, next) {
    try {
      const { id } = req.params;
      const campos = req.body;

      // Filtro dinámico con los nombres reales de las columnas en la BD
      const camposPermitidos = ['nombre', 'telefono', 'email', 'direccion', 'CUIL_CUIT'];
      const keys = Object.keys(campos).filter(key => camposPermitidos.includes(key));

      if (keys.length === 0) {
        return res.status(400).json({ error: 'No se enviaron campos válidos para actualizar' });
      }

      const setClause = keys.map(key => `${key}=?`).join(', ');
      const values = keys.map(key => campos[key]);

      const [resultado] = await proveedoresModel.actualizarParte(id, setClause, values);

      if (resultado.affectedRows === 0) {
        return res.status(404).json({ error: 'Proveedor no encontrado' });
      }

      const [filas] = await proveedoresModel.obtenerPorId(id);

      res.status(200).json({
        mensaje: 'Proveedor actualizado parcialmente con éxito',
        proveedor: filas[0]
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /proveedores/:id
  async eliminar(req, res, next) {
    try {
      const { id } = req.params;
      const [resultado] = await proveedoresModel.eliminar(id);

      if (resultado.affectedRows === 0) {
        return res.status(404).json({ error: 'Proveedor no encontrado' });
      }

      res.status(200).json({ mensaje: 'Proveedor eliminado con éxito' });
    } catch (error) {
      next(error);
    }
  }
}

export default new ProveedoresController();