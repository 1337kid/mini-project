import { Request, Response } from "express";
import { pool } from "@/lib/db";

export async function checkStatus(req: Request, res: Response) {
  try {
    const { checksum } = req.params;

    const query = `SELECT status, confidence_score FROM files WHERE checksum = $1;`;
    const result = await pool.query(query, [checksum]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "File not found" });
    }

    const fileData = result.rows[0];

    if (fileData.status === "analyzing" || fileData.status === "pending") {
      return res.status(200).json({ status: "pending", message: "analysing.." });
    }

    return res.status(200).json({
      status: fileData.status, 
      confidence_score: fileData.confidence_score,
    });
  } catch (err: any) {
    console.error("Status Check Error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}