import { Request, Response } from "express";
import crypto from "crypto";
import { Storage } from "@google-cloud/storage";
import { pool } from "@/lib/db";
import appConfig from "@/config";

const storage = new Storage();
const bucket = storage.bucket(appConfig.GCP_BUCKET_NAME);

export async function uploadAPK(req: Request, res: Response) {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const hashSum = crypto.createHash("sha256");
    hashSum.update(file.buffer);
    const checksum = hashSum.digest("hex");

    res.status(202).json({
      message: "File accepted. Processing started.",
      checksum: checksum,
    });

    (async () => {
      try {
        const destFileName = `${Date.now()}_${file.originalname}`;
        const blob = bucket.file(destFileName);

        await new Promise((resolve, reject) => {
          const blobStream = blob.createWriteStream({
            resumable: false,
            contentType: file.mimetype,
          });
          blobStream.on("error", reject);
          blobStream.on("finish", resolve);
          blobStream.end(file.buffer);
        });

        const gcpStoragePath = `gs://${appConfig.GCP_BUCKET_NAME}/${destFileName}`;

        const insertQuery = `
          INSERT INTO files (filename, gcp_storage_path, status, checksum)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (checksum) DO UPDATE SET status = 'analyzing'
          RETURNING id;
        `;
        const dbResult = await pool.query(insertQuery, [
          file.originalname,
          gcpStoragePath,
          "analyzing",
          checksum,
        ]);
        
        const fileId = dbResult.rows[0].id;

        const classifierUrl = process.env.CLASSIFIER_URL || "http://localhost:8080";

        await fetch(`${classifierUrl}/classify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file_id: fileId,
            gcp_storage_path: gcpStoragePath,
          }),
        });
      } catch (bgError) {
        console.error("Background processing failed:", bgError);
      }
    })();
  } catch (err: any) {
    console.error("Upload Error:", err);
    if (!res.headersSent) {
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
}