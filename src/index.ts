// Carga las variables del archivo .env antes que cualquier otra cosa.
import "dotenv/config";
import express from "express";
import morgan from "morgan";
import cors from "cors";
// Rutas y middlewares de error.
import productosRoutes from "./routes/productosRoutes.js";
import pedidosRoutes from "./routes/pedidosRoutes.js";
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
app.use("/pedidos", pedidosRoutes);

// El orden importa: primero las rutas inexistentes y, al final, el manejador global de errores.
app.use(rutaNoEncontrada);
app.use(manejadorErrores);

app.listen(PORT, () => {
  console.log(`Servidor activo en http://localhost:${PORT}`);
});