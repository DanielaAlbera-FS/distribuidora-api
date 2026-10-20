import { PrismaClient } from "../generated/prisma/client.js"; // cliente generado (el .js es obligatorio en NodeNext)
import { PrismaMariaDb } from "@prisma/adapter-mariadb";     // adaptador que conecta Prisma con MariaDB/MySQL
import mariadb from "mariadb";                               // driver que crea el pool
import dotenv from "dotenv";                                 // lector del .env

dotenv.config();                                             // carga las variables del .env en process.env
   
const pool = mariadb.createPool({                            // crea el Connection Pool (consigna 2.4)
  host: process.env.DB_HOST as string,                       // servidor
  port: Number(process.env.DB_PORT),                         // puerto, convertido de texto a número
  user: process.env.DB_USER as string,                       // usuario
  password: process.env.DB_PASS as string,                   // contraseña (vacía en XAMPP)
  database: process.env.DB_NAME as string,                   // nombre de la base
  connectionLimit: 10,                                       // AGREGADO: máximo de conexiones simultáneas (consigna 2.4)
});

const adapter = new PrismaMariaDb(pool);                     // envuelve el pool para que Prisma lo use

export const prisma = new PrismaClient({ adapter });         // única instancia de Prisma compartida en toda la app


