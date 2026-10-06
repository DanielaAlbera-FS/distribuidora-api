import clientesModel from '../models/clientesModel.mjs';

class ClientesController {

  // GET /clientes
  async consultar(req, res, next) { 
    try {
      const [filas] = await clientesModel.obtenerTodos();
      res.status(200).json({
        total: filas.length,
        clientes: filas
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /clientes/:id
  async consultarDetalle(req, res, next) {
    try {
      const { id } = req.params;
      const [filas] = await clientesModel.obtenerPorId(id);

      if (filas.length === 0) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }

      res.status(200).json(filas[0]);
    } catch (error) {
      next(error);
    }
  }

  // POST /clientes
  async crear(req, res, next) {
    try {
      const { nombre, telefono, email, direccion, CUIL_CUIT } = req.body;

      if (!nombre || !email || !CUIL_CUIT) {
        return res.status(400).json({ error: 'Nombre, email y CUIL/CUIT son obligatorios' });
      }

      const [resultado] = await clientesModel.crear({ nombre, telefono, email, direccion, CUIL_CUIT });

      res.status(201).json({
        mensaje: 'Cliente creado con éxito',
        id: resultado.insertId
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /clientes/:id
  async actualizar(req, res, next) {
    try {
      const { id } = req.params;
      const { nombre, telefono, email, direccion, CUIL_CUIT } = req.body;

      if (!nombre || !email || !CUIL_CUIT) {
        return res.status(400).json({ error: 'PUT requiere los campos obligatorios: nombre, email y CUIL/CUIT' });
      }

      const [resultado] = await clientesModel.actualizar(id, { nombre, telefono, email, direccion, CUIL_CUIT });

      if (resultado.affectedRows === 0) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }

      const [filas] = await clientesModel.obtenerPorId(id);

      res.status(200).json({
        mensaje: 'Cliente actualizado con éxito',
        cliente: filas[0]
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /clientes/:id
  async actualizarParte(req, res, next) {
    try {
      const { id } = req.params;
      const campos = req.body;

      // Se contemplan únicamente las columnas reales de la tabla
      const camposPermitidos = ['nombre', 'telefono', 'email', 'direccion', 'CUIL_CUIT'];
      const keys = Object.keys(campos).filter(key => camposPermitidos.includes(key));

      if (keys.length === 0) {
        return res.status(400).json({ error: 'No se enviaron campos válidos para actualizar' });
      }

      const setClause = keys.map(key => `${key}=?`).join(', ');
      const values = keys.map(key => campos[key]);

      const [resultado] = await clientesModel.actualizarParte(id, setClause, values);

      if (resultado.affectedRows === 0) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }

      const [filas] = await clientesModel.obtenerPorId(id);

      res.status(200).json({
        mensaje: 'Cliente actualizado parcialmente con éxito',
        cliente: filas[0]
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /clientes/:id
  async eliminar(req, res, next) {
    try {
      const { id } = req.params;
      const [resultado] = await clientesModel.eliminar(id);

      if (resultado.affectedRows === 0) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }

      res.status(200).json({ mensaje: 'Cliente eliminado con éxito' });
    } catch (error) {
      next(error);
    }
  }
}

export default new ClientesController();