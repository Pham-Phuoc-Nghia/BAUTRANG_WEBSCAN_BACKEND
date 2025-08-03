// src/controllers/commission.controller.ts

import { Request, Response, RequestHandler } from "express";
import * as commissionService from "../services/commission.service";

// Controller để lưu một loạt giao dịch hoa hồng
export const saveBatchHandler: RequestHandler = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.UserId;
        if (!userId) {
            // Đã xóa 'return'
            res.status(403).json({ message: "Forbidden: User ID không hợp lệ." });
            return; // Dùng return không có giá trị để thoát khỏi hàm
        }

        const payload = req.body;
        const result = await commissionService.saveCommissionBatch(payload, userId);

        if (result.Success) {
            res.status(201).json({ message: result.Message });
        } else {
            res.status(400).json({ message: result.Message || "Lưu thất bại." });
        }
    } catch (error: any) {
        res.status(500).json({ message: "Lỗi máy chủ nội bộ", detail: error.message });
    }
};

// Controller để lấy báo cáo giao dịch
export const getReportHandler: RequestHandler = async (req: Request, res: Response) => {
    try {
        const { fromDate, toDate, partnerId, paymentStatus } = req.query;

        if (!fromDate || !toDate) {
            // Đã xóa 'return'
            res.status(400).json({ message: "fromDate và toDate là bắt buộc." });
            return;
        }

        const transactions = await commissionService.getCommissionTransactions(
            fromDate as string,
            toDate as string,
            partnerId ? parseInt(partnerId as string) : undefined,
            paymentStatus ? parseInt(paymentStatus as string) : undefined
        );

        res.status(200).json(transactions);
    } catch (error: any) {
        res.status(500).json({ message: "Lỗi máy chủ nội bộ", detail: error.message });
    }
};

// Controller để tạo phiếu chi
export const createPayoutHandler: RequestHandler = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.UserId;
        if (!userId) {
            // Đã xóa 'return'
            res.status(403).json({ message: "Forbidden: User ID không hợp lệ." });
            return;
        }

        const { partnerId, paymentDate, amountPaid, paymentMethod, notes, transactionIDs } = req.body;

        if (!partnerId || !paymentDate || !amountPaid || !transactionIDs || !Array.isArray(transactionIDs) || transactionIDs.length === 0) {
            // Đã xóa 'return'
            res.status(400).json({ message: "Thiếu các trường thông tin bắt buộc." });
            return;
        }

        const result = await commissionService.createCommissionPayout(
            partnerId, paymentDate, amountPaid, paymentMethod || '', notes || '', transactionIDs, userId
        );

        if (result.Success) {
            res.status(201).json({ message: result.Message, payoutId: result.Result });
        } else {
            res.status(400).json({ message: result.Message || "Tạo phiếu chi thất bại." });
        }
    } catch (error: any) {
        res.status(500).json({ message: "Lỗi máy chủ nội bộ", detail: error.message });
    }
};


// Controller để lấy các loại dịch vụ
export const getServiceCategoriesHandler: RequestHandler = async (req: Request, res: Response) => {
    try {
        const categories = await commissionService.getServiceCategories();
        res.status(200).json(categories);
    } catch (error: any) {
        res.status(500).json({ message: "Lỗi máy chủ nội bộ", detail: error.message });
    }
};

// Controller để lấy danh sách quy tắc
export const getRulesHandler: RequestHandler = async (req: Request, res: Response) => {
    try {
        const { categoryId } = req.query;
        const rules = await commissionService.getCommissionRules(
            categoryId ? parseInt(categoryId as string) : undefined
        );
        res.status(200).json(rules);
    } catch (error: any) {
        res.status(500).json({ message: "Lỗi máy chủ nội bộ", detail: error.message });
    }
};

// Controller để lưu quy tắc
export const saveRuleHandler: RequestHandler = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.UserId;
        if (!userId) {
            // Đã xóa 'return'
            res.status(403).json({ message: "Forbidden: User ID không hợp lệ." });
            return;
        }
        const payload = req.body;
        const result = await commissionService.saveCommissionRule({ ...payload, UserID: userId });
        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({ message: "Lỗi máy chủ nội bộ", detail: error.message });
    }
};

// Controller để xóa quy tắc
export const deleteRuleHandler: RequestHandler = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.UserId;
        if (!userId) {
            // Đã xóa 'return'
            res.status(403).json({ message: "Forbidden: User ID không hợp lệ." });
            return;
        }
        const { id } = req.params;
        const result = await commissionService.deleteCommissionRule(parseInt(id), userId);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({ message: "Lỗi máy chủ nội bộ", detail: error.message });
    }
};