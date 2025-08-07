// src/services/auth.service.ts

import sql from "mssql";
import pool from "../config/database";

// Interface để định nghĩa cấu trúc kết quả trả về
interface IAuthResult {
  isValid: boolean;
  message: string;
  user: any | null;
}

/**
 * Lấy thông tin chi tiết của user bằng UserId.
 * Hàm này không thay đổi.
 */
export const getUserDetails = async (userId: number): Promise<any | null> => {
  try {
    const request = pool.request();
    request.input("UserId", sql.Int, userId);

    const result = await request.execute("proc_SCAN_Auth_GetUserInfoLogin");
    const recordsets = result.recordsets as sql.IRecordSet<any>[];

    const userInfo = recordsets[0]?.[0];
    const currentBranchInfo = recordsets[1]?.[0];
    const allAssignedBranches = recordsets[2];

    if (!userInfo || !currentBranchInfo) {
      return null;
    }

    return {
      ...userInfo,
      currentBranch: currentBranchInfo,
      branches: allAssignedBranches || [],
    };
  } catch (error) {
    console.error("Error in getUserDetails service:", error);
    throw new Error("Failed to fetch user details.");
  }
};

/**
 * Hàm xác thực thông tin đăng nhập.
 * Đã sửa lỗi: Gắn lại `UserId` vào kết quả cuối cùng.
 */
export const validateUserCredentials = async (
  username: string,
  password: string,
  branchId: number
): Promise<IAuthResult> => {
  try {
    const authRequest = pool.request();
    authRequest.input("UserName", sql.VarChar(20), username);
    authRequest.input("PassWord", sql.VarChar(20), password);
    const authResultSp = await authRequest.execute(
      "proc_SCAN_Auth_LoginClient"
    );
    const authRecordsets = authResultSp.recordsets as sql.IRecordSet<any>[];

    const statusResponse = authRecordsets[0]?.[0];
    if (!statusResponse || !statusResponse.Success) {
      return {
        isValid: false,
        message: statusResponse?.Message || "Invalid username or password",
        user: null,
      };
    }

    const basicUserInfo = authRecordsets[1]?.[0];

    // Bước 1: Tìm thấy `userId` từ SP đầu tiên
    const userId = basicUserInfo?.UserId;

    if (!userId) {
      console.error("[LỖI] Xác thực thành công nhưng không tìm thấy UserId.");
      return {
        isValid: false,
        message: "Authentication successful, but user ID not found.",
        user: null,
      };
    }

    // Bước 2: Dùng `userId` để lấy thông tin chi tiết
    const fullUserObject = await getUserDetails(userId);

    if (!fullUserObject) {
      console.error(
        "[LỖI] Lấy thông tin chi tiết thất bại (getUserDetails trả về null)."
      );
      return {
        isValid: false,
        message:
          "Đăng nhập thành công, nhưng không thể lấy thông tin chi nhánh.",
        user: null,
      };
    }

    // Bước 3 (QUAN TRỌNG): Gắn lại `userId` vào object cuối cùng
    // vì `getUserDetails` không trả về trường này.
    fullUserObject.UserId = userId;

    return {
      isValid: true,
      message: "Đăng nhập thành công",
      user: fullUserObject, // Bây giờ object này chắc chắn có `UserId`
    };
  } catch (error) {
    console.error(
      "Lỗi nghiêm trọng trong validateUserCredentials service:",
      error
    );
    throw error;
  }
};
