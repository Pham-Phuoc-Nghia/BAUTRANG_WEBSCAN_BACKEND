// src/controllers/auth.controller.ts (Bản sửa lỗi)

import { Response } from "express";
// Import các kiểu cần thiết từ middleware
import {
  AuthenticatedRequest,
  RequestHandler,
} from "../middleware/auth.middleware";
import {
  validateUserCredentials,
  getUserDetails,
} from "../services/auth.service";
import jwt = require("jsonwebtoken");
import config from "../config";

// Định nghĩa một kiểu Handler tùy chỉnh
type AuthRequestHandler = (
  req: AuthenticatedRequest,
  res: Response
) => Promise<void> | void;

const signJwt = (payload: object): string => {
  const options: jwt.SignOptions = { expiresIn: config.jwt.expiresIn };
  return jwt.sign(payload, config.jwt.secret, options);
};

export const loginHandler: AuthRequestHandler = async (req, res) => {
  // Chỉ lấy 3 thông tin từ body. KHÔNG có userId.
  const { username, password, branchId } = req.body;

  try {
    if (!username || !password || !branchId) {
      res
        .status(400)
        .json({ message: "Username, password, and branchId are required" });
      return;
    }

    // Gọi hàm với đúng 3 tham số
    const authResult = await validateUserCredentials(
      username,
      password,
      branchId
    );

    if (!authResult.isValid || !authResult.user) {
      res.status(401).json({ message: authResult.message });
      return;
    }

    console.log(
      ">>> [loginHandler] Dữ liệu chuẩn bị tạo token:",
      authResult.user
    );

    const tokenPayload = {
      UserId: authResult.user.UserId,
      UserName: authResult.user.UserName,
      branchId: authResult.user.currentBranch.BranchId,
    };
    const token = signJwt(tokenPayload);

    res.status(200).json({
      message: "Login successful",
      token,
      user: authResult.user,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Áp dụng kiểu AuthRequestHandler
export const getMeHandler: AuthRequestHandler = async (req, res) => {
  try {
    if (!req.user) {
      res
        .status(401)
        .json({ message: "Unauthorized: User not found in token" });
      return;
    }

    const { UserId } = req.user;
    const userDetails = await getUserDetails(UserId);
    console.log("userDetails from getMeHandler", userDetails);
    if (!userDetails) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({ user: userDetails });
  } catch (error) {
    console.error("GetMe error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
