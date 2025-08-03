// src/controllers/auth.controller.ts

import { Request, Response } from "express";
import { validateUserCredentials } from "../services/auth.service";
import jwt = require("jsonwebtoken");
import config from "../config";

const signJwt = (payload: object): string => {
  const options: jwt.SignOptions = { expiresIn: config.jwt.expiresIn };
  return jwt.sign(payload, config.jwt.secret, options);
};

export const loginHandler = async (req: Request, res: Response) => {
  // Lấy thêm branchId từ body
  const { username, password, branchId } = req.body;

  if (!username || !password || !branchId) {
    res
      .status(400)
      .json({ message: "Username, password, and branchId are required" });
    return;
  }

  try {
    const authResult = await validateUserCredentials(
      username,
      password,
      branchId
    );

    if (!authResult.isValid || !authResult.user) {
      res.status(401).json({ message: authResult.message });
      return;
    }

    // === CẬP NHẬT JWT PAYLOAD ===
    // Payload giờ sẽ chứa cả branchId để các request sau biết user đang làm việc ở chi nhánh nào
    const tokenPayload = {
      UserId: authResult.user.ObjectId,
      UserName: authResult.user.UserName,
      branchId: authResult.user.currentBranch.BranchId, // Lấy branchId từ kết quả đã được xác thực
    };
    const token = signJwt(tokenPayload);

    // Trả về token và object user chi tiết
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
