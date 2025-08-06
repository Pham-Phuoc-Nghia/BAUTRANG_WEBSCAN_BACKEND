// src/types/commission.types.ts

// ===================================================================
// ==================== SECTION: CORE TYPES ==========================
// ===================================================================

/**
 * Payload để tạo/sửa một Quy tắc hoa hồng.
 */
export interface IRulePayload {
  RuleID?: number;
  RuleName?: string;
  CategoryID?: number; // Bắt buộc khi tạo/sửa
  ItemName?: string;
  CalculationType?: 1 | 2; // 1: Percentage, 2: Fixed Amount
  CommissionValue?: number;
  IsActive?: boolean;
  UserID: number;
}

/**
 * Payload để tạo/sửa một Loại dịch vụ.
 */
export interface ICategoryPayload {
  CategoryID?: number;
  CategoryName?: string;
  IsActive?: boolean;
  UserID: number;
}

/**
 * Payload để cập nhật một Giao dịch hoa hồng riêng lẻ.
 */
export interface ITransactionUpdatePayload {
  PartnerName?: string;
  PartnerPhone?: string;
  PartnerLicensePlate?: string;
  CommissionAmount?: number;
}

// ===================================================================
// ============ SECTION: UNIFIED COMMISSION BILLING ==================
// ===================================================================

/** Chi tiết một dịch vụ trong payload của bill hợp nhất */
export interface IUnifiedServicePayload {
  ruleId: number;
  ruleName: string; // << THÊM MỚI: Tên quy tắc để lưu snapshot
  quantity: number;
  baseAmount?: number; // Tiền gốc để tính % (nếu có)
  commissionAmount: number; // Tiền hoa hồng của dịch vụ này
}

/** Chi tiết một người hưởng trong payload của bill hợp nhất */
export interface IUnifiedBeneficiaryPayload {
  partnerName: string;
  partnerPhone: string;
  partnerLicensePlate?: string;
  commissionAmount: number;
}

/** Payload hoàn chỉnh cho API tạo bill hợp nhất */
export interface IUnifiedBillPayload {
  customerInfo: string;
  notes?: string;
  totalCommissionAmount: number;
  serviceList: IUnifiedServicePayload[]; // <-- Interface này đã được cập nhật
  beneficiaryList: IUnifiedBeneficiaryPayload[];
}
// ===================================================================
// ================ SECTION: NEW TYPES FOR NEW FEATURES ==============
// ===================================================================

/**
 * Cấu trúc dữ liệu của một đối tác
 */
export interface IPartner {
  PartnerID: number;
  PartnerName: string;
  PartnerPhone: string;
  PartnerLicensePlate: string | null;
}

/**
 * Cấu trúc dữ liệu trả về cho việc in phiếu
 */
export interface IPrintBillPayload {
  billInfo: {
    BillMasterID: number;
    BillDate: Date;
    CustomerInfo: string;
    TotalCommissionAmount: number;
    Notes: string;
  };
  services: {
    RuleName: string;
    ItemName: string;
    CategoryName: string;
    Quantity: number;
    CommissionAmount: number;
  }[];
  beneficiaries: {
    PartnerName: string;
    PartnerPhone: string;
    PartnerLicensePlate: string;
    CommissionAmount: number;
  }[];
}
