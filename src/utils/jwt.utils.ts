// src/utils/jwt.utils.ts

import * as jwt from "jsonwebtoken";
import config from "../config";

// Hàm tạo token
export const signJwt = (payload: object): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

// Hàm xác thực token
export const verifyJwt = (token: string) => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    return {
      valid: true,
      expired: false,
      decoded,
    };
  } catch (e: any) {
    return {
      valid: false,
      expired: e.message === "jwt expired",
      decoded: null,
    };
  }
};
