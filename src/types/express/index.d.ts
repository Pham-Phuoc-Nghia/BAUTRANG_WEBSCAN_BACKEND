// src/types/express/index.d.ts (Bản sửa lỗi hoàn chỉnh)

// BƯỚC 1 (Quan trọng): Import một thứ gì đó từ express, dù không dùng đến.
// Điều này báo cho TypeScript rằng chúng ta đang muốn "MỞ RỘNG" một module đã có,
// chứ không phải tạo ra một module global mới trùng tên.
import "express-serve-static-core";

// Định nghĩa payload của bạn như bình thường
interface UserPayload {
  UserId: number;
  UserName: string;
  branchId: number;
}

// BƯỚC 2 (Quan trọng): Bọc declaration của bạn trong `declare global`.
// Điều này đảm bảo rằng việc mở rộng này có hiệu lực trên toàn bộ project.
declare global {
  namespace Express {
    export interface Request {
      user?: UserPayload;
    }
  }
}
