// src/api/receipt.routes.ts
import { Router } from "express";
import { getReceiptDetailsHandler } from "../controllers/receipt.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

// GET /api/receipts/scan/:ticketCode
router.get("/scan/:ticketCode", protect, getReceiptDetailsHandler);

export default router;
