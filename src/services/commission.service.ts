// src/services/commission.service.ts

import sql from "mssql";
import pool from "../config/database";

// =========================================================================
// CÁC INTERFACE ĐỊNH NGHĨA CẤU TRÚC DỮ LIỆU - CHỈ DÙNG CHO TYPESCRIPT
// BẠN KHÔNG CẦN TẠO FILE RIÊNG CHO CHÚNG
// =========================================================================

// Interface cho một dòng giao dịch hoa hồng khi gửi từ Frontend lên
interface ICommissionTransactionItem {
    objAutoid?: number; // Optional
    partnerName: string;
    partnerPhone: string;
    partnerLicensePlate?: string;
    categoryId: number;
    itemId?: number; // Chính là RuleID
    quantity: number;
    baseAmount?: number;
    commissionAmount: number;
}
// Interface cho toàn bộ payload của một phiên nhập liệu
interface ICommissionBatchPayload {
    transactionDate: string;
    transactions: ICommissionTransactionItem[];
}


// =========================================================================
// CÁC HÀM SERVICE GỌI STORED PROCEDURE
// =========================================================================


/**
 * @description Service để lưu một loạt giao dịch hoa hồng từ form nhập liệu mới.
 * @summary Gọi SP: proc_COMMISSION_SaveTransactionBatch
 * @param payload Dữ liệu từ frontend
 * @param userId ID người dùng đang đăng nhập
 */
export const saveCommissionBatch = async (payload: ICommissionBatchPayload, userId: number) => {
    try {
        const transactionTable = new sql.Table("udt_CommissionTransactionList");

        // Cấu trúc này PHẢI KHỚP 100% với udt_CommissionTransactionList trong SQL Server
        transactionTable.columns.add("OBJ_AUTOID", sql.Int);
        transactionTable.columns.add("PartnerName", sql.NVarChar(255));
        transactionTable.columns.add("PartnerPhone", sql.VarChar(20));
        transactionTable.columns.add("PartnerLicensePlate", sql.VarChar(50));
        transactionTable.columns.add("CategoryID", sql.Int);
        transactionTable.columns.add("ItemID", sql.Int);
        transactionTable.columns.add("Quantity", sql.Int);
        transactionTable.columns.add("BaseAmount", sql.Decimal(18, 2));
        transactionTable.columns.add("CommissionAmount", sql.Decimal(18, 2));

        // Nạp dữ liệu từ payload vào table-valued parameter
        payload.transactions.forEach((tx) => {
            transactionTable.rows.add(
                tx.objAutoid || null,
                tx.partnerName,
                tx.partnerPhone,
                tx.partnerLicensePlate || null,
                tx.categoryId,
                tx.itemId || null,
                tx.quantity,
                tx.baseAmount || null, // Cho phép null nếu không phải là nhà hàng
                tx.commissionAmount
            );
        });

        const request = pool.request();
        request.input("TransactionDate", sql.Date, payload.transactionDate);
        request.input("CreatedByUserID", sql.Int, userId);
        request.input("TransactionList", transactionTable); // Truyền cả bảng dữ liệu vào SP

        const result = await request.execute("proc_COMMISSION_SaveTransactionBatch");
        return result.recordset[0]; // Trả về { Success: 1, Message: '...' }
    } catch (error) {
        console.error("Error in saveCommissionBatch service:", error);
        throw new Error("Lỗi khi lưu các giao dịch hoa hồng.");
    }
};

/**
 * @description Service để lấy báo cáo giao dịch hoa hồng.
 * @summary Gọi SP: proc_COMMISSION_GetTransactions
 */
export const getCommissionTransactions = async (
    fromDate: string,
    toDate: string,
    partnerId?: number,
    paymentStatus?: number
) => {
    try {
        const request = pool.request();
        request.input("FromDate", sql.Date, fromDate);
        request.input("ToDate", sql.Date, toDate);
        if (partnerId) {
            request.input("OBJ_AUTOID", sql.Int, partnerId);
        }
        if (paymentStatus !== undefined) {
            request.input("PaymentStatus", sql.TinyInt, paymentStatus);
        }
        const result = await request.execute("proc_COMMISSION_GetTransactions");
        return result.recordset;
    }
    catch (error) {
        console.error("Error in getCommissionTransactions service:", error);
        throw new Error("Lỗi khi lấy dữ liệu báo cáo.");
    }
};

/**
 * @description Service để tạo phiếu chi thanh toán hoa hồng.
 * @summary Gọi SP: proc_COMMISSION_CreatePayout
 */
