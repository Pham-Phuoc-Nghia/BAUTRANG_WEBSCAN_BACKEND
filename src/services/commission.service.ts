// src/services/commission.service.ts

import sql from "mssql";
import pool from "../config/database";
import {
  ITransactionUpdatePayload,
  IRulePayload,
  IUnifiedBillPayload,
  ICategoryPayload,
  IPartner,
  IPrintBillPayload,
} from "../types/commission.types";

// ... (các hàm khác giữ nguyên)

export const manageSettingsApi = async (
  action:
    | "GetRuleList"
    | "SaveRule"
    | "DeleteRule"
    | "GetCategoryList"
    | "SaveCategory"
    | "DeleteCategory",
  payload: Partial<IRulePayload & ICategoryPayload>
) => {
  try {
    const request = pool.request();
    request.input("Action", sql.NVarChar(50), action);
    request.input("UserID", sql.Int, payload.UserID || null);
    request.input("RuleID", sql.Int, payload.RuleID || null);
    request.input("RuleName", sql.NVarChar(255), payload.RuleName || null);
    request.input("ItemName", sql.NVarChar(255), payload.ItemName || null);
    request.input(
      "CalculationType",
      sql.TinyInt,
      payload.CalculationType || null
    );
    request.input(
      "CommissionValue",
      sql.Decimal(18, 4),
      payload.CommissionValue || null
    );
    request.input("CategoryID", sql.Int, payload.CategoryID || null);
    request.input(
      "CategoryName",
      sql.NVarChar(255),
      payload.CategoryName || null
    );
    request.input(
      "IsActive",
      sql.Bit,
      payload.IsActive !== undefined ? payload.IsActive : null
    );

    const result = await request.execute("proc_COMMISSION_ManageRule");

    if (!result || !result.recordset) {
      throw new Error("Không nhận được phản hồi từ cơ sở dữ liệu.");
    }
    return action.includes("List") ? result.recordset : result.recordset[0];
  } catch (error) {
    console.error(
      `Lỗi trong service manageSettingsApi với action ${action}:`,
      error
    );
    throw error;
  }
};

export const getPartnerByPhone = async (
  phone: string
): Promise<IPartner | null> => {
  try {
    const request = pool.request();
    request.input("PartnerPhone", sql.VarChar(20), phone);
    const result = await request.execute("proc_COMMISSION_GetPartnerByPhone");
    return result.recordset[0] || null;
  } catch (error) {
    console.error("Lỗi trong service getPartnerByPhone:", error);
    throw error;
  }
};

