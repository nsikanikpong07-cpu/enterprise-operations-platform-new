import { ApiBearerAuth } from "@nestjs/swagger";
import { IamScope } from "../../auth/decorators/iam-scope.decorator.js";
import { Controller, Get, Query } from "@nestjs/common";
import { AuditLogQueryDto } from "../dto/audit.dto.js";
import { AuditService } from "../providers/audit.service.js";

@IamScope({ kind: "company", location: "query", key: "companyId" })
@ApiBearerAuth()
@Controller("audit/logs")
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  findAll(@Query() query: AuditLogQueryDto) {
    return this.audit.findAll(query);
  }
}
