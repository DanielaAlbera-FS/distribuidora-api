//====================== Librerias ============================================
import express from "express";
//====================== Recursos =============================================
import routes from "./routes/indexRoutes.mjs"
import { rutaNoEncontrada, manejadorErrores } from './middlewares/manejadorErrores.mjs';

const app = express();
const PORT = 3000;

//===================== endPoint =============================================
// El orden es importante: primero las rutas inexistentes y, al final, el manejador global de errores.
app.use(express.json());
app.use(routes);

//===================== Manejador de errores =============================================
app.use(rutaNoEncontrada);
app.use(manejadorErrores);

//===================== Puerto escuchando ===================================
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});