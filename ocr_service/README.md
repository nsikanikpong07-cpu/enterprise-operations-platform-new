# CAC Certificate Verification (OCR + QR)

`verify_cac.py` reads a Nigerian Corporate Affairs Commission (CAC) certificate, an image or a PDF, and
checks that what is **printed** on the certificate agrees with what is **encoded in the certificate's own
QR code**.

It checks two fields:

| Field | Printed on certificate | QR code |
|---|---|---|
| Registration number | read by OCR (RC, BN, IT or no prefix) | `rcNumber` |
| Company / business name | read by OCR | `companyName` |

The issue date is read and saved for reference, but it is **not** part of the decision. The QR timestamp is
often a day or more later than the printed date on genuine certificates.

This script compares a certificate with itself. It does **not** check the CAC register. A forger who
makes a certificate and a matching QR code would still pass, so a registry lookup is a separate step.

## Results

| Result | Meaning |
|---|---|
| `PASS` | Registration number and company name were read and both match the QR. |
| `REVIEW` | Something needs a person to look: a mismatch, a field the OCR could not read clearly, a QR that could not be decoded, or a PDF whose hidden text disagrees with the visible page. |

The script never returns an automatic "fail". A certificate that cannot be read is sent for review, not
rejected, because bad scans are far more common than forgeries.

## Requirements

- Python 3.10 or newer
- [Tesseract OCR 5](https://github.com/UB-Mannheim/tesseract/wiki), installed on the machine.
  On Windows use the UB Mannheim installer. The script finds
  `C:\Program Files\Tesseract-OCR\tesseract.exe` by itself. On Linux or macOS install `tesseract-ocr`
  with your package manager.
- Python packages:

```
pip install opencv-python numpy pytesseract pymupdf pillow
```

(`requirements.txt` in this folder also lists the web service packages, which this script does not need.)

## Usage

```
python verify_cac.py <certificate.png|.jpg|.jpeg|.pdf> [document_id]
```

Examples:

```
python verify_cac.py CAC-001.png
python verify_cac.py CAC-001.pdf VENDOR-42
```

- `document_id` is optional. It names the output files. If left out, the file name is used.
- A PDF is read from its first page, rendered at 300 DPI. Its hidden text layer is also compared with the
  visible page.
- Reading takes about 10 to 40 seconds per certificate.

### Example output

```
Reading emperor.jpg (image file). This takes 10 to 40 seconds...

QR found : True (via bottom_3x_sharp, width 74 px)
QR payload: {"id":12344125,"companyName":"EMPEROR GLOBAL TECH LIMITED","rcNumber":"9746220",...}

field                 certificate                       qr                                match
registration_number   9746220                           9746220                           True
company_name          EMPEROR GLOBAL TECH LIMITED       EMPEROR GLOBAL TECH LIMITED       True

Pass 1 result: PASS
  - registration number and company name match
  - QR is small (74 px); decoded but the scan is low quality
```

## Output files

Written to the `output/` folder next to the script, named after the document ID:

| File | Contents |
|---|---|
| `<id>_pass1.json` | The verdict: per-field values, match flags, notes, reasons. This is the file other programs should read. |
| `<id>_qr.json` | The raw QR payload and how it was decoded. |
| `<id>_ocr.json` | Every OCR reading and vote, including the issue date, and the raw text. For debugging. |
| `<id>_deskewed.jpg` | The straightened page the OCR actually saw. Open it when a field was not read. |

Keep `output/` out of version control. It holds real certificates' details.

## How it works

1. **Load.** Images are read directly. PDFs are rendered at 300 DPI and their text layer is kept.
2. **Straighten.** The page is resized to a standard size and the tilt is corrected.
3. **Read several ways.** The page is read as plain greyscale, with shadows removed, as text only (dark and
   red ink without the green background pattern), with contrast enhancement, and with enlarged crops of the
   company name (printed in red) and the date line.
4. **Parse with tolerant rules.** Registration numbers are found by their label, names by the "this is to
   certify that" wording and the red text, and dates with repairs for common OCR slips such as "30rd".
   Nothing is guessed. An unreadable value stays empty.
5. **Vote.** Every reading votes. If two readings tie, the field is treated as unread instead of picking one.
6. **Decode the QR.** Several versions of the page are tried, then enlarged and sharpened crops of the
   bottom of the page, where small or blurry QR codes are rescued.
7. **Compare.** Registration number and company name are compared with the QR. Names ignore case,
   punctuation and stray characters at the edges.

## Known limits

- **Low-quality screenshots are the main cause of REVIEW.** A QR code needs to be about 120 px wide to read
  reliably. Below roughly 75 px it often cannot be decoded. A QR that decodes under 120 px is reported as
  "low quality scan".
- **Use the original PDF when you can.** A PDF from CAC gives a sharp QR code and a clean text layer, and
  almost always reads correctly.
- **Heavily blurred or phone-photographed certificates** may leave a field unread.
- **Only page 1 of a PDF is read.**
- **A matching certificate is not proof of registration.** Check the CAC register as a second step.

## Troubleshooting

| Message | Cause and fix |
|---|---|
| `TesseractNotFoundError` | Tesseract is not installed, or not in the usual folder. Install it, then set `pytesseract.pytesseract.tesseract_cmd` near the top of `verify_cac.py` to its full path. |
| `Could not read image` | The path or file name is wrong, or the file is not a valid image. Check the spelling and the folder you are running from. |
| `QR code could not be decoded` | The QR is too small or blurred. Use the original PDF or a sharper scan. |
| A field shows `None` | The OCR could not read it clearly. Open `<id>_deskewed.jpg` and `<id>_ocr.json` to see what was seen. |
| Result is `REVIEW` with "PDF text layer says..." | The hidden text in the PDF disagrees with the visible page. This can mean the PDF was edited, so a person should check it. |