import type { CompanyAuthenticatedRequest } from '../../auth/guards/company-access.guard.js';
import { ApiBody } from "@nestjs/swagger";
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  CreateApprovalDto,
  DecideApprovalDto,
} from '../dto/procurement.dto.js';
import { ApprovalsService } from '../providers/approvals.service.js';

@Controller('procurement/approvals')
export class ApprovalsController {
  constructor(private readonly approvals: ApprovalsService) {}

  @Post()
  @ApiBody({ type: CreateApprovalDto })
  create(@Body() dto: CreateApprovalDto) {
    return this.approvals.create(dto);
  }

  @Get()
  forRequisition(@Query('requisitionId', ParseUUIDPipe) requisitionId: string) {
    return this.approvals.forRequisition(requisitionId);
  }

  @Get('pending/me')
  pendingForSelf(@Req() request: CompanyAuthenticatedRequest) {
    return this.approvals.pendingForCompany(request.companyMembership!.company.id, request.companyMembership!.id);
  }

  @Post('requisitions/:id/decision')
  decideRequisition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DecideApprovalDto,
    @Req() request: CompanyAuthenticatedRequest,
  ) {
    return this.approvals.decideRequisition(id, request.companyMembership!.id, dto);
  }

  @Get('pending')
  pendingFor(@Query('approverId', ParseUUIDPipe) approverId: string) {
    return this.approvals.pendingFor(approverId);
  }

  @Patch(':id/decision')
  @ApiBody({ type: DecideApprovalDto })
  decide(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DecideApprovalDto,
  ) {
    return this.approvals.decide(id, dto);
  }
}
