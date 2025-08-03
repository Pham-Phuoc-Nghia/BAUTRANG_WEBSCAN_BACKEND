import sql from "mssql";
import pool from "../config/database";

/**
 * Tìm thông tin vé bằng mã vé.
 * @param ticketCode Mã vé được quét từ QR
 */
export const findTicketByCode = async (ticketCode: string) => {
  try {
    const request = pool.request();
    request.input("TicketCode", sql.VarChar(30), ticketCode);

    const result = await request.execute("proc_SCAN_GetTicketDetailsByCode");

    // SP này chỉ trả về 1 recordset chứa thông tin của 1 vé (hoặc rỗng)
    if (result.recordset && result.recordset.length > 0) {
      return result.recordset[0];
    }

    return null; // Không tìm thấy vé
  } catch (error) {
    console.error("Error in findTicketByCode service:", error);
    throw error;
  }
};
