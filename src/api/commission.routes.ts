import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { 
    saveBatchHandler,
    getReportHandler,
    createPayoutHandler,
    getServiceCategoriesHandler,
    getRulesHandler,
    saveRuleHandler,
    deleteRuleHandler 
} from "../controllers/commission.controller";

const router = Router();

// Tất cả các route trong file này đều cần xác thực
router.use(protect);

/**
 * @route   POST /api/commissions/batch
 * @desc    Lưu một loạt giao dịch hoa hồng từ một phiên nhập liệu
 * @access  Private
 */
router.post("/batch", saveBatchHandler);

/**
 * @route   GET /api/commissions/report
 * @desc    Lấy báo cáo các giao dịch hoa hồng
 * @access  Private
 */
router.get("/report", getReportHandler);

/**
 * @route   POST /api/commissions/payouts
 * @desc    Tạo một phiếu chi thanh toán
 * @access  Private
 */
router.post("/payouts", createPayoutHandler);

/**
 * @route   GET /api/commissions/service-categories
 * @desc    Lấy danh sách các loại dịch vụ
 * @access  Private
 */
router.get("/service-categories", getServiceCategoriesHandler);

/**
 * @route   GET /api/commissions/rules
 * @desc    Lấy danh sách quy tắc hoa hồng
 * @access  Private
 */
router.get("/rules", getRulesHandler);
router.post("/rules", saveRuleHandler);
router.delete("/rules/:id", deleteRuleHandler);

export default router;