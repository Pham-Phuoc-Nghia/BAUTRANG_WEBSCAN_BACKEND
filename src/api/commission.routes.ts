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

  // Handlers cho Đối tác
  getPartnerByPhoneHandler,

  // Handlers cho Bill (Lưu, Lấy để sửa, Lấy để in, Xóa)
  saveUnifiedBillHandler, // <-- Dùng chung cho Create & Update
  getBillForPrintingHandler,
  getFullBillForEditingHandler,
  deleteFullBillHandler,

  // Handlers cho Báo cáo (Transactions riêng lẻ)
  getReportHandler,
  updateTransactionHandler,
  deleteTransactionHandler,
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
router.get("/partners/by-phone/:phone", getPartnerByPhoneHandler);

// === GHI NHẬN & CHỈNH SỬA PHIẾU HOA HỒNG (BILL MASTER) ===
// Endpoint này giờ dùng cho cả CREATE và UPDATE
router.post("/unified-bill", saveUnifiedBillHandler);

// Endpoint LẤY DỮ LIỆU của 1 bill để SỬA
router.get("/unified-bill/:id/for-editing", getFullBillForEditingHandler);

// Endpoint LẤY DỮ LIỆU của 1 bill để IN
router.get("/unified-bill/:id/for-print", getBillForPrintingHandler);

// Endpoint XÓA một bill hoàn chỉnh
router.delete("/unified-bill/:id", deleteFullBillHandler);

// === BÁO CÁO & ĐỐI SOÁT (TRANSACTIONS) ===
router.get("/report", getReportHandler);
router
  .route("/transactions/:id")
  .put(updateTransactionHandler)
  .delete(deleteTransactionHandler);

export default router;
