// src/middleware/auth.middleware.ts (Bản sửa lỗi)

// Import thêm RequestHandler
import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import config from "../config";

// Định nghĩa payload của token một cách rõ ràng
export interface TokenPayload {
  UserId: number;
  UserName: string;
  branchId: number;
  iat: number;
  exp: number;
}

// Mở rộng kiểu Request của Express để thêm thuộc taính `user`
export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

// Export RequestHandler để các file khác có thể dùng
export { RequestHandler };

export const protect: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authReq = req as AuthenticatedRequest;
  const authHeader = authReq.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized: No token provided" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as TokenPayload;
    authReq.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      res.status(401).json({ message: "Unauthorized: Token has expired" });
      return;
    }
    res.status(401).json({ message: "Unauthorized: Invalid token" });
    return;
  }
};
