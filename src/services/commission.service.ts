// src/services/commission.service.ts

import sql from "mssql";
import pool from "../config/database";
// SỬA: Import các kiểu dữ liệu từ file types mới
import {
  ICommissionBatchPayload,
  ITransactionUpdatePayload,
  IRulePayload,
  ICreatePayoutPayload,
  ISplitBillPayload,
  IUnifiedBillPayload,
  ICategoryPayload,
} from "../types/commission.types";

// =========================================================================
// QUẢN LÝ QUY TẮC HOA HỒNG
// =========================================================================
// =========================================================================
// QUẢN LÝ QUY TẮC (RULES) & LOẠI DỊCH VỤ (CATEGORIES)
// =========================================================================
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
    // Luôn cung cấp tất cả các tham số để tránh lỗi
    request.input("Action", sql.NVarChar(50), action);
    request.input("UserID", sql.Int, payload.UserID);
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
      payload.IsActive !== undefined ? payload.IsActive : 1
    );

    const result = await request.execute("proc_COMMISSION_ManageRule");

    if (!result || !result.recordset) {
      console.error(
        "Lỗi nghiêm trọng: SP không trả về recordset cho action:",
        action
      );
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

export const manageCommissionRule = async (
  action: "GetList" | "Save" | "Delete",
  payload: Partial<IRulePayload>
) => {
  try {
    const request = pool.request();
    request.input("Action", sql.NVarChar(20), action);
    request.input("RuleID", sql.Int, payload.RuleID || null);
    request.input("UserID", sql.Int, payload.UserID);

    if (action === "GetList") {
      request.input("CategoryID", sql.Int, payload.CategoryID || null);
    }

    if (action === "Save") {
      request.input("RuleName", sql.NVarChar(255), payload.RuleName);
      request.input("CategoryID", sql.Int, payload.CategoryID);
      request.input("ItemName", sql.NVarChar(255), payload.ItemName || null);
      request.input("CalculationType", sql.TinyInt, payload.CalculationType);
      request.input(
        "CommissionValue",
        sql.Decimal(18, 4),
        payload.CommissionValue
      );
      request.input(
        "IsActive",
        sql.Bit,
        payload.IsActive !== undefined ? payload.IsActive : 1
      );
    }

    const result = await request.execute("proc_COMMISSION_ManageRule");
    return action === "GetList" ? result.recordset : result.recordset[0];
  } catch (error) {
    console.error(
      `Lỗi trong service manageCommissionRule với action ${action}:`,
      error
    );
    throw error;
  }
};

// =========================================================================
// QUẢN LÝ GIAO DỊCH HOA HỒNG
// =========================================================================

export const saveCommissionBatch = async (
  payload: ICommissionBatchPayload,
  userId: number
) => {
  console.log(
    "Backend received payload for MULTI-BENEFICIARY batch save:",
    JSON.stringify(payload, null, 2)
  );

  if (!payload.transactions || payload.transactions.length === 0) {
    throw new Error("Danh sách giao dịch rỗng.");
  }

  try {
    const transactionTable = new sql.Table("udt_CommissionTransactionList");

    transactionTable.columns.add("GroupKey", sql.UniqueIdentifier);
    transactionTable.columns.add("CustomerInfo", sql.NVarChar(255));
    transactionTable.columns.add("RuleID", sql.Int);
    transactionTable.columns.add("Quantity", sql.Int);
    transactionTable.columns.add("TotalBillAmount", sql.Decimal(18, 2));
    transactionTable.columns.add("PartnerName", sql.NVarChar(255));
    transactionTable.columns.add("PartnerPhone", sql.VarChar(20));
    transactionTable.columns.add("PartnerLicensePlate", sql.VarChar(50));
    transactionTable.columns.add("CommissionAmount", sql.Decimal(18, 2));

    for (const tx of payload.transactions) {
      if (!tx.groupKey || !tx.ruleId || !tx.partnerName || !tx.partnerPhone) {
        throw new Error(
          `Giao dịch được gửi lên thiếu thông tin bắt buộc. Dữ liệu: ${JSON.stringify(
            tx
          )}`
        );
      }
      transactionTable.rows.add(
        tx.groupKey,
        tx.customerInfo || null,
        tx.ruleId,
        tx.quantity,
        tx.totalBillAmount || null,
        tx.partnerName,
        tx.partnerPhone,
        tx.partnerLicensePlate || null,
        tx.commissionAmount
      );
    }

    const request = pool.request();
    request.input("CreatedByUserID", sql.Int, userId);
    request.input("TransactionList", transactionTable);

    const result = await request.execute(
      "proc_COMMISSION_SaveTransactionBatch"
    );

    if (!result.recordset[0] || result.recordset[0].Success == false) {
      console.error("Stored Procedure returned an error:", result.recordset[0]);
      throw new Error(
        result.recordset[0]?.Message || "Stored Procedure thực thi thất bại."
      );
    }

    return result.recordset[0];
  } catch (error) {
    console.error("Error in saveCommissionBatch service:", error);
    throw error;
  }
};

export const getCommissionTransactions = async (
  fromDate: string,
  toDate: string,
  partnerPhone?: string,
  paymentStatus?: number
) => {
  try {
    const request = pool.request();
    request.input("FromDate", sql.Date, fromDate);
    request.input("ToDate", sql.Date, toDate);
    if (partnerPhone)
      request.input("PartnerPhone", sql.VarChar(20), partnerPhone);
    if (paymentStatus !== undefined)
      request.input("PaymentStatus", sql.TinyInt, paymentStatus);

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

// =========================================================================
// CÁC HÀM KHÁC
// =========================================================================

export const createCommissionPayout = async (
  payload: ICreatePayoutPayload,
  userId: number
) => {
  try {
    const request = pool.request();
    request.input("OBJ_AUTOID", sql.Int, payload.partnerId);
    request.input("PaymentDate", sql.Date, payload.paymentDate);
    request.input("AmountPaid", sql.Decimal(18, 2), payload.amountPaid);
    request.input("PaymentMethod", sql.NVarChar(100), payload.paymentMethod);
    request.input("Notes", sql.NVarChar(500), payload.notes);
    request.input("CreatedByUserID", sql.Int, userId);
    request.input(
      "TransactionIDs",
      sql.VarChar(sql.MAX),
      payload.transactionIDs.join(",")
    );
    const result = await request.execute("proc_COMMISSION_CreatePayout");
    return result.recordset[0];
  } catch (error) {
    console.error("Lỗi trong service createCommissionPayout:", error);
    throw error;
  }
};

export const getServiceCategories = async () => {
  try {
    const request = pool.request();
    const result = await request.query(
      "SELECT CategoryID, CategoryName FROM SERVICECATEGORIES WHERE IsActive = 1 ORDER BY CategoryName"
    );
    return result.recordset;
  } catch (error) {
    console.error("Lỗi trong service getServiceCategories:", error);
    throw error;
  }
};
// =========================================================================
// HÀM MỚI: LƯU BILL HOA HỒNG PHÂN TẦNG
// =========================================================================
export const saveSplitCommissionBill = async (
  payload: ISplitBillPayload,
  userId: number
) => {
  console.log(
    "Backend received payload for SPLIT COMMISSION BILL:",
    JSON.stringify(payload, null, 2)
  );

  if (!payload.beneficiaryList || payload.beneficiaryList.length === 0) {
    throw new Error("Danh sách người hưởng không được để trống.");
  }

  try {
    // Tạo Table-Valued Parameter
    const beneficiaryTable = new sql.Table("udt_CommissionSplitBeneficiary");
    beneficiaryTable.columns.add("PartnerName", sql.NVarChar(255));
    beneficiaryTable.columns.add("PartnerPhone", sql.VarChar(20));
    beneficiaryTable.columns.add("PartnerLicensePlate", sql.VarChar(50));
    beneficiaryTable.columns.add("CommissionRate", sql.Decimal(5, 2));
    beneficiaryTable.columns.add("CommissionAmount", sql.Decimal(18, 2));

    for (const bene of payload.beneficiaryList) {
      beneficiaryTable.rows.add(
        bene.partnerName,
        bene.partnerPhone,
        bene.partnerLicensePlate || null,
        bene.commissionRate,
        bene.commissionAmount
      );
    }

    const request = pool.request();
    // Input cho các tham số của Bill Master
    request.input("CustomerInfo", sql.NVarChar(255), payload.customerInfo);
    request.input("GrossRevenue", sql.Decimal(18, 2), payload.grossRevenue);
    request.input("TaxRate", sql.Decimal(5, 2), payload.taxRate);
    request.input(
      "TotalCommissionRate",
      sql.Decimal(5, 2),
      payload.totalCommissionRate
    );
    request.input("Notes", sql.NVarChar(500), payload.notes || null);
    request.input("CreatedByUserID", sql.Int, userId);
    // Input cho danh sách người hưởng
    request.input("BeneficiaryList", beneficiaryTable);

    const result = await request.execute(
      "proc_COMMISSION_SaveSplitCommissionBill"
    );

    if (!result.recordset[0] || result.recordset[0].Success == false) {
      console.error("Stored Procedure returned an error:", result.recordset[0]);
      throw new Error(
        result.recordset[0]?.Message || "Stored Procedure thực thi thất bại."
      );
    }

    return result.recordset[0];
  } catch (error) {
    console.error("Error in saveSplitCommissionBill service:", error);
    throw error;
  }
};
// HÀM MỚI: LƯU BILL HOA HỒNG HỢP NHẤT
// =========================================================================
export const saveUnifiedBill = async (
  payload: IUnifiedBillPayload,
  userId: number
) => {
  try {
    // Tạo UDT cho Service List
    const serviceTable = new sql.Table("udt_CommissionBillDetails");
    serviceTable.columns.add("RuleID", sql.Int);
    serviceTable.columns.add("Quantity", sql.Int);
    serviceTable.columns.add("BaseAmount", sql.Decimal(18, 2));
    serviceTable.columns.add("CommissionAmount", sql.Decimal(18, 2));
    for (const service of payload.serviceList) {
      serviceTable.rows.add(
        service.ruleId,
        service.quantity,
        service.baseAmount || null,
        service.commissionAmount
      );
    }

    // Tạo UDT cho Beneficiary List
    const beneficiaryTable = new sql.Table("udt_CommissionSplitBeneficiary");
    beneficiaryTable.columns.add("PartnerName", sql.NVarChar(255));
    beneficiaryTable.columns.add("PartnerPhone", sql.VarChar(20));
    beneficiaryTable.columns.add("PartnerLicensePlate", sql.VarChar(50));
    beneficiaryTable.columns.add("CommissionRate", sql.Decimal(5, 2));
    beneficiaryTable.columns.add("CommissionAmount", sql.Decimal(18, 2));
    for (const bene of payload.beneficiaryList) {
      beneficiaryTable.rows.add(
        bene.partnerName,
        bene.partnerPhone,
        bene.partnerLicensePlate || null,
        bene.commissionRate,
        bene.commissionAmount
      );
    }

    const request = pool.request();
    request.input("CustomerInfo", sql.NVarChar(255), payload.customerInfo);
    request.input(
      "TotalCommissionAmount",
      sql.Decimal(18, 2),
      payload.totalCommissionAmount
    );
    request.input("Notes", sql.NVarChar(500), payload.notes || null);
    request.input("CreatedByUserID", sql.Int, userId);
    request.input("ServiceList", serviceTable);
    request.input("BeneficiaryList", beneficiaryTable);

    const result = await request.execute("proc_COMMISSION_SaveUnifiedBill");

    if (!result.recordset[0] || result.recordset[0].Success == false) {
      throw new Error(
        result.recordset[0]?.Message || "Stored Procedure thực thi thất bại."
      );
    }
    return result.recordset[0];
  } catch (error) {
    console.error("Error in saveUnifiedBill service:", error);
    throw error;
  }
};
