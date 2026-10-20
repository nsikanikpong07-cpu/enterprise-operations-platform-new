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
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.requisitions.findOne(id);
  }

  @Get(':id/items')
  itemsFor(@Param('id', ParseUUIDPipe) id: string) {
    return this.requisitions.itemsFor(id);
  }

  @Post()
  create(@Body() dto: CreateRequisitionDto) {
    return this.requisitions.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRequisitionDto,
  ) {
    return this.requisitions.update(id, dto);
  }
}
