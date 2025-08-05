// src/types/commission.types.ts (File cho Backend)

// ===================================================================
// ==================== SECTION: COMMISSION TYPES ====================
// ===================================================================

/**
 * Cấu trúc của một dòng giao dịch sau khi được "trải phẳng" từ frontend.
 * Khớp với payload mà hàm saveCommissionBatch nhận được.
 */
export interface IFlattenedTransaction {
  groupKey: string;
  customerInfo?: string;
  ruleId: number;
  quantity: number;
  totalBillAmount?: number;
  partnerName: string;
  partnerPhone: string;
  partnerLicensePlate?: string;
  commissionAmount: number;
}

/**
 * Payload chính mà API /api/commissions/batch nhận được.
 */
export interface ICommissionBatchPayload {
  transactions: IFlattenedTransaction[];
}

/**
 * Payload để cập nhật một giao dịch từ trang Báo cáo.
 */
export interface ITransactionUpdatePayload {
  PartnerName?: string;
  PartnerPhone?: string;
  PartnerLicensePlate?: string;
  Quantity?: number;
  CommissionAmount?: number;
}

/**
 * Payload để tạo/sửa một Quy tắc.
 */
export interface IRulePayload {
  RuleID?: number;
  RuleName?: string; // Sửa thành optional để GetList không cần
  CategoryID?: number; // Sửa thành optional để GetList không cần
  ItemName?: string;
  CalculationType?: 1 | 2; // 1: Percentage, 2: Fixed Amount
  CommissionValue?: number;
  IsActive?: boolean;
  UserID: number;
}

/**
 * Payload để tạo phiếu chi.
 */
export interface ICreatePayoutPayload {
  partnerId: number;
  paymentDate: string;
  amountPaid: number;
  paymentMethod: string;
  notes: string;
  transactionIDs: number[];
}
/**
 * Cấu trúc của một người hưởng hoa hồng trong payload gửi từ frontend.
 */
export interface ISplitBeneficiaryPayload {
  partnerName: string;
  partnerPhone: string;
  partnerLicensePlate?: string;
  commissionRate: number; // % hoa hồng của riêng người này
  commissionAmount: number; // Tiền hoa hồng cuối cùng của người này
}

/**
 * Cấu trúc payload hoàn chỉnh cho API tạo bill hoa hồng phân tầng.
 */
export interface ISplitBillPayload {
  // Thông tin bill gốc
  customerInfo: string;
  grossRevenue: number;
  taxRate: number;
  totalCommissionRate: number;
  notes?: string;
  // Danh sách người hưởng
  beneficiaryList: ISplitBeneficiaryPayload[];
}
// ===================================================================
// ============ SECTION 6: UNIFIED COMMISSION (LOGIC CUỐI) ===========
// ===================================================================

/** Chi tiết một dịch vụ trong payload hợp nhất */
export interface IUnifiedServicePayload {
  ruleId: number;
  quantity: number;
  baseAmount?: number;
  commissionAmount: number;
}

/** Chi tiết một người hưởng trong payload hợp nhất */
export interface IUnifiedBeneficiaryPayload {
  partnerName: string;
  partnerPhone: string;
  partnerLicensePlate?: string;
  commissionRate: number; // % phân chia
  commissionAmount: number; // số tiền cuối cùng
}

/** Payload hoàn chỉnh cho API hợp nhất */
export interface IUnifiedBillPayload {
  customerInfo: string;
  notes?: string;
  totalCommissionAmount: number;
  serviceList: IUnifiedServicePayload[];
  beneficiaryList: IUnifiedBeneficiaryPayload[];
}
export interface ICategoryPayload {
  CategoryID?: number;
  CategoryName?: string;
  IsActive?: boolean;
  UserID: number;
}
