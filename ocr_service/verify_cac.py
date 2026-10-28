"""Pass 1: read a CAC certificate (image or PDF) and compare it with its own QR code.

Usage:
    python verify_cac.py <certificate.png|.jpg|.pdf> [document_id]

Checks two fields: registration number and company name (the issue date is read but not used).
Writes <id>_qr.json, <id>_ocr.json, <id>_pass1.json and <id>_deskewed.jpg (what the OCR saw)
into the output folder next to this script.

How the reading works: the page is straightened, then read several different ways (plain,
shadow-corrected, text-only, enlarged crops of the name and date lines). Every read is parsed
with tolerant rules and the reads vote. Anything uncertain gives REVIEW, never an automatic FAIL.
"""
import os
import re
import sys
import json
from collections import Counter
from datetime import date
from difflib import SequenceMatcher, get_close_matches
from pathlib import Path

import cv2
import numpy as np
import pytesseract

_WIN_TESSERACT = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
if os.name == "nt" and Path(_WIN_TESSERACT).exists():
    pytesseract.pytesseract.tesseract_cmd = _WIN_TESSERACT

BASE = Path(__file__).resolve().parent
OUT = BASE / "output"

PREFIXES = "RC|BN|IT|LP|LLP"
MONTHS = ["january", "february", "march", "april", "may", "june", "july",
          "august", "september", "october", "november", "december"]


# --------------------------------------------------------------------------- image prep
def normalize_size(bgr):
    """Tesseract is happiest with A4 at about 300 DPI (long side ~3300 px)."""
    long_side = max(bgr.shape[:2])
    if long_side < 2800:
        s = 3300 / long_side
    elif long_side > 4200:
        s = 3500 / long_side
    else:
        return bgr
    interp = cv2.INTER_CUBIC if s > 1 else cv2.INTER_AREA
    return cv2.resize(bgr, None, fx=s, fy=s, interpolation=interp)


def text_mask(bgr, thresh=None):
    """True where a pixel is dark text or red text; green guilloche and borders are ignored."""
    b, g, r = [c.astype(np.int16) for c in cv2.split(bgr)]
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    if thresh is None:
        thresh = int(np.clip(cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[0], 90, 150))
    green = (g > r + 20) & (g > b + 10)
    red = (r > 140) & (g < 110) & (b < 110)
    return ((gray < thresh) & ~green) | red


def estimate_skew(bgr):
    """Angle (degrees) that, applied as a rotation, makes the text lines horizontal."""
    h, w = bgr.shape[:2]
    scale = 900 / w
    small = cv2.resize(bgr, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
    m = text_mask(small).astype(np.uint8)
    sh, sw = m.shape
    m = m[int(sh * 0.12):int(sh * 0.9), int(sw * 0.14):int(sw * 0.86)]  # skip borders / side bars
    if m.sum() < 500:
        return 0.0
    ch, cw = m.shape
    center = (cw / 2, ch / 2)

    def score(angle):
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        r = cv2.warpAffine(m, M, (cw, ch), flags=cv2.INTER_NEAREST)
        return float(np.var(r.sum(axis=1)))

    coarse = max(np.arange(-8, 8.01, 0.5), key=score)
    fine = max(np.arange(coarse - 0.5, coarse + 0.51, 0.1), key=score)
    return float(fine) if abs(fine) >= 0.3 else 0.0


def rotate(img, angle, border=(255, 255, 255)):
    if angle == 0:
        return img
    h, w = img.shape[:2]
    M = cv2.getRotationMatrix2D((w / 2, h / 2), angle, 1.0)
    return cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_CUBIC, borderValue=border)


def make_variants(bgr):
    """name -> single-channel image for OCR."""
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    # shadow / uneven-light correction: divide by a heavily blurred copy of the page
    bg = cv2.GaussianBlur(gray, (0, 0), max(gray.shape) / 40)
    flat = np.clip(gray.astype(np.float32) / np.maximum(bg, 1) * 235, 0, 255).astype(np.uint8)
    mask = np.where(text_mask(bgr), 0, 255).astype(np.uint8)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(gray)
    return {"gray": gray, "flat": flat, "mask": mask, "clahe": clahe}


# --------------------------------------------------------------------------- parsers
def fix_digits(s):
    return s.translate(str.maketrans("OoIl|", "00111"))


