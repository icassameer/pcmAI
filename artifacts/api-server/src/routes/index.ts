import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import categoriesRouter from "./categories";
import productsRouter from "./products";
import suppliersRouter from "./suppliers";
import customersRouter from "./customers";
import purchasesRouter from "./purchases";
import salesRouter from "./sales";
import dashboardRouter from "./dashboard";
import reportsRouter from "./reports";
import businessRouter from "./business";
import downloadRouter from "./download";
import tenantsRouter from "./tenants";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(categoriesRouter);
router.use(productsRouter);
router.use(suppliersRouter);
router.use(customersRouter);
router.use(purchasesRouter);
router.use(salesRouter);
router.use(dashboardRouter);
router.use(reportsRouter);
router.use(businessRouter);
router.use(downloadRouter);
router.use(tenantsRouter);

export default router;
