# CAC OCR comparison

The supplier workspace stores uploaded CAC certificates privately. A platform reviewer can run `src/vendor/ocr/verify_cac.py` against a certificate attached to that supplier's verification case. The script compares the printed registration number and business name with values decoded from the certificate's own QR code.

This comparison does not query CAC, establish authenticity, approve a supplier, or change any verification status. A human reviewer remains responsible for checking the source document and recording the decision.

## Local setup

Install Python 3, Tesseract OCR, and the Python packages:

```powershell
python -m pip install -r ocr/requirements.txt
```

Set `OCR_PYTHON_EXECUTABLE` if Python is not available as `python` on Windows or `python3` on Linux. Set `TESSERACT_CMD` if the Tesseract executable is outside the normal path. The API accepts PDF, JPG, and PNG files up to 15 MB.

Uploaded certificate files are stored under `SUPPLIER_DOCUMENT_STORAGE_DIR` and are not served publicly. In Docker, mount a persistent private volume at `/var/lib/impressor/supplier-documents`. The database stores the private relative storage key and SHA-256 fingerprint. Back up the volume with the database.

The browser requests a five-minute, one-use upload ticket from the authenticated Next.js route, then sends the certificate directly to the NestJS API. This keeps files up to the approved 15 MB limit out of Vercel Function request bodies. Set `BACKEND_URL` to the backend address reachable by Next.js, `BACKEND_PUBLIC_URL` to the HTTPS API address reachable by the browser, and `FRONTEND_ORIGINS` to the comma-separated frontend origins allowed by backend CORS. Apply the `CreateSupplierUploadTickets1791761600000` database migration before enabling the direct upload route.
