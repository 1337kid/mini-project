import dotenv from 'dotenv';
import { writeFileSync } from 'fs';

dotenv.config();

if(!process.env.GCP_SERVICE_ACCOUNT_KEY_BASE64) {
    console.error('fatal: GCP_SERVICE_ACCOUNT_KEY_BASE64 not set in env');
    process.exit(1);
}

const credBase64 = process.env.GCP_SERVICE_ACCOUNT_KEY_BASE64;
const credBuffer = Buffer.from(credBase64, 'base64');
const credJson = credBuffer.toString('utf-8');

writeFileSync('google-credentials.json', credJson);