export const saveUnifiedBill = async (
  payload: IUnifiedBillPayload,
  userId: number
) => {
  try {
    // 1. TẠO UDT CHO DANH SÁCH DỊCH VỤ (CÓ THAY ĐỔI TẠI ĐÂY)
    const serviceTable = new sql.Table("udt_CommissionBillDetails");
    // Khai báo các cột khớp với Type mới trong DB
    serviceTable.columns.add("RuleID", sql.Int);
    serviceTable.columns.add("RuleName", sql.NVarChar(255)); // << THÊM CỘT MỚI
    serviceTable.columns.add("Quantity", sql.Int);
    serviceTable.columns.add("BaseAmount", sql.Decimal(18, 2));
    serviceTable.columns.add("CommissionAmount", sql.Decimal(18, 2));

    // Thêm dữ liệu vào các hàng
    for (const service of payload.serviceList) {
      serviceTable.rows.add(
        service.ruleId,
        service.ruleName, // << TRUYỀN DỮ LIỆU ruleName TỪ PAYLOAD
        service.quantity,
        service.baseAmount || null,
        service.commissionAmount
      );
    }

    // 2. TẠO UDT CHO DANH SÁCH NGƯỜI HƯỞNG (KHÔNG ĐỔI)
    const beneficiaryTable = new sql.Table("udt_CommissionSplitBeneficiary");
    beneficiaryTable.columns.add("PartnerName", sql.NVarChar(255));
    beneficiaryTable.columns.add("PartnerPhone", sql.VarChar(20));
    beneficiaryTable.columns.add("PartnerLicensePlate", sql.VarChar(50));
    beneficiaryTable.columns.add("CommissionAmount", sql.Decimal(18, 2));
    for (const bene of payload.beneficiaryList) {
      beneficiaryTable.rows.add(
        bene.partnerName,
        bene.partnerPhone,
        bene.partnerLicensePlate || null,
        bene.commissionAmount
      );
    }

    // 3. GỌI STORED PROCEDURE (KHÔNG ĐỔI)
    const request = pool.request();
    request.input("CustomerInfo", sql.NVarChar(255), payload.customerInfo);
    request.input(
      "TotalCommissionAmount",
      sql.Decimal(18, 2),
      payload.totalCommissionAmount
    );
    request.input("Notes", sql.NVarChar(500), payload.notes || null);
    request.input("CreatedByUserID", sql.Int, userId);
    request.input("ServiceList", serviceTable); // Truyền TVP dịch vụ đã có cấu trúc mới
    request.input("BeneficiaryList", beneficiaryTable);

    const result = await request.execute("proc_COMMISSION_SaveUnifiedBill");

    if (!result.recordset[0] || result.recordset[0].Success == false) {
      throw new Error(
        result.recordset[0]?.Message || "Stored Procedure thực thi thất bại."
      );
    }
    return result.recordset[0];
  } catch (error) {
    console.error("Lỗi trong service saveUnifiedBill:", error);
    throw error;
  }
};
// THÊM MỚI: Service để lấy dữ liệu cho việc in phiếu
export const getBillForPrinting = async (
  billId: number
): Promise<IPrintBillPayload> => {
  try {
    const request = pool.request();
    request.input("BillMasterID", sql.Int, billId);
    const result = await request.execute("proc_COMMISSION_GetBillForPrinting");

    // FIX: Thêm điều kiện Array.isArray để giúp TypeScript hiểu kiểu dữ liệu
    if (
      !result.recordsets ||
      !Array.isArray(result.recordsets) ||
      result.recordsets.length < 3
    ) {
      throw new Error("Dữ liệu trả về để in không hợp lệ.");
    }

    // Giờ đây TypeScript đã biết result.recordsets là một mảng và cho phép truy cập
    const printData: IPrintBillPayload = {
      billInfo: result.recordsets[0][0],
      services: result.recordsets[1],
      beneficiaries: result.recordsets[2],
    };

    return printData;
  } catch (error) {
    console.error("Lỗi trong service getBillForPrinting:", error);
    throw error;
  }
};

export const getCommissionTransactions = async (
  fromDate: string,
  toDate: string,
  partnerPhone?: string
) => {
  try {
    const request = pool.request();
    request.input("FromDate", sql.Date, fromDate);
    request.input("ToDate", sql.Date, toDate);
    if (partnerPhone) {
      request.input("PartnerPhone", sql.VarChar(20), partnerPhone);
    }
    const result = await request.execute("proc_COMMISSION_GetTransactions");
    return result.recordset;
  } catch (error) {
    console.error("Lỗi trong service getCommissionTransactions:", error);
    throw error;
  }
};

export const manageCommissionTransaction = async (
  action: "Update" | "Delete",
  transactionId: number,
  userId: number,
  payload?: ITransactionUpdatePayload
) => {
  try {
    const request = pool.request();
    request.input("Action", sql.NVarChar(20), action);
    request.input("TransactionID", sql.Int, transactionId);
    request.input("UserID", sql.Int, userId);

    if (action === "Update" && payload) {
      request.input("PartnerName", sql.NVarChar(255), payload.PartnerName);
      request.input("PartnerPhone", sql.VarChar(20), payload.PartnerPhone);
      request.input(
        "PartnerLicensePlate",
        sql.VarChar(50),
        payload.PartnerLicensePlate
      );
      request.input(
        "CommissionAmount",
        sql.Decimal(18, 2),
        payload.CommissionAmount
      );
    }

    const result = await request.execute("proc_COMMISSION_ManageTransaction");
    return result.recordset[0];
  } catch (error) {
    console.error(
      `Lỗi trong service manageCommissionTransaction với action ${action}:`,
      error
    );
    throw error;
  }
};
