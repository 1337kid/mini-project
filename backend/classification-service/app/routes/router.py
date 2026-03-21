from fastapi import APIRouter, HTTPException
from pathlib import Path
import io
import os
import asyncio
from uuid import uuid4
from ..utils import getApkAnalysis, get_storage_client, supabaseClient

router = APIRouter()
storage_client = get_storage_client()

SAVE_DIR = Path("downloads")
SAVE_DIR.mkdir(exist_ok=True)

BUCKET_NAME = os.getenv("GCP_BUCKET_NAME", "app_bucket_mini")

task_results = {}

@router.get("/")
async def home():
    return {"status": "ok"}

@router.post("/classify/{checksum}")
async def classify(checksum: str):
    bucket = storage_client.bucket(BUCKET_NAME)
    filename = f'{checksum}.apk'
    blob = bucket.blob(filename)

    if not blob.exists():
        raise HTTPException(status_code=404, detail="APK not found in storage")

    try:
        task_id = str(uuid4())
        task_results[task_id] = {"status": "processing", "checksum": checksum}

        async def background_analysis():
            try:
                file_path = SAVE_DIR / filename
                blob.download_to_filename(str(file_path))
                result = await getApkAnalysis(checksum)

                supabaseClient.schema("private").table("files").update({
                    "status": "completed",
                    "confidence_score": result["confidence"],
                    "prediction": result["prediction"]
                }).eq("checksum", checksum).execute()

                task_results[task_id] = {
                    "status": "completed",
                    "checksum": checksum,
                    "analysis": result
                }
            except Exception as e:
                supabaseClient.schema("private").table("files").update({
                    "status": "failed",
                    "error": str(e)
                }).eq("checksum", checksum).execute()
                
                task_results[task_id] = {
                    "status": "failed",
                    "checksum": checksum,
                    "error": str(e)
                }

        asyncio.create_task(background_analysis())

        return {
            "task_id": task_id,
            "status": "processing",
            "checksum": checksum,
            "message": "Analysis started. Use /status/{task_id} to check progress."
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status/{task_id}")
async def get_status(task_id: str):
    if task_id not in task_results:
        raise HTTPException(status_code=404, detail="Task not found")
    return task_results[task_id]