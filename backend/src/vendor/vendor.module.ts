import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuppliersController } from './controllers/suppliers.controller.js';
import { VerificationController } from './controllers/verification.controller.js';
import { SupplierWorkspaceController } from './controllers/supplier-workspace.controller.js';
import { SupplierDocumentUploadController } from './controllers/supplier-document-upload.controller.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { SupplierCompanyProfile } from './entities/supplier-company-profile.entity.js';
import { SupplierContact } from './entities/supplier-contact.entity.js';
import { SupplierDocument } from './entities/supplier-document.entity.js';
import { SupplierRiskAssessment } from './entities/supplier-risk-assessment.entity.js';
import { SupplierListing } from './entities/supplier-listing.entity.js';
import { SupplierListingPhoto } from './entities/supplier-listing-photo.entity.js';
import { Supplier } from './entities/supplier.entity.js';
import { VerificationCase } from './entities/verification-case.entity.js';
import { VerificationCheck } from './entities/verification-check.entity.js';
import { VerificationEvidence } from './entities/verification-evidence.entity.js';
import { VerificationReview } from './entities/verification-review.entity.js';
import { SuppliersService } from './providers/suppliers.service.js';
import { VerificationService } from './providers/verification.service.js';
import { CertificateOcrService } from './providers/certificate-ocr.service.js';
import { VendorHubService } from './providers/vendor-hub.service.js';
import { VendorHubController } from './controllers/vendor-hub.controller.js';
import { User } from '../iam/entities/user.entity.js';

@Module({
  imports: [
    AuthModule,
    AuditModule,
    TypeOrmModule.forFeature([
      User,
      Supplier,
      SupplierCompanyProfile,
      SupplierContact,
      SupplierDocument,
      VerificationCase,
      VerificationCheck,
      VerificationEvidence,
      VerificationReview,
      SupplierRiskAssessment,
      SupplierListing,
      SupplierListingPhoto,
    ]),
  ],
  controllers: [
    SuppliersController,
    VerificationController,
    SupplierWorkspaceController,
    SupplierDocumentUploadController,
    VendorHubController,
  ],
  providers: [
    SuppliersService,
    VerificationService,
    CertificateOcrService,
    VendorHubService,
  ],
  exports: [
    TypeOrmModule,
    SuppliersService,
    VerificationService,
    VendorHubService,
  ],
})
export class VendorModule {}
