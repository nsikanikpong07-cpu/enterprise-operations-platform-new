import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuppliersController } from './controllers/suppliers.controller.js';
import { VerificationController } from './controllers/verification.controller.js';
import { SupplierCompanyProfile } from './entities/supplier-company-profile.entity.js';
import { SupplierContact } from './entities/supplier-contact.entity.js';
import { SupplierDocument } from './entities/supplier-document.entity.js';
import { SupplierRiskAssessment } from './entities/supplier-risk-assessment.entity.js';
import { Supplier } from './entities/supplier.entity.js';
import { VerificationCase } from './entities/verification-case.entity.js';
import { VerificationCheck } from './entities/verification-check.entity.js';
import { VerificationEvidence } from './entities/verification-evidence.entity.js';
import { VerificationReview } from './entities/verification-review.entity.js';
import { SuppliersService } from './providers/suppliers.service.js';
import { VerificationService } from './providers/verification.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Supplier,
      SupplierCompanyProfile,
      SupplierContact,
      SupplierDocument,
      VerificationCase,
      VerificationCheck,
      VerificationEvidence,
      VerificationReview,
      SupplierRiskAssessment,
    ]),
  ],
  controllers: [SuppliersController, VerificationController],
  providers: [SuppliersService, VerificationService],
  exports: [TypeOrmModule, SuppliersService, VerificationService],
})
export class VendorModule {}
