import dotenv from "dotenv";
import { config } from "@/types";

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const DB_URI = process.env.DB_URI;
const GCP_BUCKET_NAME = process.env.GCP_BUCKET_NAME;

if (!DB_URI) {
  throw new Error("DB_URI is not defined in environment variables");
}

if (!GCP_BUCKET_NAME) {
  throw new Error("GCP_BUCKET_NAME is not defined in environment variables");
}

const appConfig: config = {
  PORT,
  DB_URI,
  GCP_BUCKET_NAME,
};

export default appConfig;