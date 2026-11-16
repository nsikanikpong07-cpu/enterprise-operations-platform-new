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
import type { CompanyAuthenticatedRequest } from '../../auth/guards/company-access.guard.js';
import {
  CreateRequisitionDto,
  UpdateRequisitionDto,
} from '../dto/procurement.dto.js';
import { RequisitionsService } from '../providers/requisitions.service.js';

@Controller('procurement/requisitions')
export class RequisitionsController {
  constructor(private readonly requisitions: RequisitionsService) {}

  @Get()
  findAll(@Query('companyId', ParseUUIDPipe) companyId: string) {
    return this.requisitions.findAll(companyId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: CompanyAuthenticatedRequest) {
    const requisition = await this.requisitions.findOne(id);
    return { ...requisition, canManage: requisition.requester.id === req.companyMembership?.id };
  }

  @Get(':id/items')
  itemsFor(@Param('id', ParseUUIDPipe) id: string) {
    return this.requisitions.itemsFor(id);
  }

  @Post()
  @ApiBody({ type: CreateRequisitionDto })
  create(@Body() dto: CreateRequisitionDto) {
    return this.requisitions.create(dto);
  }

  @Post(':id/submit')
  submit(@Param('id', ParseUUIDPipe) id: string) {
    return this.requisitions.submit(id);
  }

  @Post(':id/cancel')
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.requisitions.cancel(id);
  }

  @Patch(':id')
  @ApiBody({ type: UpdateRequisitionDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRequisitionDto,
  ) {
    return this.requisitions.update(id, dto);
  }
}
