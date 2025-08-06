// src/controllers/commission.controller.ts

import { Request, Response, RequestHandler } from "express";
import * as commissionService from "../services/commission.service";
import {
  ITransactionUpdatePayload,
  IUnifiedBillPayload,
  ICategoryPayload,
  IRulePayload,
} from "../types/commission.types";

// ================== QUẢN LÝ CÀI ĐẶT (SETTINGS) ==================

// ---- RULES ----
export const getRulesHandler: RequestHandler = async (req, res) => {
  try {
    const categoryId = req.query.categoryId
      ? parseInt(req.query.categoryId as string)
      : undefined;
    const payload = { CategoryID: categoryId };
    const result = await commissionService.manageSettingsApi(
      "GetRuleList",
      payload
    );
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: "Lỗi", detail: error.message });
  }
};

export const saveRuleHandler: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user?.UserId;
    if (!userId) {
      res.status(403).json({ message: "Forbidden" });
      return; // FIX: Chỉ cần return, không return res.json()
    }
    const ruleId = req.params.id ? parseInt(req.params.id) : undefined;
    const payload: Partial<IRulePayload> = {
      ...req.body,
      RuleID: ruleId,
      UserID: userId,
    };
    const result = await commissionService.manageSettingsApi(
      "SaveRule",
      payload
    );
    res.status((result as any).Code || 200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: "Lỗi", detail: error.message });
  }
};

export const deleteRuleHandler: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user?.UserId;
    if (!userId) {
      res.status(403).json({ message: "Forbidden" });
      return; // FIX
    }
    const ruleId = parseInt(req.params.id);
    if (!ruleId) {
      res.status(400).json({ message: "Rule ID là bắt buộc." });
      return; // FIX
    }
    const payload = { RuleID: ruleId, UserID: userId };
    const result = await commissionService.manageSettingsApi(
      "DeleteRule",
      payload
    );
    res.status((result as any).Code || 200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: "Lỗi", detail: error.message });
  }
};

// ---- CATEGORIES ----
export const getCategoriesHandler: RequestHandler = async (req, res) => {
  try {
    const result = await commissionService.manageSettingsApi(
      "GetCategoryList",
      {}
    );
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: "Lỗi", detail: error.message });
  }
};

export const saveCategoryHandler: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user?.UserId;
    if (!userId) {
      res.status(403).json({ message: "Forbidden" });
      return; // FIX
    }
    const categoryId = req.params.id ? parseInt(req.params.id) : undefined;
    const payload: Partial<ICategoryPayload> = {
      ...req.body,
      CategoryID: categoryId,
      UserID: userId,
    };
    const result = await commissionService.manageSettingsApi(
      "SaveCategory",
      payload
    );
    res.status((result as any).Code || 200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: "Lỗi", detail: error.message });
  }
};

export const deleteCategoryHandler: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user?.UserId;
    if (!userId) {
      res.status(403).json({ message: "Forbidden" });
      return; // FIX
    }
    const categoryId = parseInt(req.params.id);
    if (!categoryId) {
      res.status(400).json({ message: "Category ID là bắt buộc." });
      return; // FIX
    }
    const payload = { CategoryID: categoryId, UserID: userId };
    const result = await commissionService.manageSettingsApi(
      "DeleteCategory",
      payload
    );
    res.status((result as any).Code || 200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: "Lỗi", detail: error.message });
  }
};

// ================== QUẢN LÝ ĐỐI TÁC (PARTNERS) ==================
export const getPartnerByPhoneHandler: RequestHandler = async (req, res) => {
  try {
    const { phone } = req.params;
    if (!phone) {
      res.status(400).json({ message: "Số điện thoại là bắt buộc." });
      return; // FIX
    }
    const partner = await commissionService.getPartnerByPhone(phone);
    if (partner) {
      res.status(200).json(partner);
    } else {
      res.status(404).json({ message: "Không tìm thấy đối tác." });
    }
  } catch (error: any) {
    res.status(500).json({ message: "Lỗi máy chủ", detail: error.message });
  }
};

// ================== GHI NHẬN & IN PHIẾU ==================
// ================== GHI NHẬN & IN PHIẾU ==================
export const createUnifiedBillHandler: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user?.UserId;
    if (!userId) {
      res.status(403).json({ message: "Forbidden: User ID không hợp lệ." });
      return;
    }
    // Payload nhận từ req.body giờ đây đã bao gồm `ruleName` trong mỗi phần tử của serviceList
    const payload: IUnifiedBillPayload = req.body;

    // Các bước kiểm tra vẫn như cũ
    if (
      !payload.serviceList ||
      payload.serviceList.length === 0 ||
      !payload.beneficiaryList ||
      payload.beneficiaryList.length === 0
    ) {
      res.status(400).json({
        message: "Danh sách dịch vụ và người hưởng không được để trống.",
      });
      return;
    }

    // Chuyển payload tới service, service sẽ tự xử lý dữ liệu mới
    const result = await commissionService.saveUnifiedBill(payload, userId);
    res.status((result as any).Code || 201).json(result);
  } catch (error: any) {
    const errorMessage =
      (error as any).originalError?.info?.message || (error as Error).message;
    res.status(500).json({
      message: "Lỗi máy chủ nội bộ khi ghi nhận bill.",
      detail: errorMessage,
    });
  }
};

export const getBillForPrintingHandler: RequestHandler = async (req, res) => {
  try {
    const billId = parseInt(req.params.id);
    if (!billId) {
      res.status(400).json({ message: "Bill ID là bắt buộc." });
      return; // FIX
    }
    const printData = await commissionService.getBillForPrinting(billId);
    res.status(200).json(printData);
  } catch (error: any) {
    res.status(500).json({ message: "Lỗi máy chủ", detail: error.message });
  }
};

// ================== BÁO CÁO & ĐỐI SOÁT (TRANSACTIONS) ==================
export const getReportHandler: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const { fromDate, toDate, partnerPhone } = req.query;
    if (!fromDate || !toDate) {
      res.status(400).json({ message: "fromDate và toDate là bắt buộc." });
      return; // FIX
    }
    const transactions = await commissionService.getCommissionTransactions(
      fromDate as string,
      toDate as string,
      partnerPhone as string | undefined
    );
    res.status(200).json(transactions);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Lỗi máy chủ nội bộ", detail: error.message });
  }
};

export const updateTransactionHandler: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user?.UserId;
    if (!userId) {
      res.status(403).json({ message: "Forbidden: User ID không hợp lệ." });
      return; // FIX
    }
    const transactionId = parseInt(req.params.id);
    if (!transactionId) {
      res.status(400).json({ message: "Transaction ID là bắt buộc." });
      return; // FIX
    }
    const payload: ITransactionUpdatePayload = req.body;
    const result = await commissionService.manageCommissionTransaction(
      "Update",
      transactionId,
      userId,
      payload
    );
    res.status((result as any).Code || 200).json(result);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Lỗi máy chủ nội bộ", detail: error.message });
  }
};

export const deleteTransactionHandler: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user?.UserId;
    if (!userId) {
      res.status(403).json({ message: "Forbidden: User ID không hợp lệ." });
      return; // FIX
    }
    const transactionId = parseInt(req.params.id);
    if (!transactionId) {
      res.status(400).json({ message: "Transaction ID là bắt buộc." });
      return; // FIX
    }
    const result = await commissionService.manageCommissionTransaction(
      "Delete",
      transactionId,
      userId
    );
    res.status((result as any).Code || 200).json(result);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Lỗi máy chủ nội bộ", detail: error.message });
  }
};