def parse_registration(text):
    """Return a list of digit strings found as the certificate's registration number."""
    found = []
    text = re.sub(r"(REG\w{0,12}\W{0,2}\s*(?:NO|N0|NUMBER|NUM)\W{0,3})[ \t]*\n+[ \t]*", r"\1 ", text, flags=re.I)
    label = re.compile(
        r"REG\w{0,12}\W{0,2}\s*(?:NO|N0|NUMBER|NUM|N\u00b0)\W{0,3}\s*"
        rf"(?:({PREFIXES})\W{{0,2}}\s*)?([0-9OoIl|]{{4,8}})(?![0-9A-Za-z])", re.I)
    for line in text.splitlines():
        if re.search(r"TAX|IDENTIF", line, re.I):  # never take the TIN
            continue
        for m in label.finditer(line):
            d = fix_digits(m.group(2))
            if sum(c.isdigit() for c in d) >= 4 and d.isdigit():
                found.append(d)
        if found:
            continue
        # label present but number is separated from it by noise
        if re.search(r"REGIS\w*", line, re.I):
            tail = re.split(r"REGIS\w*", line, flags=re.I)[-1]
            for m in re.finditer(r"(?<![0-9A-Za-z])([0-9OoIl|]{5,8})(?![0-9A-Za-z])", tail):
                d = fix_digits(m.group(1))
                if d.isdigit():
                    found.append(d)
    if not found:  # prefixed number anywhere, e.g. "RC 1234567"
        for line in text.splitlines():
            if re.search(r"TAX|IDENTIF", line, re.I):
                continue
            for m in re.finditer(rf"\b({PREFIXES})\s*[-:./]?\s*([0-9OoIl|]{{4,8}})\b", line):
                d = fix_digits(m.group(2))
                if d.isdigit():
                    found.append(d)
    return found


def strip_junk(name):
    """Drop stray noise tokens at the ends of a name: lone letters ('I STYLE FINDS') and runs of
    2+ tiny tokens ('RR EE ES PRIME TECH'). Never reduces a name to fewer than two words."""
    toks = name.split()

    def tiny(t):
        return len(t) <= 2 and t.isalpha() and t != "&"

    def trim(ts, from_end):
        ts = ts[::-1] if from_end else ts
        n = 0
        while n < len(ts) and tiny(ts[n]):
            n += 1
        drop = n if (n >= 2 or (n == 1 and len(ts[0]) == 1)) else 0
        if drop and len(ts) > drop and ts[drop] == "&":  # 'A & B ENTERPRISES' is a real name
            drop = 0
        if len(ts) - drop < 2:
            drop = 0
        ts = ts[drop:]
        return ts[::-1] if from_end else ts

    toks = trim(toks, False)
    toks = trim(toks, True)
    # digits left dangling at the ends are noise too ("... GLOBAL 4")
    while len(toks) > 2 and re.fullmatch(r"\d", toks[-1]):
        toks.pop()
    while len(toks) > 2 and re.fullmatch(r"\d", toks[0]):
        toks.pop(0)
    return " ".join(toks)


def clean_name(s):
    s = s.upper()
    s = re.sub(r"[^A-Z0-9&'()./, \-]", " ", s)
    s = re.sub(r"\s+", " ", s).strip(" .,-/'")
    return strip_junk(s)


def parse_name_anchor(text):
    """Name = the line(s) between 'hereby certifies that' and 'is this day ...'."""
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    start = next((i for i, l in enumerate(lines)
                 if re.search(r"\bCERT[I1l]F[I1lY]\w{0,3}\b|\bHEREBY\b", l, re.I)
                 and not re.search(r"CERTIFICATE", l, re.I)), None)
    if start is None:
        return None
    first = lines[start]
    inline = re.split(r"\bthat\b|\bthat:", first, flags=re.I)
    pieces = []
    if len(inline) > 1 and sum(c.isalnum() for c in inline[-1]) >= 5:  # 'that ih' is noise, 'that ABC LTD' is a name
        pieces.append(inline[-1])
    stop = re.compile(r"THIS\s+DAY|IS\s+THIS|\bTHIS\b.*\bDAY|INCORPORATED|REGISTERED\s+AS|UNDER\s+THE", re.I)
    for l in lines[start + 1:start + 5]:
        if stop.search(l):
            break
        alnum = sum(c.isalnum() for c in l)
        if alnum >= 2 and alnum / max(len(l), 1) >= 0.6:
            pieces.append(l)
        if len(pieces) >= 3:
            break
    name = clean_name(" ".join(pieces))
    return name if 2 <= len(name) <= 100 else None