export const createCommissionPayout = async (
    partnerId: number,
    paymentDate: string,
    amountPaid: number,
    paymentMethod: string,
    notes: string,
    transactionIDs: number[],
    userId: number
) => {
    try {
        const request = pool.request();
        request.input("OBJ_AUTOID", sql.Int, partnerId);
        request.input("PaymentDate", sql.Date, paymentDate);
        request.input("AmountPaid", sql.Decimal(18, 2), amountPaid);
        request.input("PaymentMethod", sql.NVarChar(100), paymentMethod);
        request.input("Notes", sql.NVarChar(500), notes);
        request.input("CreatedByUserID", sql.Int, userId);
        // Chuyển mảng ID thành chuỗi '1,2,3' để truyền vào SP
        request.input("TransactionIDs", sql.VarChar(sql.MAX), transactionIDs.join(','));

        const result = await request.execute("proc_COMMISSION_CreatePayout");
        return result.recordset[0];
    } catch (error) {
        console.error("Error in createCommissionPayout service:", error);
        throw new Error("Lỗi khi tạo phiếu chi thanh toán.");
    }
};

/**
 * @description Lấy danh sách các loại dịch vụ có thể tính hoa hồng.
 * @summary Giả định bạn có bảng SERVICECATEGORIES
 */
export const getServiceCategories = async () => {
    try {
        const request = pool.request();
        // Giả định bạn có một SP hoặc query đơn giản để lấy danh sách này
        const result = await request.query("SELECT CategoryID, CategoryName FROM SERVICECATEGORIES WHERE IsActive = 1 ORDER BY CategoryName");
        return result.recordset;
    } catch (error) {
        console.error("Error in getServiceCategories service:", error);
        throw new Error("Lỗi khi lấy danh sách loại dịch vụ.");
    }
}

/**
 * @description Service để lấy danh sách các quy tắc hoa hồng.
 * @summary Gọi SP: proc_COMMISSION_GetRules
 */
export const getCommissionRules = async (categoryId?: number) => {
    try {
        const request = pool.request();
        if (categoryId) {
            request.input("CategoryID", sql.Int, categoryId);
        }
        const result = await request.execute("proc_COMMISSION_GetRules");
        return result.recordset;
    } catch (error) {
        console.error("Error in getCommissionRules service:", error);
        throw new Error("Lỗi khi lấy danh sách quy tắc hoa hồng.");
    }
};

/**
 * @description Service để lưu một quy tắc hoa hồng (thêm mới/cập nhật).
 * @summary Gọi SP: proc_COMMISSION_SaveRule
 */
export const saveCommissionRule = async (payload: any) => {
    try {
        const request = pool.request();
        // Các tham số này PHẢI KHỚP với các tham số trong SP proc_COMMISSION_SaveRule
        request.input("RuleID", sql.Int, payload.RuleID || null);
        request.input("RuleName", sql.NVarChar(255), payload.RuleName);
        request.input("CategoryID", sql.Int, payload.CategoryID);
        request.input("ItemName", sql.NVarChar(255), payload.ItemName || null); // Cột mới
        request.input("CalculationType", sql.TinyInt, payload.CalculationType); // Cột mới
        request.input("CommissionValue", sql.Decimal(18, 2), payload.CommissionValue);
        request.input("IsActive", sql.Bit, payload.IsActive !== undefined ? payload.IsActive : 1);
        request.input("UserID", sql.Int, payload.UserID);

        // Xóa các tham số không còn sử dụng trong form mới nếu có trong SP cũ
        // request.input("ApplyTo", sql.TinyInt, payload.ApplyTo);
        // request.input("PIT_AUTOID", sql.Int, payload.PIT_AUTOID || null);
        // request.input("POG_AUTOID", sql.Int, payload.POG_AUTOID || null);
        // request.input("OBJ_AUTOID", sql.Int, payload.OBJ_AUTOID || null);

        const result = await request.execute("proc_COMMISSION_SaveRule");
        return result.recordset[0];
    } catch (error) {
        console.error("Error in saveCommissionRule service:", error);
        throw new Error("Lỗi khi lưu quy tắc hoa hồng.");
    }
};

/**
 * @description Service để xóa (xóa mềm) một quy tắc hoa hồng.
 * @summary Gọi SP: proc_COMMISSION_DeleteRule
 */
export const deleteCommissionRule = async (ruleId: number, userId: number) => {
    try {
        const request = pool.request();
        request.input("RuleID", sql.Int, ruleId);
        request.input("UserID", sql.Int, userId);
        const result = await request.execute("proc_COMMISSION_DeleteRule");
        return result.recordset[0];
    } catch (error) {
        console.error("Error in deleteCommissionRule service:", error);
        throw new Error("Lỗi khi xóa quy tắc hoa hồng.");
    }
};