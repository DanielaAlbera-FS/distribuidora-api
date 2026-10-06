import empleadosModel from '../models/empleadosModel.mjs';

class EmpleadosController {

  // GET /empleados
  async consultar(req, res, next) { 
    try {
      const [filas] = await empleadosModel.obtenerTodos();
      res.status(200).json({
        total: filas.length,
        empleados: filas
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /empleados/:id
  async consultarDetalle(req, res, next) {
    try {
      const { id } = req.params;
      const [filas] = await empleadosModel.obtenerPorId(id);

      if (filas.length === 0) {
        return res.status(404).json({ error: 'Empleado no encontrado' });
      }

      res.status(200).json(filas[0]);
    } catch (error) {
      next(error);
    }
  }

  // POST /empleados
  async crear(req, res, next) {
    try {
      const { nombre, apellido, cargo, email } = req.body;

      if (!nombre || !email) {
        return res.status(400).json({ error: 'Nombre y email son obligatorios' });
      }

      const [resultado] = await empleadosModel.crear({ nombre, apellido, cargo, email });

      res.status(201).json({
        mensaje: 'Empleado creado con éxito',
        id: resultado.insertId
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /empleados/:id
  async actualizar(req, res, next) {
    try {
      const { id } = req.params;
      const { nombre, apellido, cargo, email } = req.body;

      if (!nombre || !email) {
        return res.status(400).json({ error: 'PUT requiere los campos obligatorios: nombre, email' });
      }

      const [resultado] = await empleadosModel.actualizar(id, { nombre, apellido, cargo, email });

      if (resultado.affectedRows === 0) {
        return res.status(404).json({ error: 'Empleado no encontrado' });
      }

      const [filas] = await empleadosModel.obtenerPorId(id);

      res.status(200).json({
        mensaje: 'Empleado actualizado con éxito',
        Empleado: filas[0]
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /empleados/:id
  async actualizarParte(req, res, next) {
    try {
      const { id } = req.params;
      const campos = req.body;

      // Se contemplan únicamente las columnas reales de la tabla
      const camposPermitidos = ['nombre', 'apellido', 'cargo', 'email'];
      const keys = Object.keys(campos).filter(key => camposPermitidos.includes(key));

      if (keys.length === 0) {
        return res.status(400).json({ error: 'No se enviaron campos válidos para actualizar' });
      }

      const setClause = keys.map(key => `${key}=?`).join(', ');
      const values = keys.map(key => campos[key]);

      const [resultado] = await empleadosModel.actualizarParte(id, setClause, values);

      if (resultado.affectedRows === 0) {
        return res.status(404).json({ error: 'Empleado no encontrado' });
      }

      const [filas] = await empleadosModel.obtenerPorId(id);

      res.status(200).json({
        mensaje: 'Empleado actualizado parcialmente con éxito',
        Empleado: filas[0]
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /empleados/:id
  async eliminar(req, res, next) {
    try {
      const { id } = req.params;
      const [resultado] = await empleadosModel.eliminar(id);

      if (resultado.affectedRows === 0) {
        return res.status(404).json({ error: 'Empleado no encontrado' });
      }

      res.status(200).json({ mensaje: 'Empleado eliminado con éxito' });
    } catch (error) {
      next(error);
    }
  }
}

export default new EmpleadosController();