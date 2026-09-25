import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateItemCategoryDto,
  CreateUnitOfMeasureDto,
  UpdateItemCategoryDto,
} from '../dto/catalog.dto.js';
import { ItemCategory } from '../entities/item-category.entity.js';
import { UnitOfMeasure } from '../entities/unit-of-measure.entity.js';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(ItemCategory)
    private readonly categories: Repository<ItemCategory>,
    @InjectRepository(UnitOfMeasure)
    private readonly units: Repository<UnitOfMeasure>,
  ) {}

  // Item categories
  findCategories(companyId: string): Promise<ItemCategory[]> {
    return this.categories.find({
      where: { company: { id: companyId } },
      relations: { parent: true },
    });
  }

  async findCategory(id: string): Promise<ItemCategory> {
    const category = await this.categories.findOne({
      where: { id },
      relations: { parent: true, children: true },
    });
    if (!category)
      throw new NotFoundException(`ItemCategory ${id} not found`);
    return category;
  }

  createCategory(dto: CreateItemCategoryDto): Promise<ItemCategory> {
    const { companyId, parentId, ...rest } = dto;
    return this.categories.save(
      this.categories.create({
        ...rest,
        company: { id: companyId },
        parent: parentId ? { id: parentId } : undefined,
      }),
    );
  }

  async updateCategory(
    id: string,
    dto: UpdateItemCategoryDto,
  ): Promise<ItemCategory> {
    const category = await this.findCategory(id);
    const { parentId, ...rest } = dto;
    Object.assign(category, rest);
    if (parentId !== undefined)
      category.parent = { id: parentId } as ItemCategory['parent'];
    return this.categories.save(category);
  }

  async removeCategory(id: string): Promise<void> {
    const category = await this.findCategory(id);
    await this.categories.remove(category);
  }

  // Units of measure
  findUnits(): Promise<UnitOfMeasure[]> {
    return this.units.find();
  }

  createUnit(dto: CreateUnitOfMeasureDto): Promise<UnitOfMeasure> {
    return this.units.save(this.units.create(dto));
  }
}
