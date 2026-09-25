var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, } from '@nestjs/common';
import { CreateRiskAssessmentDto, OpenVerificationCaseDto, UpdateVerificationCaseDto, } from '../dto/vendor.dto.js';
import { VerificationService } from '../providers/verification.service.js';
let VerificationController = class VerificationController {
    verification;
    constructor(verification) {
        this.verification = verification;
    }
    openCase(dto) {
        return this.verification.openCase(dto);
    }
    casesForProfile(profileId) {
        return this.verification.casesForProfile(profileId);
    }
    findCase(id) {
        return this.verification.findCase(id);
    }
    updateCase(id, dto) {
        return this.verification.updateCase(id, dto);
    }
    assess(dto) {
        return this.verification.assess(dto);
    }
    assessmentsForCase(id) {
        return this.verification.assessmentsForCase(id);
    }
};
__decorate([
    Post('cases'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [OpenVerificationCaseDto]),
    __metadata("design:returntype", void 0)
], VerificationController.prototype, "openCase", null);
__decorate([
    Get('cases'),
    __param(0, Query('profileId', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VerificationController.prototype, "casesForProfile", null);
__decorate([
    Get('cases/:id'),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VerificationController.prototype, "findCase", null);
__decorate([
    Patch('cases/:id'),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateVerificationCaseDto]),
    __metadata("design:returntype", void 0)
], VerificationController.prototype, "updateCase", null);
__decorate([
    Post('risk-assessments'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateRiskAssessmentDto]),
    __metadata("design:returntype", void 0)
], VerificationController.prototype, "assess", null);
__decorate([
    Get('cases/:id/risk-assessments'),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VerificationController.prototype, "assessmentsForCase", null);
VerificationController = __decorate([
    Controller('vendor/verification'),
    __metadata("design:paramtypes", [VerificationService])
], VerificationController);
export { VerificationController };
//# sourceMappingURL=verification.controller.js.map