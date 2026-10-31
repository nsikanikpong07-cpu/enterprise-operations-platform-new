import { ApiBody } from "@nestjs/swagger";
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
import {
  CreateItemCategoryDto,
  CreateUnitOfMeasureDto,
  UpdateItemCategoryDto,
} from '../dto/catalog.dto.js';
import { CatalogService } from '../providers/catalog.service.js';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('categories')
  findCategories(@Query('companyId', ParseUUIDPipe) companyId: string) {
    return this.catalog.findCategories(companyId);
  }

  @Get('categories/:id')
  findCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.findCategory(id);
  }

  @Post('categories')
  @ApiBody({ type: CreateItemCategoryDto })
  createCategory(@Body() dto: CreateItemCategoryDto) {
    return this.catalog.createCategory(dto);
  }

  @Patch('categories/:id')
  @ApiBody({ type: UpdateItemCategoryDto })
  updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateItemCategoryDto,
  ) {
    return this.catalog.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  removeCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.removeCategory(id);
  }

  @Get('units')
  findUnits() {
    return this.catalog.findUnits();
  }

  @Post('units')
  @ApiBody({ type: CreateUnitOfMeasureDto })
  createUnit(@Body() dto: CreateUnitOfMeasureDto) {
    return this.catalog.createUnit(dto);
  }
}
