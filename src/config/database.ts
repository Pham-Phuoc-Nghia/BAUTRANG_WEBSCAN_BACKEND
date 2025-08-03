import sql from "mssql";
import config from "./index";

const dbConfig = { ...config.db };

// Tạo một connection pool. Đây là cách tốt nhất để quản lý kết nối.
// Ứng dụng sẽ tái sử dụng các kết nối đã có thay vì tạo mới liên tục.
const pool = new sql.ConnectionPool(dbConfig);
let isConnected = false;

// Hàm kết nối và đảm bảo chỉ kết nối một lần
export const connectToDatabase = async () => {
  if (isConnected) {
    return;
  }
  try {
    await pool.connect();
    isConnected = true;
    console.log("✅ Database connected successfully!");
  } catch (err) {
    console.error("❌ Database connection failed:", err);
    // Thoát tiến trình nếu không kết nối được DB, vì không có DB thì app không thể hoạt động.
    process.exit(1);
  }
};

export default pool;
