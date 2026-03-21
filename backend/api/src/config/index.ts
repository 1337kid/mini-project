import dotenv from "dotenv";
import { config } from "@/types";

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const GCP_BUCKET_NAME = process.env.GCP_BUCKET_NAME;
const GCP_SERVICE_ACCOUNT_KEY_BASE64 = process.env.GCP_SERVICE_ACCOUNT_KEY_BASE64;
const CLASSIFIER_SERVICE_URL = process.env.CLASSIFIER_SERVICE_URL;

if (!SUPABASE_SERVICE_KEY) {
  throw new Error("SUPABASE_SERVICE_KEY is not defined in environment variables");
}

if (!SUPABASE_URL) {
  throw new Error("SUPABASE_URL is not defined in environment variables");
}

if (!GCP_SERVICE_ACCOUNT_KEY_BASE64) {
  throw new Error("GCP_SERVICE_ACCOUNT_KEY_BASE64 is not defined in environment variables");
}

if (!GCP_BUCKET_NAME) {
  throw new Error("GCP_BUCKET_NAME is not defined in environment variables");
}

if (!CLASSIFIER_SERVICE_URL) {
  throw new Error("CLASSIFIER_SERVICE_URL is not defined in environment variables");
}

const appConfig: config = {
  PORT,
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
  GCP_BUCKET_NAME,
  GCP_SERVICE_ACCOUNT_KEY_BASE64,
  CLASSIFIER_SERVICE_URL,
};

export default appConfig;