// src/controllers/commission.controller.ts

import { Request, Response, RequestHandler } from "express";
import * as commissionService from "../services/commission.service";
import {
  ICreatePayoutPayload,
  IRulePayload,
  ITransactionUpdatePayload,
  IUnifiedBillPayload,
  ICategoryPayload,
} from "../types/commission.types";

// ================== QUẢN LÝ CÀI ĐẶT (SETTINGS) ==================

// ---- RULES ----
export const getRulesHandler: RequestHandler = async (req, res) => {
  try {
    const payload = { UserID: (req as any).user?.UserId || 0 };
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
      return; // SỬA
    }
    const ruleId = req.params.id ? parseInt(req.params.id) : undefined;
    const payload = { ...req.body, RuleID: ruleId, UserID: userId };
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
      return; // SỬA
    }
    const ruleId = parseInt(req.params.id);
    if (!ruleId) {
      res.status(400).json({ message: "Rule ID là bắt buộc." });
      return; // SỬA
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
    const payload = { UserID: (req as any).user?.UserId || 0 };
    const result = await commissionService.manageSettingsApi(
      "GetCategoryList",
      payload
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
      return; // SỬA
    }
    const categoryId = req.params.id ? parseInt(req.params.id) : undefined;
    const payload: ICategoryPayload = {
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
      return; // SỬA
    }
    const categoryId = parseInt(req.params.id);
    if (!categoryId) {
      res.status(400).json({ message: "Category ID là bắt buộc." });
      return; // SỬA
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

// ================== HÀM MỚI: GHI NHẬN BILL HOA HỒNG HỢP NHẤT ==================
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
    const payload: IUnifiedBillPayload = req.body;
    if (
      !payload.serviceList ||
      payload.serviceList.length === 0 ||
      !payload.beneficiaryList ||
      payload.beneficiaryList.length === 0
    ) {
      res.status(400).json({
        message: "Danh sách dịch vụ và người hưởng không được để trống.",
      });
      return; // SỬA
    }
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

// ================== BÁO CÁO & ĐỐI SOÁT (TRANSACTIONS) ==================
export const getReportHandler: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const { fromDate, toDate, partnerPhone, paymentStatus } = req.query;
    if (!fromDate || !toDate) {
      res.status(400).json({ message: "fromDate và toDate là bắt buộc." });
      return; // SỬA
    }
    const transactions = await commissionService.getCommissionTransactions(
      fromDate as string,
      toDate as string,
      partnerPhone as string | undefined,
      paymentStatus ? parseInt(paymentStatus as string) : undefined
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
      return; // SỬA
    }
    const transactionId = parseInt(req.params.id);
    if (!transactionId) {
      res.status(400).json({ message: "Transaction ID là bắt buộc." });
      return; // SỬA
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
      return; // SỬA
    }
    const transactionId = parseInt(req.params.id);
    if (!transactionId) {
      res.status(400).json({ message: "Transaction ID là bắt buộc." });
      return; // SỬA
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

// ================== CÁC CHỨC NĂNG KHÁC ==================
export const createPayoutHandler: RequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user?.UserId;
    if (!userId) {
      res.status(403).json({ message: "Forbidden: User ID không hợp lệ." });
      return; // SỬA
    }
    const body: ICreatePayoutPayload = req.body;
    if (
      !body.partnerId ||
      !body.paymentDate ||
      !body.amountPaid ||
      !body.transactionIDs ||
      !Array.isArray(body.transactionIDs) ||
      body.transactionIDs.length === 0
    ) {
      res.status(400).json({ message: "Thiếu các trường thông tin bắt buộc." });
      return; // SỬA
    }
    const payload: ICreatePayoutPayload = {
      partnerId: body.partnerId,
      paymentDate: body.paymentDate,
      amountPaid: body.amountPaid,
      paymentMethod: body.paymentMethod || "",
      notes: body.notes || "",
      transactionIDs: body.transactionIDs,
    };
    const result = await commissionService.createCommissionPayout(
      payload,
      userId
    );
    if ((result as any).Success) {
      res.status(201).json({
        message: (result as any).Message,
        payoutId: (result as any).Result,
      });
    } else {
      res.status(400).json({
        message: (result as any).Message || "Tạo phiếu chi thất bại.",
      });
    }
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Lỗi máy chủ nội bộ", detail: error.message });
  }
};
