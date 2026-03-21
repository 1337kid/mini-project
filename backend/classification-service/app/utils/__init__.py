import os
import json
from google.cloud import storage
from google.oauth2 import service_account
import asyncio
import csv
import joblib
import shutil
import numpy as np
import base64
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

supabaseClient = create_client(
    os.getenv("SUPABASE_URL"), 
    os.getenv("SUPABASE_SERVICE_KEY"),
)

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))

SCRIPTS_DIR = os.path.join(BASE_DIR, "app/scripts")
DOWNLOADS_DIR = os.path.join(BASE_DIR, "downloads")
MODEL_DIR = os.path.join(BASE_DIR, "app/model")

TOP_TRIGRAM_FILE = os.path.join(SCRIPTS_DIR, "top_500_3grams.txt")
MODEL_FILE = os.path.join(MODEL_DIR, "ransomware_rf_model.pkl")

model = joblib.load(MODEL_FILE)


def extract_features(trigram_csv_path: str) -> list[float]:
    with open(TOP_TRIGRAM_FILE, "r") as f:
        top_trigrams = [line.strip() for line in f if line.strip()]

    features = {tg: 0 for tg in top_trigrams}

    with open(trigram_csv_path, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            trigram = row["trigram"]
            freq = int(row["freq"])
            if trigram in features:
                features[trigram] = freq

    total_count = sum(features.values())
    if total_count > 0:
        features = {tg: freq / total_count for tg, freq in features.items()}

    return np.array([[features[tg] for tg in top_trigrams]])


def predict(trigram_csv_path: str) -> dict:
    X = extract_features(trigram_csv_path)

    label = model.predict(X)[0]
    probabilities = model.predict_proba(X)[0]
    confidence = max(probabilities)
    class_labels = model.classes_

    os.remove(trigram_csv_path)

    return {
        "prediction": int(label),
        "confidence": round(float(confidence), 4),
        "probabilities": {
            str(cls): round(float(prob), 4)
            for cls, prob in zip(class_labels, probabilities)
        }
    }

def get_storage_client():
    credentials_json = os.getenv("GCP_SERVICE_ACCOUNT_KEY_BASE64")

    if not credentials_json:
        raise ValueError("GCP_SERVICE_ACCOUNT_KEY_BASE64 env var not set")
    
    credentials_json = base64.b64decode(credentials_json).decode('utf-8')

    credentials_info = json.loads(credentials_json)
    credentials = service_account.Credentials.from_service_account_info(credentials_info)
    return storage.Client(credentials=credentials)

async def getApkAnalysis(checksum: str):
    apk_path = os.path.join(DOWNLOADS_DIR, f"{checksum}.apk")

    output_csv = f"{checksum}_3gram.csv"
    output_csv_path = os.path.join(SCRIPTS_DIR, output_csv)
    final_csv_path = os.path.join(DOWNLOADS_DIR, output_csv)

    proc = await asyncio.create_subprocess_exec(
        "python",
        os.path.join(SCRIPTS_DIR, "native_3gram_pipeline.py"),
        apk_path,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        cwd=SCRIPTS_DIR
    )

    stdout, stderr = await proc.communicate()

    print("Script output:\n", stdout.decode())

    if proc.returncode != 0:
        raise RuntimeError(f"Script failed:\n{stderr.decode()}")

    if stderr:
        print("Warnings:\n", stderr.decode())

    if os.path.isfile(output_csv_path):
        shutil.move(output_csv_path, final_csv_path)
        print(f"Moved {output_csv} → downloads/")
    else:
        raise FileNotFoundError(f"{output_csv_path} not generated")

    os.remove(apk_path)
    return predict(final_csv_path)