// src/routes/commission.routes.ts

import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import {
  // Handlers cho Cài đặt
  getRulesHandler,
  saveRuleHandler,
  deleteRuleHandler,
  getCategoriesHandler,
  saveCategoryHandler,
  deleteCategoryHandler,
  // Handlers cho Ghi nhận Bill
  createUnifiedBillHandler,
  getBillForPrintingHandler, // THÊM MỚI: Handler để in phiếu
  // Handlers cho Báo cáo
  getReportHandler,
  updateTransactionHandler,
  deleteTransactionHandler,
  // Handlers cho Đối tác
  getPartnerByPhoneHandler, // THÊM MỚI: Handler để lấy thông tin đối tác
} from "../controllers/commission.controller";

const router = Router();
router.use(protect);

// === QUẢN LÝ CÀI ĐẶT (SETTINGS) ===
router.route("/rules").get(getRulesHandler).post(saveRuleHandler);
router.route("/rules/:id").put(saveRuleHandler).delete(deleteRuleHandler);

router.route("/categories").get(getCategoriesHandler).post(saveCategoryHandler);
router
  .route("/categories/:id")
  .put(saveCategoryHandler)
  .delete(deleteCategoryHandler);

// === QUẢN LÝ ĐỐI TÁC (PARTNERS) ===
// THÊM MỚI: Lấy thông tin đối tác theo SĐT để tự động điền tên
router.get("/partners/by-phone/:phone", getPartnerByPhoneHandler);

// === GHI NHẬN & IN PHIẾU HOA HỒNG ===
// Ghi nhận bill hợp nhất
router.post("/unified-bill", createUnifiedBillHandler);
// Lấy dữ liệu của 1 bill để in
router.get("/unified-bill/:id/for-print", getBillForPrintingHandler);

// === BÁO CÁO & ĐỐI SOÁT ===
router.get("/report", getReportHandler);
router
  .route("/transactions/:id")
  .put(updateTransactionHandler)
  .delete(deleteTransactionHandler);

// === CÁC ROUTE ĐÃ BỊ XÓA ===
// router.post("/payouts", createPayoutHandler); // XÓA: Chức năng thanh toán đã bị loại bỏ

export default router;
