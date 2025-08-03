// src/middleware/auth.middleware.ts

import { Request, Response, NextFunction } from "express";
import jwt = require("jsonwebtoken"); // Giả sử bạn đang dùng cách import này
import { verifyJwt } from "../utils/jwt.utils"; // Hoặc import từ utils

export const protect = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized: No token provided" });
    return;
  }

  const token = authHeader.split(" ")[1];
  const { decoded, valid, expired } = verifyJwt(token);

  if (expired) {
    res.status(401).json({ message: "Unauthorized: Token has expired" });
    return;
  }

  if (!valid || !decoded) {
    res.status(401).json({ message: "Unauthorized: Invalid token" });
    return;
  }

  (req as any).user = decoded;

  next();
};
