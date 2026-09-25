import { Controller, Get, Query } from '@nestjs/common';
import { AuditLogQueryDto } from '../dto/audit.dto.js';
import { AuditService } from '../providers/audit.service.js';

@Controller('audit/logs')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  findAll(@Query() query: AuditLogQueryDto) {
    return this.audit.findAll(query);
  }
}
