// Punto de entrada de la API RESTful de la distribuidora.
// Configura Express, registra los routers de cada recurso y los middlewares de errores.
import express from 'express';

import proveedoresRoutes from './routes/proveedoresRoutes.mjs';
import productosRoutes from './routes/productosRoutes.mjs';
import clientesRoutes from './routes/clientesRoutes.mjs';
import empleadosRoutes from './routes/empleadosRoutes.mjs';
import companiasEnvioRoutes from './routes/companiasEnvioRoutes.mjs';
import pedidosRoutes from './routes/pedidosRoutes.mjs';
import { rutaNoEncontrada, manejadorErrores } from './middlewares/manejadorErrores.mjs';

const app = express();
const PORT = 3000;

// Permite interpretar el cuerpo JSON de las peticiones (req.body).
app.use(express.json());

// Registro de los routers. Cada uno gestiona un recurso de la API.
app.use('/proveedores', proveedoresRoutes);
app.use('/productos', productosRoutes);
app.use('/clientes', clientesRoutes);
app.use('/empleados', empleadosRoutes);
app.use('/companias-envio', companiasEnvioRoutes);
app.use('/pedidos', pedidosRoutes);

// El orden es importante: primero las rutas inexistentes y, al final, el manejador global de errores.
app.use(rutaNoEncontrada);
app.use(manejadorErrores);

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});