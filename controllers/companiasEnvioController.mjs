import companiasEnvioModel from '../models/companiasEnvioModel.mjs';

class CompaniasEnvioController {

  // GET /companias_envio
  async consultar(req, res, next) {
    try {
      const [filas] = await companiasEnvioModel.obtenerTodos();
      res.status(200).json({
        total: filas.length,
        companiasEnvio: filas
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /companias_envio/:id
  async consultarDetalle(req, res, next) {
    try {
      const { id } = req.params;
      const [filas] = await companiasEnvioModel.obtenerPorId(id);

      if (filas.length === 0) {
        return res.status(404).json({ error: 'Compañía de envío no encontrada' });
      }

      res.status(200).json(filas[0]);
    } catch (error) {
      next(error);
    }
  }

  // POST /companias_envio
  async crear(req, res, next) {
    try {
      const { nombre, telefono } = req.body;

      if (!nombre || !nombre.trim()) {
        return res.status(400).json({ error: 'El campo nombre es obligatorio' });
      }

      const [resultado] = await companiasEnvioModel.crear({ 
        nombre: nombre.trim(), 
        telefono: telefono || null 
      });

      res.status(201).json({
        mensaje: 'Compañía de envío creada con éxito',
        id: resultado.insertId
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /companias_envio/:id
  async actualizar(req, res, next) {
    try {
      const { id } = req.params;
      const { nombre, telefono } = req.body;

      if (!nombre || !nombre.trim()) {
        return res.status(400).json({ error: 'PUT requiere el campo obligatorio: nombre' });
      }

      const [resultado] = await companiasEnvioModel.actualizar(id, { 
        nombre: nombre.trim(), 
        telefono: telefono || null 
      });

      if (resultado.affectedRows === 0) {
        return res.status(404).json({ error: 'Compañía de envío no encontrada' });
      }

      const [filas] = await companiasEnvioModel.obtenerPorId(id);

      res.status(200).json({
        mensaje: 'Compañía de envío actualizada con éxito',
        companiaEnvio: filas[0]
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /companias_envio/:id
  async actualizarParte(req, res, next) {
    try {
      const { id } = req.params;
      const campos = req.body;

      // Columnas reales de la tabla companias_envio
      const camposPermitidos = ['nombre', 'telefono'];
      const keys = Object.keys(campos).filter(key => camposPermitidos.includes(key));

      if (keys.length === 0) {
        return res.status(400).json({ error: 'No se enviaron campos válidos para actualizar' });
      }

      const setClause = keys.map(key => `${key}=?`).join(', ');
      const values = keys.map(key => campos[key]);

      const [resultado] = await companiasEnvioModel.actualizarParte(id, setClause, values);

      if (resultado.affectedRows === 0) {
        return res.status(404).json({ error: 'Compañía de envío no encontrada' });
      }

      const [filas] = await companiasEnvioModel.obtenerPorId(id);

      res.status(200).json({
        mensaje: 'Compañía de envío actualizada parcialmente con éxito',
        companiaEnvio: filas[0]
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /companias_envio/:id
  async eliminar(req, res, next) {
    try {
      const { id } = req.params;
      const [resultado] = await companiasEnvioModel.eliminar(id);

      if (resultado.affectedRows === 0) {
        return res.status(404).json({ error: 'Compañía de envío no encontrada' });
      }

      res.status(200).json({ mensaje: 'Compañía de envío eliminada con éxito' });
    } catch (error) {
      next(error);
    }
  }
}

export default new CompaniasEnvioController();