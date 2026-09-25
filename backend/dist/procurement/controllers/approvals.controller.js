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
import { CreateApprovalDto, DecideApprovalDto, } from '../dto/procurement.dto.js';
import { ApprovalsService } from '../providers/approvals.service.js';
let ApprovalsController = class ApprovalsController {
    approvals;
    constructor(approvals) {
        this.approvals = approvals;
    }
    create(dto) {
        return this.approvals.create(dto);
    }
    forRequisition(requisitionId) {
        return this.approvals.forRequisition(requisitionId);
    }
    pendingFor(approverId) {
        return this.approvals.pendingFor(approverId);
    }
    decide(id, dto) {
        return this.approvals.decide(id, dto);
    }
};
__decorate([
    Post(),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateApprovalDto]),
    __metadata("design:returntype", void 0)
], ApprovalsController.prototype, "create", null);
__decorate([
    Get(),
    __param(0, Query('requisitionId', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ApprovalsController.prototype, "forRequisition", null);
__decorate([
    Get('pending'),
    __param(0, Query('approverId', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ApprovalsController.prototype, "pendingFor", null);
__decorate([
    Patch(':id/decision'),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, DecideApprovalDto]),
    __metadata("design:returntype", void 0)
], ApprovalsController.prototype, "decide", null);
ApprovalsController = __decorate([
    Controller('procurement/approvals'),
    __metadata("design:paramtypes", [ApprovalsService])
], ApprovalsController);
export { ApprovalsController };
//# sourceMappingURL=approvals.controller.js.map