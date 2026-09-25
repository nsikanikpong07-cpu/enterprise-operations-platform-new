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
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity.js';
let AuditService = class AuditService {
    auditLogs;
    constructor(auditLogs) {
        this.auditLogs = auditLogs;
    }
    findAll(query) {
        const where = {};
        if (query.companyId)
            where.company = { id: query.companyId };
        if (query.userId)
            where.user = { id: query.userId };
        if (query.entityType)
            where.entityType = query.entityType;
        if (query.entityId)
            where.entityId = query.entityId;
        if (query.action)
            where.action = query.action;
        return this.auditLogs.find({
            where,
            relations: { company: true, user: true },
            order: { createdAt: 'DESC' },
            take: 200,
        });
    }
    record(dto) {
        const { companyId, userId, ...rest } = dto;
        return this.auditLogs.save(this.auditLogs.create({
            ...rest,
            company: companyId ? { id: companyId } : undefined,
            user: userId ? { id: userId } : undefined,
        }));
    }
};
AuditService = __decorate([
    Injectable(),
    __param(0, InjectRepository(AuditLog)),
    __metadata("design:paramtypes", [Repository])
], AuditService);
export { AuditService };
//# sourceMappingURL=audit.service.js.map