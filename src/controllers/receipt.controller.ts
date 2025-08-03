// src/controllers/receipt.controller.ts

import { Request, Response } from "express";
import { findReceiptByCode } from "../services/receipt.service";

export const getReceiptDetailsHandler = async (req: Request, res: Response) => {
  const { ticketCode } = req.params;
  // @ts-ignore
  const user = req.user;

  if (!user || !user.branchId) {
    res
      .status(401)
      .json({ message: "Không tìm thấy thông tin chi nhánh của người dùng." });
    return;
  }

  if (!ticketCode) {
    res.status(400).json({ message: "Mã hóa đơn là bắt buộc" });
    return;
  }

  try {
    const searchDate = req.query.date
      ? new Date(req.query.date as string)
      : new Date();

    const receiptDetails = await findReceiptByCode(
      ticketCode,
      user.branchId,
      searchDate
    );

    if (!receiptDetails || receiptDetails.length === 0) {
      res.status(404).json({
        message: `'${ticketCode}' Mã này không phải của ngày hôm nay.`,
      });
      return;
    }

    res.status(200).json({
      message: "Tìm thấy thông tin hóa đơn",
      data: receiptDetails,
    });
  } catch (error) {
    console.error(`Error fetching receipt ${ticketCode}:`, error);
    res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};
