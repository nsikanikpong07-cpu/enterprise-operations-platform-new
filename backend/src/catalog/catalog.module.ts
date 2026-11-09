import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module.js';
import { User } from '../iam/entities/user.entity.js';

import { CatalogController } from './controllers/catalog.controller.js';
import { ItemsController } from './controllers/items.controller.js';

import { ItemCategory } from './entities/item-category.entity.js';
import { Item } from './entities/item.entity.js';
import { UnitOfMeasure } from './entities/unit-of-measure.entity.js';

import { CatalogService } from './providers/catalog.service.js';
import { ItemsService } from './providers/items.service.js';

@Module({
  imports: [
    AuthModule,

    TypeOrmModule.forFeature([
      ItemCategory,
      Item,
      UnitOfMeasure,

      // JwtAuthGuard needs this repository to check the signed-in user.
      User,
    ]),
  ],

  controllers: [
    CatalogController,
    ItemsController,
  ],

  providers: [
    CatalogService,
    ItemsService,
  ],

  exports: [
    TypeOrmModule,
    CatalogService,
    ItemsService,
  ],
})
export class CatalogModule {}