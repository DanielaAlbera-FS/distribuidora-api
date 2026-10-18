import express from "express";                       // framework web, el mismo del TP4
import cors from "cors";                             // permite pedidos desde otros orígenes
import morgan from "morgan";                         // imprime un log de cada request
import { prisma } from "./config/prisma.js";         // la instancia compartida de Prisma

const app = express();                               // crea la aplicación

const PORT = process.env.PORT || 3000;               // puerto del .env, o 3000 si no hay

app.use(morgan("dev"));                              // log de cada request en la consola
app.use(express.json());                             // permite leer el body JSON de las requests
app.use(cors());                                     // habilita CORS

app.get("/", (req, res) => {                         // ruta de bienvenida
  res.send("Hola Mundo");                            // responde texto simple
});

app.get("/ping-db", async (req, res) => {            // ruta TEMPORAL: comprueba que Prisma llega a la base
  const total = await prisma.proveedor.count();      // cuenta filas de la tabla proveedores
  res.json({ proveedores: total });                  // devuelve la cantidad
});

app.listen(PORT, () => {                             // levanta el servidor
  console.log("Servidor activo");                    // aviso en consola
});