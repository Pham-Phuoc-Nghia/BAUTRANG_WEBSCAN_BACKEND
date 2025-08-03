import { Router } from "express";
import { getTicketDetailsHandler } from "../controllers/ticket.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

// GET /api/tickets/scan/:ticketCode
// Dùng middleware `protect` để đảm bảo chỉ người dùng đã đăng nhập mới được truy cập
router.get("/scan/:ticketCode", protect, getTicketDetailsHandler);

export default router;
