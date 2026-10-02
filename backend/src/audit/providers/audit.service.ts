import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import {
  AuditLogQueryDto,
  CreateAuditLogDto,
} from '../dto/audit.dto.js';
import { AuditLog } from '../entities/audit-log.entity.js';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogs: Repository<AuditLog>,
  ) {}

  findAll(query: AuditLogQueryDto): Promise<AuditLog[]> {
    const where: FindOptionsWhere<AuditLog> = {};
    if (query.companyId) where.company = { id: query.companyId };
    if (query.userId) where.user = { id: query.userId };
    if (query.entityType) where.entityType = query.entityType;
    if (query.entityId) where.entityId = query.entityId;
    if (query.action) where.action = query.action;
    return this.auditLogs.find({
      where,
      relations: { company: true, user: true },
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }

  record(dto: CreateAuditLogDto): Promise<AuditLog> {
    const { companyId, userId, ...rest } = dto;
    return this.auditLogs.save(
      this.auditLogs.create({
        ...rest,
        company: companyId ? { id: companyId } : undefined,
        user: userId ? { id: userId } : undefined,
      }),
    );
  }
}
