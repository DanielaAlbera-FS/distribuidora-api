// Carga las variables del archivo .env antes que cualquier otra cosa.
import "dotenv/config";
import express from "express";
import morgan from "morgan";
import cors from "cors";

// Rutas
import productosRoutes from "./routes/productosRoutes.js";
import proveedoresRoutes from "./routes/proveedoresRoutes.js";
import clientesRoutes from "./routes/clientesRoutes.js";
import empleadosRoutes from "./routes/empleadosRoutes.js";
import companiasEnvioRoutes from "./routes/companiasEnvioRoutes.js";
import pedidosRoutes from "./routes/pedidosRoutes.js";
import reportesRoutes from "./routes/reportesRoutes.js";

// Middlewares de error
import { rutaNoEncontrada, manejadorErrores } from "./middlewares/manejadorErrores.js";

const app = express();
const PORT = process.env.PORT ?? 3000;

// Middlewares generales: log de peticiones, CORS y lectura de JSON en el body.
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());

// Ruta de prueba.
app.get("/", (req, res) => {
  res.send("Hola Mundo");
});

// Recursos de la API.
app.use("/productos", productosRoutes);
app.use("/proveedores", proveedoresRoutes);
app.use("/clientes", clientesRoutes);
app.use("/empleados", empleadosRoutes);
app.use("/companias_envio", companiasEnvioRoutes);
app.use("/pedidos", pedidosRoutes);
app.use("/reportes", reportesRoutes);



// El orden importa: primero las rutas inexistentes y, al final, el manejador global de errores.
app.use(rutaNoEncontrada);
app.use(manejadorErrores);

app.listen(PORT, () => {
  console.log(`Servidor activo en http://localhost:${PORT}`);
});