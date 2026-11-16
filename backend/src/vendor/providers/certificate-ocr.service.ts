import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { execFile } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { DataSource } from 'typeorm';
import { AuditWriterService } from '../../audit/providers/audit-writer.service.js';
import { VerificationCase } from '../entities/verification-case.entity.js';
import { VerificationCheck } from '../entities/verification-check.entity.js';
import { VerificationEvidence } from '../entities/verification-evidence.entity.js';

const execFileAsync = promisify(execFile);
const MAX_CERTIFICATE_BYTES = 15 * 1024 * 1024;

export interface UploadedCertificate {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

type PassField = {
  certificate: string | null;
  qr: string | null;
  match: boolean;
  note?: string | null;
  ocr_support?: number;
};

type OcrPass = {
  pass_1_result: 'PASS' | 'FAIL' | 'REVIEW';
  reasons: string[];
  notes: string[];
  pass_1: Record<string, PassField>;
};

@Injectable()
export class CertificateOcrService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly audit: AuditWriterService,
  ) {}

  async documentsForCase(caseId: string) {
    const rows = await this.dataSource.query(
      `SELECT d.id, d.document_type, d.document_number, d.status, d.created_at,
              (SELECT e.description FROM vendor.verification_evidence e
               JOIN vendor.verification_checks vc ON vc.id = e.verification_check_id
               WHERE vc.verification_case_id = c.id
                 AND e.supplier_document_id = d.id
                 AND e.evidence_type = 'ocr_comparison_result'
               ORDER BY e.created_at DESC LIMIT 1) AS ocr_result
       FROM vendor.verification_cases c
       JOIN vendor.supplier_documents d ON d.supplier_id = COALESCE(c.supplier_id, (
         SELECT p.supplier_id FROM vendor.supplier_company_profiles p WHERE p.id = c.supplier_company_profile_id
       ))
       WHERE c.id = $1
       ORDER BY d.created_at DESC`,
      [caseId],
    );
    return rows.map((row: Record<string, unknown>) => {
      let ocrResult: unknown = null;
      if (typeof row.ocr_result === 'string') {
        try { ocrResult = JSON.parse(row.ocr_result); } catch { /* Ignore malformed historic metadata. */ }
      }
      return {
        id: row.id,
        documentType: row.document_type,
        documentNumber: row.document_number,
        status: row.status,
        createdAt: row.created_at,
        ocrResult,
      };
    });
  }

  async compareCaseDocument(caseId: string, documentId: string, reviewerId: string) {
    const document = await this.storedCaseDocument(caseId, documentId);
    if (!document) throw new BadRequestException('The certificate is not attached to this supplier verification case.');
    if (!/\bcac\b/i.test(document.document_type)) {
      throw new BadRequestException('This OCR comparison currently supports CAC registration certificates.');
    }
    const buffer = await this.readStoredCertificate(document);
    const result = await this.compareWithQr({ buffer, originalname: document.file_url, mimetype: 'application/octet-stream', size: buffer.length });

    await this.dataSource.transaction(async (manager) => {
      const checks = manager.getRepository(VerificationCheck);
      let check = await checks.findOne({
        where: { verificationCase: { id: caseId }, checkType: 'cac_ocr_qr_comparison' },
      });
      if (!check) {
        check = checks.create({
          verificationCase: { id: caseId } as VerificationCase,
          checkType: 'cac_ocr_qr_comparison',
          name: 'CAC certificate and QR comparison',
          status: 'pending',
          isRequired: true,
          notes: 'OCR comparison is supporting information only. Human review is required.',
        });
        check = await checks.save(check);
      }
      const evidence = manager.getRepository(VerificationEvidence).create({
        check,
        supplierDocument: { id: documentId },
        evidenceType: 'ocr_comparison_result',
        description: JSON.stringify({
          documentId,
          comparison: result.comparison,
          fields: result.fields,
          reasons: result.reasons,
          notes: result.notes,
          reviewerDecisionRequired: true,
          verificationStatusChanged: false,
        }),
        uploadedBy: { id: reviewerId },
      });
      await manager.getRepository(VerificationEvidence).save(evidence);
      await this.audit.write(manager, {
        action: 'supplier.certificate.ocr_compared',
        entityType: 'verification_case',
        entityId: caseId,
        actorId: reviewerId,
        newValues: { changedFields: ['ocr_comparison_recorded'] },
      });
    });
    return result;
  }

  async documentFileForCase(caseId: string, documentId: string) {
    const document = await this.storedCaseDocument(caseId, documentId);
    if (!document) throw new BadRequestException('The certificate is not attached to this supplier verification case.');
    const buffer = await this.readStoredCertificate(document);
    const extension = basename(document.file_url).match(/\.(pdf|png|jpe?g)$/i)?.[0]?.toLowerCase();
    const contentType = extension === '.pdf' ? 'application/pdf' : extension === '.png' ? 'image/png' : 'image/jpeg';
    return { buffer, contentType, fileName: basename(document.file_url) };
  }

  private async storedCaseDocument(caseId: string, documentId: string) {
    const rows = await this.dataSource.query(
      `SELECT d.id, d.document_type, d.file_url, d.file_hash
       FROM vendor.verification_cases c
       JOIN vendor.supplier_documents d ON d.supplier_id = COALESCE(c.supplier_id, (
         SELECT p.supplier_id FROM vendor.supplier_company_profiles p WHERE p.id = c.supplier_company_profile_id
       ))
       WHERE c.id = $1 AND d.id = $2`,
      [caseId, documentId],
    );
    return rows[0] as { id: string; document_type: string; file_url: string; file_hash: string | null } | undefined;
  }

  private async readStoredCertificate(document: { file_url: string; file_hash: string | null }) {
    const root = resolve(process.env.SUPPLIER_DOCUMENT_STORAGE_DIR ?? join(process.cwd(), 'private', 'supplier-documents'));
    const filePath = resolve(root, ...document.file_url.split(/[\\/]+/));
    if (!filePath.startsWith(`${root}${process.platform === 'win32' ? '\\' : '/'}`)) {
      throw new BadRequestException('The certificate is not stored in the private document directory.');
    }
    let buffer: Buffer;
    try { buffer = await readFile(filePath); }
    catch { throw new ServiceUnavailableException('The stored certificate file is unavailable.'); }
    const fingerprint = createHash('sha256').update(buffer).digest('hex');
    if (!document.file_hash || fingerprint !== document.file_hash) {
      throw new ServiceUnavailableException('The stored certificate fingerprint does not match its upload record.');
    }
    return buffer;
  }

  async compareWithQr(file: UploadedCertificate) {
    const extension = this.validate(file);
    const temp = await mkdtemp(join(tmpdir(), 'impressor-cac-ocr-'));
    const inputPath = join(temp, `${randomUUID()}${extension}`);
    const outputPath = join(temp, 'output');
    const python = process.env.OCR_PYTHON_EXECUTABLE ?? (process.platform === 'win32' ? 'python' : 'python3');

    try {
      const scriptPath = await this.scriptPath();
      await writeFile(inputPath, file.buffer, { flag: 'wx', mode: 0o600 });
      await execFileAsync(python, [scriptPath, inputPath, 'certificate'], {
        timeout: 120_000,
        maxBuffer: 1024 * 1024,
        windowsHide: true,
        env: { ...process.env, OCR_OUTPUT_DIR: outputPath },
      });

      const raw = await readFile(join(outputPath, 'certificate_pass1.json'), 'utf8');
      const result = JSON.parse(raw) as OcrPass;
      if (!result.pass_1 || !['PASS', 'FAIL', 'REVIEW'].includes(result.pass_1_result)) {
        throw new Error('OCR returned an unrecognised result.');
      }

      return {
        comparison: result.pass_1_result === 'PASS'
          ? 'fields_match_qr'
          : result.pass_1_result === 'FAIL' ? 'fields_mismatch_qr' : 'manual_review_needed',
        decision: result.pass_1_result === 'PASS'
          ? 'approved' as const
          : result.pass_1_result === 'FAIL' ? 'rejected' as const : 'manual_review' as const,
        fields: result.pass_1,
        reasons: result.reasons,
        notes: result.notes,
        reviewerDecisionRequired: result.pass_1_result === 'REVIEW',
        verificationStatusChanged: result.pass_1_result !== 'REVIEW',
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ServiceUnavailableException) throw error;
      const message = error instanceof Error ? error.message : 'OCR processing failed.';
      if (message.includes('ENOENT') || message.includes('not found')) {
        throw new ServiceUnavailableException('OCR is unavailable. Confirm Python, Tesseract, and the OCR packages are installed.');
      }
      if (message.includes('password-protected') || message.includes('Could not read image')) {
        throw new BadRequestException('The certificate file could not be read. Upload an unprotected PDF or a clear JPG/PNG.');
      }
      throw new ServiceUnavailableException('The OCR check could not be completed. The reviewer can continue with manual review.');
    } finally {
      await rm(temp, { recursive: true, force: true });
    }
  }

  private validate(file: UploadedCertificate): string {
    if (!file?.buffer?.length || file.size > MAX_CERTIFICATE_BYTES) {
      throw new BadRequestException('Choose a certificate file up to 15 MB.');
    }
    const extension = basename(file.originalname).match(/\.(pdf|png|jpe?g)$/i)?.[0]?.toLowerCase() ?? '';
    if (!extension) throw new BadRequestException('Upload a PDF, JPG, or PNG certificate.');
    const bytes = file.buffer;
    const valid = extension === '.pdf'
      ? bytes.subarray(0, 5).toString('ascii') === '%PDF-'
      : extension === '.png'
        ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        : bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    if (!valid) throw new BadRequestException('The file contents do not match the selected PDF, JPG, or PNG type.');
    return extension;
  }

  private async scriptPath(): Promise<string> {
    const configured = process.env.CAC_OCR_SCRIPT_PATH;
    const candidates = configured
      ? [resolve(configured)]
      : [resolve(process.cwd(), 'ocr', 'verify_cac.py'), resolve(process.cwd(), 'src', 'vendor', 'ocr', 'verify_cac.py')];
    for (const candidate of candidates) {
      try {
        await readFile(candidate, { encoding: 'utf8', flag: 'r' });
        return candidate;
      } catch {
        // Try the next development/production location.
      }
    }
    throw new ServiceUnavailableException('CAC OCR script is not installed.');
  }
}
