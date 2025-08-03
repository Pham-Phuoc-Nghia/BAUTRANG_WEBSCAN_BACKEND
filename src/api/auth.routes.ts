import { Router } from "express";
import { loginHandler } from "../controllers/auth.controller";

const router = Router();

// POST /api/auth/login
router.post("/login", loginHandler);

export default router;
