import { Router } from "express";
import { uploadAPK } from "@/handlers/upload";
import { checkStatus } from "@/handlers/status"; 
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", upload.single("apk"), uploadAPK);
router.get("/status/:checksum", checkStatus); 

export default router;