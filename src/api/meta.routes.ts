// src/api/meta.routes.ts
import { Router } from "express";
import { getBranchListHandler } from "../controllers/meta.controller";
// Không cần middleware 'protect' vì ai cũng có thể thấy danh sách chi nhánh trước khi đăng nhập
const router = Router();

// GET /api/meta/branches
router.get("/branches", getBranchListHandler);

export default router;
