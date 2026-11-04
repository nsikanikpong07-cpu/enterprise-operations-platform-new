"""HTTP service around the CAC verification pipeline, for the ProcureShield backend.

The backend sends a certificate file; the service runs verify_cac.py on it and the verdict
goes back either by polling or by a signed callback to the backend.

Run (from this folder):
    $env:OCR_API_KEY = "a-long-random-string"          # backend sends this in X-API-Key
    $env:CALLBACK_SECRET = "another-long-random-string"  # optional; signs callbacks
    python -m uvicorn ocr_service:app --host 127.0.0.1 --port 8100

Endpoints
    POST /verifications        multipart: file (png/jpg/pdf), reference (optional), callback_url (optional)
                               -> 202 {job_id, status:"queued"}
    GET  /verifications/{id}   -> current status / final result
    GET  /health
"""
import os
import re
import sys
import json
import hmac
import time
import uuid
import queue
import hashlib
import threading
import subprocess
from datetime import datetime, timezone
from pathlib import Path

import requests
from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile

HERE = Path(__file__).resolve().parent
BASE = HERE
OUT = BASE / "output"
UPLOADS = BASE / "service_uploads"
OUT.mkdir(parents=True, exist_ok=True)
UPLOADS.mkdir(parents=True, exist_ok=True)

API_KEY = os.environ.get("OCR_API_KEY", "").strip()
CALLBACK_SECRET = os.environ.get("CALLBACK_SECRET", "").strip().encode()
CALLBACK_HOSTS = {h.strip().lower() for h in os.environ.get("CALLBACK_ALLOWED_HOSTS", "").split(",") if h.strip()}
MAX_BYTES = int(os.environ.get("OCR_MAX_UPLOAD_MB", "15")) * 1024 * 1024
WORKERS = int(os.environ.get("OCR_WORKERS", "1"))          # each OCR run is CPU heavy
TIMEOUT = int(os.environ.get("OCR_TIMEOUT_SEC", "300"))

MAGIC = {b"\x89PNG": ".png", b"\xff\xd8\xff": ".jpg", b"%PDF": ".pdf"}

app = FastAPI(title="ProcureShield CAC verification")
JOBS = {}          # job_id -> record (in memory; the result JSON files in output/ are the durable copy)
LOCK = threading.Lock()
Q = queue.Queue()


def now():
    return datetime.now(timezone.utc).isoformat()


def require_key(x_api_key):
    if not API_KEY:
        raise HTTPException(503, "Server has no OCR_API_KEY set")
    if not x_api_key or not hmac.compare_digest(x_api_key, API_KEY):
        raise HTTPException(401, "Invalid or missing X-API-Key")


def check_callback(url):
    if not url:
        return None
    m = re.match(r"^https?://([^/:]+)", url, re.I)
    if not m:
        raise HTTPException(422, "callback_url must start with http:// or https://")
    if CALLBACK_HOSTS and m.group(1).lower() not in CALLBACK_HOSTS:
        raise HTTPException(422, "callback_url host is not in CALLBACK_ALLOWED_HOSTS")
    return url


def read_json(p):
    try:
        return json.loads(Path(p).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


def run_script(name, *args):
    return subprocess.run([sys.executable, str(HERE / name), *args], capture_output=True, text=True,
                          timeout=TIMEOUT, cwd=str(HERE))


def build_result(job_id):
    """Compact verdict for the backend, built from the JSON files the scripts wrote."""
    p1 = read_json(OUT / f"{job_id}_pass1.json")
    qr = read_json(OUT / f"{job_id}_qr.json") or {}
    if not p1:
        return None
    f = p1["pass_1"]
    out = {
        "result": p1["pass_1_result"],
        "reasons": p1.get("reasons", []) + p1.get("notes", []),
        "qr_found": qr.get("qr_found", False),
        "registration_number": f["registration_number"],
        "company_name": f["company_name"],
    }
    return out


def process(job_id):
    job = JOBS[job_id]
    job["status"], job["started_at"] = "processing", now()
    try:
        r1 = run_script("verify_cac.py", job["path"], job_id)
        if not (OUT / f"{job_id}_pass1.json").exists():
            raise RuntimeError((r1.stdout + r1.stderr).strip()[-400:] or "OCR produced no result")
        job["outcome"] = build_result(job_id)
        job["status"] = "done"
        if job["outcome"] is None:
            raise RuntimeError("no result file was written")
    except Exception as e:                              # noqa: BLE001 - report every failure to the backend
        job["status"], job["outcome"] = "failed", {"result": "ERROR", "reasons": [f"{type(e).__name__}: {e}"]}
    finally:
        job["finished_at"] = now()
        try:
            Path(job["path"]).unlink(missing_ok=True)     # the backend keeps the original; we do not
        except OSError:
            pass
    send_callback(job)


def public(job):
    return {k: job.get(k) for k in ("job_id", "reference", "status", "created_at", "started_at", "finished_at")} | {
        "outcome": job.get("outcome")}


def send_callback(job):
    url = job.get("callback_url")
    if not url:
        return
    body = json.dumps(public(job)).encode()
    headers = {"Content-Type": "application/json"}
    if CALLBACK_SECRET:
        headers["X-Signature"] = "sha256=" + hmac.new(CALLBACK_SECRET, body, hashlib.sha256).hexdigest()
    for attempt in range(4):
        try:
            if requests.post(url, data=body, headers=headers, timeout=15).status_code < 300:
                job["callback"] = "delivered"
                return
        except requests.RequestException:
            pass
        time.sleep(2 ** attempt * 2)
    job["callback"] = "failed"        # the backend can still fetch GET /verifications/{id}


def worker():
    while True:
        job_id = Q.get()
        try:
            process(job_id)
        finally:
            Q.task_done()


for _ in range(max(1, WORKERS)):
    threading.Thread(target=worker, daemon=True).start()


@app.get("/health")
def health():
    return {"ok": True, "queued": Q.qsize()}


@app.post("/verifications", status_code=202)
async def create(file: UploadFile = File(...), reference: str = Form(None), callback_url: str = Form(None),
                 x_api_key: str = Header(None)):
    require_key(x_api_key)
    callback_url = check_callback(callback_url)
    data = await file.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise HTTPException(413, f"File is larger than {MAX_BYTES // 1024 // 1024} MB")
    ext = next((e for m, e in MAGIC.items() if data.startswith(m)), None)
    if not ext:
        raise HTTPException(415, "Only PNG, JPEG and PDF files are accepted")
    job_id = uuid.uuid4().hex
    path = UPLOADS / f"{job_id}{ext}"
    path.write_bytes(data)
    with LOCK:
        JOBS[job_id] = {"job_id": job_id, "reference": reference, "status": "queued", "created_at": now(),
                        "path": str(path), "callback_url": callback_url}
    Q.put(job_id)
    return {"job_id": job_id, "reference": reference, "status": "queued"}


@app.get("/verifications/{job_id}")
def get_one(job_id: str, x_api_key: str = Header(None)):
    require_key(x_api_key)
    job = JOBS.get(job_id)
    if job:
        return public(job)
    if re.fullmatch(r"[0-9a-f]{32}", job_id):          # service restarted: fall back to the files on disk
        outcome = build_result(job_id)
        if outcome:
            return {"job_id": job_id, "status": "done", "outcome": outcome}
    raise HTTPException(404, "Unknown job_id")