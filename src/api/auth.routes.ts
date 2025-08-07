// src/api/auth.routes.ts (Corrected)

import { Router, Request, Response } from "express";
import { loginHandler, getMeHandler } from "../controllers/auth.controller";
import { protect, AuthenticatedRequest } from "../middleware/auth.middleware";

const router = Router();

// POST /api/auth/login
// We add curly braces {} to create a "block body".
// This ensures the arrow function has a `void` return type, satisfying TypeScript.
router.post("/login", (req: Request, res: Response) => {
  loginHandler(req as AuthenticatedRequest, res);
});

// GET /api/auth/me
// Route này được bảo vệ bởi middleware `protect`.
// Same fix here: add curly braces {}.
router.get("/me", protect, (req: Request, res: Response) => {
  getMeHandler(req as AuthenticatedRequest, res);
});

export default router;