def month_from_word(word):
    """Month number for a (possibly OCR-garbled) month word, or None if unsure. Never guesses between close months."""
    w = re.sub(r"[^a-z]", "", word.lower().replace("0", "o").replace("1", "l"))
    if len(w) < 3:
        return None
    for i, m in enumerate(MONTHS):
        if m.startswith(w):
            return i + 1
    scored = sorted(((SequenceMatcher(None, w, m).ratio(), i + 1) for i, m in enumerate(MONTHS)), reverse=True)
    best, second = scored[0], scored[1]
    return best[1] if best[0] >= 0.6 and best[0] - second[0] >= 0.15 else None


def expected_suffix(n):
    if 10 <= n % 100 <= 20:
        return "th"
    return {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")


def repair_day(digits, suffix):
    """'30rd' is really '3rd'. Returns a day number 1-31, or None."""
    suffix = (suffix or "").lower()
    options = [digits]
    if len(digits) == 2:
        options += [digits[0], digits[1]]
    for opt in options:
        n = int(opt)
        if 1 <= n <= 31 and (not suffix or suffix == expected_suffix(n)):
            return n
    # suffix unreadable: accept the plain number only if it is a valid day
    n = int(digits)
    return n if 1 <= n <= 31 and not re.fullmatch(r"st|nd|rd|th", suffix) else None


def parse_date(text):
    """'3rd day of August, 2026' -> '2026-08-03'. Returns a list (usually 0 or 1 items)."""
    out = []
    t = re.sub(r"(?<![0-9])([0-3])1d\b", r"\1rd", text)  # '31d' is a misread '3rd'
    rx = re.compile(
        r"(?<![0-9])(\d{1,2})\s*([A-Za-z]{0,2})\W{0,3}\s*(?:d\w{1,3}\W{0,2}\s*o[ft]\W{0,3}\s*)?"
        r"([A-Za-z0-9]{3,10})\W{0,4}\s*([12][09Oo][0-9OoIl]{2})(?![0-9])")
    for m in rx.finditer(t):
        mon = month_from_word(m.group(3))
        day = repair_day(m.group(1), m.group(2))
        if not mon or not day:
            continue
        year = int(fix_digits(m.group(4)))
        try:
            d = date(year, mon, day)
        except ValueError:
            continue
        if 1960 <= d.year <= date.today().year + 1:
            out.append(d.isoformat())
    return out


def date_line_texts(img, variants):
    """Second look at the date line: find lines that contain a year, cut them out, enlarge, re-read."""
    H, W = img.shape[:2]
    d = pytesseract.image_to_data(variants["gray"], config="--psm 11",
                                  output_type=pytesseract.Output.DICT, timeout=90)
    words = [(d["text"][i].strip(), d["left"][i], d["top"][i], d["width"][i], d["height"][i])
             for i in range(len(d["text"])) if d["text"][i].strip()]
    years = [w for w in words
             if re.fullmatch(r"\W*[12][09Oo][0-9OoIl]{2}\W*", w[0]) and 0.4 * H < w[2] < 0.9 * H]
    texts, seen = [], []
    for y in years[:4]:
        cy, hh = y[2] + y[4] / 2, max(y[4], 20)
        if any(abs(cy - s) < hh for s in seen):
            continue
        seen.append(cy)
        y0, y1 = max(0, int(cy - 1.2 * hh)), min(H, int(cy + 1.2 * hh))
        x0, x1 = int(0.08 * W), int(0.92 * W)
        f = 80 / (2.4 * hh) * 1.6
        for vname in ("gray", "flat", "clahe"):
            crop = variants[vname][y0:y1, x0:x1]
            crop = cv2.resize(crop, None, fx=f, fy=f, interpolation=cv2.INTER_CUBIC)
            crop = cv2.copyMakeBorder(crop, 20, 20, 30, 30, cv2.BORDER_CONSTANT, value=int(np.median(crop)))
            texts.append(pytesseract.image_to_string(crop, config="--psm 7", timeout=40))
    return texts


# --------------------------------------------------------------------------- red name crop
def red_name_crops(bgr):
    """The company name is printed in red on CAC certificates. Locate it by colour, not by words."""
    H, W = bgr.shape[:2]
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    h, s, v = cv2.split(hsv)
    red = (((h <= 8) | (h >= 170)) & (s >= 110) & (v >= 100)).astype(np.uint8) * 255
    k = cv2.getStructuringElement(cv2.MORPH_RECT, (max(15, int(W * 0.02)), max(3, int(H * 0.004))))
    closed = cv2.morphologyEx(red, cv2.MORPH_CLOSE, k)
    cnts, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    boxes = []
    for c in cnts:
        x, y, w, hh = cv2.boundingRect(c)
        if w >= 0.06 * W and 0.008 * H <= hh <= 0.07 * H and w / hh >= 3.0 and 0.2 * H <= y <= 0.85 * H:
            boxes.append((x, y, w, hh))
    if not boxes:
        return []
    seed = max(boxes, key=lambda b: b[2])
    sx = seed[0] + seed[2] / 2
    line = [b for b in boxes if abs((b[0] + b[2] / 2) - sx) < 0.25 * W and abs(b[1] - seed[1]) < 2.5 * seed[3] * 2]
    line.sort(key=lambda b: b[1])
    crops = []
    for (x, y, w, hh) in line:
        pad = int(hh * 0.5)
        y0, y1 = max(0, y - pad), min(H, y + hh + pad)
        x0, x1 = max(0, x - pad), min(W, x + w + pad)
        gray = cv2.cvtColor(bgr[y0:y1, x0:x1], cv2.COLOR_BGR2GRAY)
        m = 255 - cv2.dilate(red[y0:y1, x0:x1], np.ones((2, 2), np.uint8))  # black text on white
        f = 90 / max(hh, 1)
        crops.append((cv2.resize(gray, None, fx=f, fy=f, interpolation=cv2.INTER_CUBIC),
                      cv2.resize(m, None, fx=f, fy=f, interpolation=cv2.INTER_CUBIC)))
    return crops


def ocr_red_name(bgr):
    crops = red_name_crops(bgr)
    if not crops:
        return []
    results = []
    for which in (0, 1):  # grey crop, red-only mask
        parts = []
        for c in crops:
            im = cv2.copyMakeBorder(c[which], 20, 20, 30, 30, cv2.BORDER_CONSTANT, value=255)
            parts.append(pytesseract.image_to_string(im, config="--psm 7", timeout=40))
        name = clean_name(" ".join(parts))
        if 2 <= len(name) <= 100:
            results.append(name)
    return results


# --------------------------------------------------------------------------- voting
def similar(a, b):
    return a == b or SequenceMatcher(None, a, b).ratio() >= 0.9


def vote(candidates, near=False):
    """candidates: list of (value, weight). Returns (winner, support, runner_up_support, tally)."""
    tally = Counter()
    for v, w in candidates:
        tally[v] += w
    if not tally:
        return None, 0.0, 0.0, {}
    support = {}
    for v in tally:
        support[v] = sum(w for u, w in tally.items() if (u == v or (near and similar(u, v))))
    ranked = sorted(support.items(), key=lambda kv: (-kv[1], -tally[kv[0]], -len(kv[0])))
    top = ranked[0]
    runner = next((s for u, s in ranked[1:] if not (near and similar(u, top[0]))), 0.0)
    winner = top[0]
    if near:
        winner = trim_edge_noise(winner, [(u, w) for u, w in tally.items() if similar(u, winner)])
    return winner, top[1], runner, dict(tally)


def trim_edge_noise(winner, cluster):
    """A tiny token at the edge of the winning name ('OK PRIME TECH GLOBAL') is dropped unless
    most of the agreeing readings also have it. Noise changes between runs; real words do not."""
    toks = winner.split()
    total = sum(w for _, w in cluster) or 1.0

    def backed(tok, at_start):
        return sum(w for u, w in cluster if (u.split()[:1] if at_start else u.split()[-1:]) == [tok]) / total

    while len(toks) > 2 and len(toks[0]) <= 2 and toks[0].isalpha() and backed(toks[0], True) <= 0.5:
        toks.pop(0)
    while len(toks) > 2 and len(toks[-1]) <= 2 and toks[-1].isalpha() and backed(toks[-1], False) <= 0.5:
        toks.pop()
    return " ".join(toks)


# --------------------------------------------------------------------------- main entry
def ocr_text(img, psm):
    try:
        return pytesseract.image_to_string(img, config=f"--psm {psm}", timeout=90)
    except RuntimeError:  # Tesseract took too long on this pass
        return ""


BASE_PASSES = [("gray", 11), ("flat", 6), ("mask", 6), ("gray", 6)]
EXTRA_PASSES = [("flat", 11), ("mask", 11), ("clahe", 6), ("clahe", 11)]


def extract_fields(bgr, extra_text=None):
    """Returns dict with reg/name/date results, per-source tallies, raw texts and diagnostics.
    extra_text: optional text layer taken from a PDF (treated as a very reliable pass)."""
    diag = {"input_size": list(bgr.shape[1::-1])}
    img = normalize_size(bgr)
    diag["normalized_size"] = list(img.shape[1::-1])
    angle = estimate_skew(img)
    img = rotate(img, angle)
    diag["deskew_degrees"] = round(angle, 2)

    variants = make_variants(img)
    texts, reg_c, name_c, date_c, sources = {}, [], [], [], {"registration_number": [], "company_name": [], "issue_date": []}

    def absorb(label, text, weight=1.0):
        texts[label] = text
        for d in parse_registration(text):
            reg_c.append((d, weight)); sources["registration_number"].append(label)
        n = parse_name_anchor(text)
        if n:
            name_c.append((n, weight)); sources["company_name"].append(label)
        for d in parse_date(text):
            date_c.append((d, weight)); sources["issue_date"].append(label)

    if extra_text:
        absorb("pdf_text_layer", extra_text, 3.0)

    for vname, psm in BASE_PASSES:
        absorb(f"{vname}_psm{psm}", ocr_text(variants[vname], psm))
    for n in ocr_red_name(img):
        name_c.append((n, 1.5)); sources["company_name"].append("red_crop")

    def status():
        r = vote(reg_c)
        n = vote(name_c, near=True)
        d = vote(date_c)
        return r, n, d

    r, n, d = status()
    weak = [x for x in (r, n, d) if x[0] is None or x[1] < 2]
    if d[0] is None or d[1] < 2:
        for i, t in enumerate(date_line_texts(img, variants)):
            texts[f"date_line_{i}"] = t
            for dd in parse_date(t):
                date_c.append((dd, 1.5)); sources["issue_date"].append("date_line_crop")
        r, n, d = status()
        weak = [x for x in (r, n, d) if x[0] is None or x[1] < 2]
    if weak:
        for vname, psm in EXTRA_PASSES:
            absorb(f"{vname}_psm{psm}", ocr_text(variants[vname], psm))
            r, n, d = status()
            if all(x[0] is not None and x[1] >= 2 for x in (r, n, d)):
                break

    if r[0] is None and n[0] is None and d[0] is None:  # nothing readable: page may be sideways/upside down
        for k, label in ((cv2.ROTATE_90_CLOCKWISE, "rot90"), (cv2.ROTATE_180, "rot180"), (cv2.ROTATE_90_COUNTERCLOCKWISE, "rot270")):
            rimg = cv2.rotate(img, k)
            vs = make_variants(rimg)
            t = ocr_text(vs["gray"], 11) + "\n" + ocr_text(vs["flat"], 6)
            if re.search(r"CERTIFICATE|REGISTRATION|CORPORATE", t, re.I):
                diag["page_rotated"] = label
                absorb(f"{label}_gray_psm11+flat_psm6", t)
                for n2 in ocr_red_name(rimg):
                    name_c.append((n2, 1.5)); sources["company_name"].append("red_crop")
                r, n, d = status()
                break

    def pack(res):
        winner, sup, runner, tally = res
        return {"value": winner, "support": sup, "runner_up_support": runner, "candidates": tally,
                "ambiguous": winner is not None and runner >= sup}

    return {"registration_number": pack(r), "company_name": pack(n), "issue_date": pack(d),
            "raw_text": texts, "sources": sources, "diagnostics": diag, "deskewed_image": img}


# =========================================================================== QR code
def _qr_try(variants):
    std = cv2.QRCodeDetector()
    aruco = cv2.QRCodeDetectorAruco() if hasattr(cv2, "QRCodeDetectorAruco") else None
    for name, scale, offset, im in variants:
        for det in (std, aruco):
            if det is None:
                continue
            try:
                text, points, _ = det.detectAndDecode(im)
            except cv2.error:
                continue
            if text:
                pts = points.reshape(-1, 2) / scale + np.array(offset)
                x0, y0 = pts.min(axis=0)
                x1, y1 = pts.max(axis=0)
                return {"qr_found": True, "qr_payload": text,  # exact decoded text, never modified
                        "bbox": {"x": int(x0), "y": int(y0), "width": int(x1 - x0), "height": int(y1 - y0)},
                        "found_with": name, "qr_width_px": int(x1 - x0)}
    return None


def decode_qr(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    H, W = gray.shape
    variants = [("original", 1.0, (0, 0), img), ("gray", 1.0, (0, 0), gray)]
    for s in (2, 3):
        big = cv2.resize(gray, None, fx=s, fy=s, interpolation=cv2.INTER_CUBIC)
        variants.append((f"gray_{s}x", float(s), (0, 0), big))
        otsu = cv2.threshold(big, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
        variants.append((f"otsu_{s}x", float(s), (0, 0), otsu))
    variants.append(("half", 0.5, (0, 0), cv2.resize(gray, None, fx=0.5, fy=0.5, interpolation=cv2.INTER_AREA)))
    hit = _qr_try(variants)
    if hit:
        return hit

    # The QR sits at the bottom centre of CAC certificates. Cut that area out and enlarge it:
    # small QR codes often fail on the full page but decode once enlarged.
    y0, y1, x0, x1 = int(H * 0.68), H, int(W * 0.2), int(W * 0.8)
    region = gray[y0:y1, x0:x1]
    tiles = []
    for s in (2, 3, 4):
        big = cv2.resize(region, None, fx=s, fy=s, interpolation=cv2.INTER_CUBIC)
        big = cv2.copyMakeBorder(big, 60, 60, 60, 60, cv2.BORDER_CONSTANT, value=255)
        tiles.append((f"bottom_{s}x", float(s), (x0 - 60 / s, y0 - 60 / s), big))
        otsu = cv2.threshold(big, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
        tiles.append((f"bottom_otsu_{s}x", float(s), (x0 - 60 / s, y0 - 60 / s), otsu))
    hit = _qr_try(tiles)
    if hit:
        return hit

    # Small or soft QR codes: enlarge with Lanczos, then sharpen. This rescued QR codes that were only
    # 75-120 px wide in low-resolution screenshots.
    sharp_tiles = []
    for (ya, yb, xa, xb, nm) in ((0.68, 1.0, 0.2, 0.8, "bottom"), (0.55, 1.0, 0.1, 0.9, "lowhalf")):
        sy0, sx0 = int(H * ya), int(W * xa)
        reg = gray[sy0:int(H * yb), sx0:int(W * xb)]
        for sc in (3, 4, 5, 6):
            big = cv2.resize(reg, None, fx=sc, fy=sc, interpolation=cv2.INTER_LANCZOS4)
            sharp = cv2.addWeighted(big, 2.0, cv2.GaussianBlur(big, (0, 0), 4), -1.0, 0)
            sharp = cv2.copyMakeBorder(sharp, 80, 80, 80, 80, cv2.BORDER_CONSTANT, value=255)
            sharp_tiles.append((f"{nm}_{sc}x_sharp", float(sc), (sx0 - 80 / sc, sy0 - 80 / sc), sharp))
    hit = _qr_try(sharp_tiles)
    if hit:
        return hit

    # Not decoded. Still try to say how big the QR is, so the reason is clear.
    width = None
    try:
        ok, pts = cv2.QRCodeDetector().detect(gray)
        if ok and pts is not None:
            p = pts.reshape(-1, 2)
            width = int(p[:, 0].max() - p[:, 0].min())
    except cv2.error:
        pass
    return {"qr_found": False, "qr_payload": None, "bbox": None, "found_with": None, "qr_width_px": width}


def qr_fields(payload):
    """Pull registration number, company name and issue date out of the QR JSON."""
    out = {"registration_number": None, "company_name": None, "issue_date": None, "raw_date": None}
    try:
        data = json.loads(payload)
    except (json.JSONDecodeError, TypeError):
        return out
    if not isinstance(data, dict):
        return out
    for k in ("rcNumber", "registrationNumber", "regNumber"):
        if data.get(k):
            out["registration_number"] = core_reg(data[k])
            break
    for k in ("companyName", "company_name", "name"):
        if data.get(k):
            out["company_name"] = str(data[k])
            break
    for k in ("timestamp", "issueDate", "date", "registrationDate"):
        if data.get(k):
            out["raw_date"] = str(data[k])
            out["issue_date"] = parse_qr_date(data[k])
            break
    return out


# =========================================================================== comparing
def core_reg(value):
    s = re.sub(r"[^A-Z0-9]", "", str(value or "").upper())
    return re.sub(rf"^({PREFIXES})", "", s)


def norm_name(value):
    s = re.sub(r"[^A-Z0-9 ]", " ", str(value or "").upper())
    return re.sub(r"\s+", " ", s).strip()


def name_key(value):
    return strip_junk(norm_name(value))


def parse_qr_date(text):
    """Only unambiguous formats. Numeric day/month dates (12/05/2020) are NOT guessed."""
    t = str(text).strip()
    m = re.match(r"^([A-Za-z]{3,12})\.?\s+(\d{1,2})(?:st|nd|rd|th)?\W+(\d{4})", t)
    if m and month_from_word(m.group(1)):
        return _safe_date(m.group(3), month_from_word(m.group(1)), m.group(2))
    m = re.match(r"^(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,12})\W+(\d{4})", t)
    if m and month_from_word(m.group(2)):
        return _safe_date(m.group(3), month_from_word(m.group(2)), m.group(1))
    m = re.match(r"^(\d{4})-(\d{2})-(\d{2})", t)
    if m:
        return _safe_date(m.group(1), m.group(2), m.group(3))
    return None


def _safe_date(y, m, d):
    try:
        return date(int(y), int(m), int(d)).isoformat()
    except ValueError:
        return None


DATE_SLACK_DAYS = 3   # printed date and QR date may differ by up to this many days (either direction)


def check_date(cert, qr):
    row = check(cert, qr)
    if row["match"] or not cert or not qr:
        return row
    try:
        diff = abs((date.fromisoformat(str(qr)) - date.fromisoformat(str(cert))).days)
    except ValueError:
        return row
    if diff <= DATE_SLACK_DAYS:
        row["match"] = True
        row["note"] = f"dates differ by {diff} day(s); within the {DATE_SLACK_DAYS}-day allowance"
    else:
        row["note"] = f"mismatch ({diff} days apart; allowance is {DATE_SLACK_DAYS})"
    return row


def check(cert, qr, near_ok=False, key=lambda v: v):
    row = {"certificate": cert, "qr": qr, "match": False, "note": None}
    if qr is None:
        row["note"] = "QR has no usable value for this field"
    elif cert is None:
        row["note"] = "OCR did not read this field clearly"
    elif cert == qr or norm_name(cert) == norm_name(qr):
        row["match"] = True
    elif key(cert) == key(qr) and key(cert):
        row["match"] = True
        row["note"] = "matched after ignoring stray characters"
    else:
        row["note"] = "mismatch"
        if near_ok:
            ratio = SequenceMatcher(None, key(cert), key(qr)).ratio()
            if ratio >= 0.9:
                row["note"] = f"near match ({ratio:.2f}); possible OCR error"
    return row


# =========================================================================== input
def load_input(path):
    """Returns (bgr image, text layer or None, note). PDFs: first page rendered at 300 DPI."""
    if path.suffix.lower() == ".pdf":
        import pymupdf
        with pymupdf.open(path) as doc:
            if doc.needs_pass:
                sys.exit("PDF is password-protected.")
            page = doc[0]
            pix = page.get_pixmap(dpi=300, alpha=False)
            img = cv2.cvtColor(np.frombuffer(pix.samples, np.uint8).reshape(pix.h, pix.w, pix.n), cv2.COLOR_RGB2BGR)
            layer = page.get_text().strip()
            note = f"PDF with {len(doc)} page(s); page 1 used" + ("; has a text layer" if len(layer) > 40 else "; no text layer (image only)")
            return img, (layer if len(layer) > 40 else None), note
    img = cv2.imread(str(path))
    if img is None:
        sys.exit(f"Could not read image: {path}")
    return img, None, "image file"


# =========================================================================== main
def main():
    if len(sys.argv) < 2:
        sys.exit("Usage: python verify_cac.py <certificate.png|jpg|pdf> [document_id]")
    src = Path(sys.argv[1])
    doc_id = sys.argv[2] if len(sys.argv) > 2 else src.stem
    img, layer, input_note = load_input(src)
    OUT.mkdir(parents=True, exist_ok=True)

    print(f"Reading {src.name} ({input_note}). This takes 10 to 40 seconds...")
    qr = decode_qr(img)
    q = qr_fields(qr["qr_payload"]) if qr["qr_found"] else \
        {"registration_number": None, "company_name": None, "issue_date": None, "raw_date": None}
    res = extract_fields(img, extra_text=layer)

    reg = res["registration_number"]["value"]
    name = res["company_name"]["value"]
    dt = res["issue_date"]["value"]
    # Two readings that tie on votes are not a reading.
    for k, v in (("registration_number", reg), ("company_name", name), ("issue_date", dt)):
        if res[k]["ambiguous"]:
            if k == "registration_number": reg = None
            if k == "issue_date": dt = None
            if k == "company_name": name = None

    pass_1 = {
        "registration_number": check(reg, q["registration_number"]),
        "company_name": check(name, q["company_name"], near_ok=True, key=name_key),
    }
    for k in pass_1:
        r = res[k]
        if pass_1[k]["certificate"] is None:
            pass_1[k]["note"] = "OCR readings disagreed" if r["ambiguous"] else "OCR did not read this field"
        pass_1[k]["ocr_support"] = r["support"]

    notes = []
    if not qr["qr_found"]:
        w = qr.get("qr_width_px")
        size = f" (QR is about {w} px wide; 150+ is needed)" if w else ""
        result, reasons = "REVIEW", [f"QR code could not be decoded{size}; use the original PDF or a sharper scan"]
    else:
        failed = [f"{k}: {v['note']}" for k, v in pass_1.items() if not v["match"]]
        result = "PASS" if not failed else "REVIEW"
        reasons = failed or ["registration number and company name match"]
        if qr.get("qr_width_px") and qr["qr_width_px"] < 120:
            notes.append(f"QR is small ({qr['qr_width_px']} px); decoded but the scan is low quality")

    # does the PDF's hidden text agree with what is visible on the page?
    layer_conflicts = []
    if layer:
        t_reg = parse_registration(layer)
        t_name = parse_name_anchor(layer)
        if t_reg and reg and t_reg[0] != reg:
            layer_conflicts.append(f"PDF text layer says registration {t_reg[0]} but the visible page reads {reg}")
        if t_name and name and name_key(t_name) != name_key(name):
            layer_conflicts.append(f"PDF text layer says name '{t_name}' but the visible page reads '{name}'")
    if layer_conflicts:
        result = "REVIEW"
        reasons = [r for r in reasons if r != "registration number and company name match"] + layer_conflicts

    (OUT / f"{doc_id}_qr.json").write_text(json.dumps({"document_id": doc_id, **qr}, indent=2), encoding="utf-8")
    (OUT / f"{doc_id}_ocr.json").write_text(json.dumps({
        "document_id": doc_id, "registration_number": reg, "company_name": name, "issue_date": dt,
        "candidates": {k: res[k]["candidates"] for k in ("registration_number", "company_name", "issue_date")},
        "support": {k: [res[k]["support"], res[k]["runner_up_support"]] for k in ("registration_number", "company_name", "issue_date")},
        "sources": res["sources"], "diagnostics": {**res["diagnostics"], "input": input_note},
        "raw_text": res["raw_text"]}, indent=2), encoding="utf-8")
    (OUT / f"{doc_id}_pass1.json").write_text(json.dumps({
        "document_id": doc_id, "pass_1": pass_1, "pass_1_result": result, "reasons": reasons,
        "notes": notes, "criteria": ["registration_number", "company_name"],
        "info_only": {"issue_date_ocr": dt, "issue_date_qr": q["issue_date"]}}, indent=2), encoding="utf-8")
    cv2.imwrite(str(OUT / f"{doc_id}_deskewed.jpg"), res["deskewed_image"], [cv2.IMWRITE_JPEG_QUALITY, 80])

    d = res["diagnostics"]
    print(f"\nQR found : {qr['qr_found']} (via {qr['found_with']}, width {qr.get('qr_width_px')} px)")
    print(f"QR payload: {qr['qr_payload']}")
    print(f"Page straightened by {d['deskew_degrees']} degrees; read at {d['normalized_size'][0]}x{d['normalized_size'][1]} px\n")
    print(f"{'field':<22}{'certificate':<34}{'qr':<34}{'match'}")
    for k, v in pass_1.items():
        print(f"{k:<22}{str(v['certificate']):<34}{str(v['qr']):<34}{v['match']}"
              + (f"   <- {v['note']}" if v["note"] else ""))
    print(f"\nPass 1 result: {result}")
    for r in reasons + notes:
        print(f"  - {r}")
    missing = [k for k in pass_1 if pass_1[k]["certificate"] is None]
    if missing:
        print("\nNot read: " + ", ".join(missing))
        print(f"  Open {OUT / (doc_id + '_ocr.json')} to see every reading, and {doc_id}_deskewed.jpg to see what the OCR saw.")
    print(f"Files saved to {OUT}")


if __name__ == "__main__":
    main()
    