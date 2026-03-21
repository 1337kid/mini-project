import { Request, Response } from "express";
import { supabase } from "@/lib/supabase";

export async function checkStatus(req: Request, res: Response) {
  try {
    const { checksum } = req.params;

    const { data: fileData, error } = await supabase
      .from('files')
      .select('status, confidence_score, prediction')
      .eq('checksum', checksum)
      .single();

    if (error || !fileData) {
      return res.status(404).json({ message: "File not found" });
    }

    if (fileData.status === "analyzing" || fileData.status === "pending") {
      return res.status(200).json({ status: "pending", message: "analysing.." });
    }

    return res.status(200).json({
      status: fileData.status, 
      confidence_score: fileData.confidence_score,
      prediction: fileData.prediction,
    });
  } catch (err: any) {
    console.error("Status Check Error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}