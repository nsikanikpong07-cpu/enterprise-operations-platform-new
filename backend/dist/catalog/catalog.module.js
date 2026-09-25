var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogController } from './controllers/catalog.controller.js';
import { ItemsController } from './controllers/items.controller.js';
import { ItemCategory } from './entities/item-category.entity.js';
import { Item } from './entities/item.entity.js';
import { UnitOfMeasure } from './entities/unit-of-measure.entity.js';
import { CatalogService } from './providers/catalog.service.js';
import { ItemsService } from './providers/items.service.js';
let CatalogModule = class CatalogModule {
};
CatalogModule = __decorate([
    Module({
        imports: [TypeOrmModule.forFeature([ItemCategory, UnitOfMeasure, Item])],
        controllers: [CatalogController, ItemsController],
        providers: [CatalogService, ItemsService],
        exports: [TypeOrmModule, CatalogService, ItemsService],
    })
], CatalogModule);
export { CatalogModule };
//# sourceMappingURL=catalog.module.js.map