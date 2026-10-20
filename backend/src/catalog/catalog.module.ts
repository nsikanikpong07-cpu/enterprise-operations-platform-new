import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogController } from './controllers/catalog.controller.js';
import { ItemsController } from './controllers/items.controller.js';
import { ItemCategory } from './entities/item-category.entity.js';
import { Item } from './entities/item.entity.js';
import { UnitOfMeasure } from './entities/unit-of-measure.entity.js';
import { CatalogService } from './providers/catalog.service.js';
import { ItemsService } from './providers/items.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([ItemCategory, UnitOfMeasure, Item])],
  controllers: [CatalogController, ItemsController],
  providers: [CatalogService, ItemsService],
  exports: [TypeOrmModule, CatalogService, ItemsService],
})
export class CatalogModule {}
