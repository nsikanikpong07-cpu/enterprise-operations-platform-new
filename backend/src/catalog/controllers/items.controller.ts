import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateItemDto, UpdateItemDto } from '../dto/catalog.dto.js';
import { ItemsService } from '../providers/items.service.js';

@Controller('catalog/items')
export class ItemsController {
  constructor(private readonly items: ItemsService) {}

  @Get()
  findAll(@Query('companyId', ParseUUIDPipe) companyId: string) {
    return this.items.findAll(companyId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.items.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateItemDto) {
    return this.items.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateItemDto) {
    return this.items.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.items.remove(id);
  }
}
