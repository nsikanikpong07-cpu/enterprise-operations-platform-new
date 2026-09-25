import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
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
  create(@Body() dto: CreateApprovalDto) {
    return this.approvals.create(dto);
  }

  @Get()
  forRequisition(@Query('requisitionId', ParseUUIDPipe) requisitionId: string) {
    return this.approvals.forRequisition(requisitionId);
  }

  @Get('pending')
  pendingFor(@Query('approverId', ParseUUIDPipe) approverId: string) {
    return this.approvals.pendingFor(approverId);
  }

  @Patch(':id/decision')
  decide(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DecideApprovalDto,
  ) {
    return this.approvals.decide(id, dto);
  }
}
