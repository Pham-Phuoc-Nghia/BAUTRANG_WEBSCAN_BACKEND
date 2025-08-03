// src/services/meta.service.ts
import sql from "mssql";
import pool from "../config/database";

/**
 * Lấy danh sách tất cả công ty và chi nhánh đang hoạt động.
 */
export const getCompaniesAndBranches = async () => {
  try {
    const request = pool.request();
    const result = await request.execute("sp_META_getCompanyAndBranch");

    // SP này chỉ trả về 1 recordset
    return result.recordset || [];
  } catch (error) {
    console.error("Error in getCompaniesAndBranches service:", error);
    throw error;
  }
};
