
import os
import tempfile
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException
from starlette.concurrency import run_in_threadpool

# Import your existing service functions
from ocr_service import extract_cac_details
from verify_cac import verify_cac_registration


app = FastAPI(
    title="CAC Document Verification API",
    description="OCR extraction and CAC registration verification",
    version="1.0.0"
)

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@app.get("/")
def home():
    return {
        "status": "running",
        "message": "CAC Document Verification API is operational"
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/api/cac/verify")
async def verify_cac_document(
    file: UploadFile = File(...)
):
    # 1. Validate file type
    extension = Path(file.filename or "").suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported document format. Upload PDF, PNG or JPG."
        )

    # 2. Read and validate file size
    contents = await file.read()

    if not contents:
        raise HTTPException(
            status_code=400,
            detail="Uploaded document is empty."
        )

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Document exceeds the 10MB upload limit."
        )

    temp_path = None

    try:
        # 3. Save document temporarily
        with tempfile.NamedTemporaryFile(
            suffix=extension,
            delete=False
        ) as temp_file:
            temp_file.write(contents)
            temp_path = temp_file.name

        # 4. Extract CAC details using OCR
        ocr_result = await run_in_threadpool(
            extract_cac_details,
            temp_path
        )

        if not ocr_result:
            raise HTTPException(
                status_code=422,
                detail="Unable to extract information from document."
            )

        # 5. Get registration number from OCR result
        registration_number = ocr_result.get(
            "registration_number"
        )

        if not registration_number:
            raise HTTPException(
                status_code=422,
                detail="CAC registration number was not detected."
            )

        # 6. Verify registration number with CAC verification service
        verification_result = await run_in_threadpool(
            verify_cac_registration,
            registration_number
        )

        # 7. Return combined result
        return {
            "success": True,
            "message": "Document processing completed",
            "extracted_details": ocr_result,
            "verification": verification_result
        }

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="An error occurred while processing the document."
        )

    finally:
        # 8. Remove temporary document
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
