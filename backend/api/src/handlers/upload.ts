import { Request, Response } from "express";
import crypto from "crypto";
import { Storage } from "@google-cloud/storage";
import { supabase } from "@/lib/supabase";
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
        const destFileName = `${checksum}.apk`;
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

        const { data, error } = await supabase
          .from("files")
          .upsert(
            {
              checksum: checksum,
              status: "analyzing",
            },
            { onConflict: "checksum" },
          )
          .select("id")
          .single();

        if (error) throw error;
        const fileId = data.id;

        await fetch(
          `${appConfig.CLASSIFIER_SERVICE_URL}/classify/${checksum}`,
          {
            method: "POST",
          },
        );
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
