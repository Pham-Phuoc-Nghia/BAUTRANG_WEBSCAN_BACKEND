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
  // Handlers cho Báo cáo
  getReportHandler,
  updateTransactionHandler,
  deleteTransactionHandler,
  // Handlers khác
  createPayoutHandler,
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

// === GHI NHẬN HOA HỒNG (LOGIC MỚI HỢP NHẤT) ===
router.post("/unified-bill", createUnifiedBillHandler);

// === BÁO CÁO & ĐỐI SOÁT ===
router.get("/report", getReportHandler);
router
  .route("/transactions/:id")
  .put(updateTransactionHandler)
  .delete(deleteTransactionHandler);

// === CHỨC NĂNG KHÁC ===
router.post("/payouts", createPayoutHandler);

export default router;
