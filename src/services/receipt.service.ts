// src/services/receipt.service.ts
import sql from "mssql";
import pool from "../config/database";

/**
 * Tìm kiếm thông tin hóa đơn/vé dựa trên mã và các điều kiện khác.
 * @param ticketCode Mã hóa đơn/vé được quét từ QR.
 * @param branchId ID của chi nhánh người dùng đang thao tác.
 * @param searchDate Ngày cần tìm kiếm, mặc định là ngày hiện tại.
 */
export const findReceiptByCode = async (
  ticketCode: string,
  branchId: number,
  searchDate: Date = new Date()
) => {
  try {
    const request = pool.request();

    request.input("BranchID", sql.BigInt, branchId);
    request.input("CustomerName", sql.NVarChar(100), "");
    request.input("TicketSerialCode", sql.VarChar(30), "");
    request.input("TicketIssuedDate", sql.Date, searchDate);
    request.input("TicketStatus", sql.TinyInt, 0);
    request.input("TicketCode", sql.VarChar(30), ticketCode);
    request.input("TourID", sql.VarChar(100), null);

    const result = await request.execute("sp_Pos_SearchTicketCodeCheckInOut");

    return result.recordset || [];
  } catch (error) {
    console.error("Error in findReceiptByCode service:", error);
    throw error;
  }
};
