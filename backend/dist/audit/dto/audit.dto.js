var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsOptional, IsString, IsUUID, MaxLength, } from 'class-validator';
export class AuditLogQueryDto {
    companyId;
    userId;
    entityType;
    entityId;
    action;
}
__decorate([
    IsOptional(),
    IsUUID(),
    __metadata("design:type", String)
], AuditLogQueryDto.prototype, "companyId", void 0);
__decorate([
    IsOptional(),
    IsUUID(),
    __metadata("design:type", String)
], AuditLogQueryDto.prototype, "userId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], AuditLogQueryDto.prototype, "entityType", void 0);
__decorate([
    IsOptional(),
    IsUUID(),
    __metadata("design:type", String)
], AuditLogQueryDto.prototype, "entityId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], AuditLogQueryDto.prototype, "action", void 0);
export class CreateAuditLogDto {
    companyId;
    userId;
    action;
    entityType;
    entityId;
    oldValues;
    newValues;
    ipAddress;
    userAgent;
}
__decorate([
    IsOptional(),
    IsUUID(),
    __metadata("design:type", String)
], CreateAuditLogDto.prototype, "companyId", void 0);
__decorate([
    IsOptional(),
    IsUUID(),
    __metadata("design:type", String)
], CreateAuditLogDto.prototype, "userId", void 0);
__decorate([
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateAuditLogDto.prototype, "action", void 0);
__decorate([
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateAuditLogDto.prototype, "entityType", void 0);
__decorate([
    IsOptional(),
    IsUUID(),
    __metadata("design:type", String)
], CreateAuditLogDto.prototype, "entityId", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Object)
], CreateAuditLogDto.prototype, "oldValues", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Object)
], CreateAuditLogDto.prototype, "newValues", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateAuditLogDto.prototype, "ipAddress", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateAuditLogDto.prototype, "userAgent", void 0);
//# sourceMappingURL=audit.dto.js.map