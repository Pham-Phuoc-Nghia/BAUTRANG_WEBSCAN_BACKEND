// src/controllers/meta.controller.ts
import { Request, Response } from "express";
import { getCompaniesAndBranches } from "../services/meta.service";

export const getBranchListHandler = async (req: Request, res: Response) => {
  try {
    const branches = await getCompaniesAndBranches();
    res.status(200).json({
      message: "Branch list fetched successfully",
      data: branches,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
