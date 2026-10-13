import { BadRequestException } from "@nestjs/common";
import { DataSource } from "typeorm";
import { AuditWriterService } from "./audit-writer.service.js";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOptionsWhere, Repository } from "typeorm";
import { AuditLogQueryDto, CreateAuditLogDto } from "../dto/audit.dto.js";
import { AuditLog } from "../entities/audit-log.entity.js";

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogs: Repository<AuditLog>,
    private readonly dataSource: DataSource,
    private readonly writer: AuditWriterService,
  ) {}

  findAll(query: AuditLogQueryDto): Promise<AuditLog[]> {
    if (!query.companyId)
      throw new BadRequestException("companyId is required");
    const where: FindOptionsWhere<AuditLog> = {};
    if (query.companyId) where.company = { id: query.companyId };
    if (query.userId) where.user = { id: query.userId };
    if (query.entityType) where.entityType = query.entityType;
    if (query.entityId) where.entityId = query.entityId;
    if (query.action) where.action = query.action;
    return this.auditLogs.find({
      where,
      relations: { company: true, user: true },
      order: { createdAt: "DESC" },
      take: 200,
    });
  }

  async record(dto: CreateAuditLogDto): Promise<void> {
    await this.writer.write(this.dataSource, {
      action: dto.action,
      entityType: dto.entityType,
      entityId: dto.entityId,
      companyId: dto.companyId,
      actorId: dto.userId,
      oldValues: dto.oldValues,
      newValues: dto.newValues,
    });
  }
}
