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
 * Hàm Lấy thông tin chi tiết của user bằng UserId và BranchId.
 * Hàm này được giữ nguyên, không thay đổi.
 */
const getUserDetails = async (userId: number, branchId: number) => {
  try {
    const request = pool.request();
    request.input("UserId", sql.Int, userId);
    request.input("OrgId", sql.Int, branchId);

    const result = await request.execute("proc_Auth_GetUserInfoLogin");
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
 * Hàm xác thực thông tin đăng nhập đã được KHÔI PHỤC LOGIC ĐÚNG.
 * Xử lý 2 recordsets trả về từ `proc_SCAN_Auth_LoginClient`.
 */
export const validateUserCredentials = async (
  username: string,
  password: string,
  branchId: number
): Promise<IAuthResult> => {
  try {
    console.log(`\n--- BẮT ĐẦU YÊU CẦU ĐĂNG NHẬP (ĐÃ SỬA LỖI ID) ---`);
    console.log(
      `[1] Dữ liệu nhận được: username=${username}, password=***, branchId=${branchId}`
    );

    const authRequest = pool.request();
    authRequest.input("UserName", sql.VarChar(20), username);
    authRequest.input("PassWord", sql.VarChar(20), password);
    const authResultSp = await authRequest.execute(
      "proc_SCAN_Auth_LoginClient"
    );
    const authRecordsets = authResultSp.recordsets as sql.IRecordSet<any>[];

    console.log("[2] Kết quả từ proc_SCAN_Auth_LoginClient:", authRecordsets);

    const statusResponse = authRecordsets[0]?.[0];
    if (!statusResponse || !statusResponse.Success) {
      return {
        isValid: false,
        message: statusResponse?.Message || "Invalid username or password",
        user: null,
      };
    }

    const basicUserInfo = authRecordsets[1]?.[0];


    const userId = basicUserInfo.UserId;


    if (!userId) {
      // Kiểm tra xem userId có tồn tại không
      console.error("[LỖI] Xác thực thành công nhưng không tìm thấy UserId.");
      return {
        isValid: false,
        message: "Authentication successful, but user ID not found.",
        user: null,
      };
    }

    console.log(`[3] Lấy được UserId: ${userId}. Chuẩn bị gọi SP thứ hai.`); // Bây giờ sẽ log ra số 1

    const fullUserObject = await getUserDetails(userId, branchId);
    console.log("[4] Kết quả từ proc_Auth_GetUserInfoLogin:", fullUserObject);

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

    console.log(`[5] Đăng nhập thành công! Trả về full user object.`);
    console.log(`--- KẾT THÚC YÊU CẦU ĐĂNG NHẬP ---\n`);

    return {
      isValid: true,
      message: "Đăng nhập thành công",
      user: fullUserObject,
    };
  } catch (error) {
    console.error(
      "Lỗi nghiêm trọng trong validateUserCredentials service:",
      error
    );
    throw error;
  }
};
