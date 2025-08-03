// src/controllers/ticket.controller.ts

import { Request, Response } from "express";
import { findTicketByCode } from "../services/ticket.service";

export const getTicketDetailsHandler = async (req: Request, res: Response) => {
  const { ticketCode } = req.params;

  if (!ticketCode) {
    res.status(400).json({ message: "Ticket code is required" });
    return;
  }

  try {
    const ticketDetails = await findTicketByCode(ticketCode);

    if (!ticketDetails) {
      res
        .status(404)
        .json({ message: `QR mã '${ticketCode}' không tìm thấy.` });
      return;
    }

    res.status(200).json({
      message: "Ticket found",
      data: ticketDetails,
    });
  } catch (error) {
    console.error(`Error fetching ticket ${ticketCode}:`, error);
    res.status(500).json({ message: "Internal server error" });
  }
};
