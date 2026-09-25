var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
let VendorModule = class VendorModule {
};
VendorModule = __decorate([
    Module({
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
], VendorModule);
export { VendorModule };
//# sourceMappingURL=vendor.module.js.map