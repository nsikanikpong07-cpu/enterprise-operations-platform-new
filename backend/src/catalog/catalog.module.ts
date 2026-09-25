import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemCategory } from './entities/item-category.entity.js';
import { Item } from './entities/item.entity.js';
import { UnitOfMeasure } from './entities/unit-of-measure.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([ItemCategory, UnitOfMeasure, Item])],
  exports: [TypeOrmModule],
})
export class CatalogModule {}
