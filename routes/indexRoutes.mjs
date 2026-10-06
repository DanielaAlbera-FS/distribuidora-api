import express from 'express';
import proveedoresRoutes from './proveedoresRoutes.mjs';
import productosRoutes from './productosRoutes.mjs';
import clientesRoutes from './clientesRoutes.mjs';
import empleadosRoutes from './empleadosRoutes.mjs';
import companiasEnvioRoutes from './companiasEnvioRoutes.mjs';
import pedidosRoutes from './pedidosRoutes.mjs';



const router = express.Router();

router.use("/proveedores", proveedoresRoutes);
router.use("/productos", productosRoutes);
router.use("/clientes", clientesRoutes);
router.use("/empleados", empleadosRoutes);
router.use("/companias_envio", companiasEnvioRoutes);
router.use("/pedidos", pedidosRoutes);

//===================== Manejador de errores =============================================



export default router;