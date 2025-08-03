import { Router } from "express";
import authRoutes from "./auth.routes";
import ticketRoutes from "./ticket.routes";
import receiptRoutes from "./receipt.routes";
import metaRoutes from "./meta.routes";
const router = Router();

router.use("/auth", authRoutes);
router.use("/tickets", ticketRoutes);
router.use("/receipts", receiptRoutes);
router.use("/meta", metaRoutes);

export default router;
