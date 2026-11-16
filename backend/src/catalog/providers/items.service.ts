import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateItemDto, UpdateItemDto } from '../dto/catalog.dto.js';
import { Item } from '../entities/item.entity.js';

@Injectable()
export class ItemsService {
  private async saveSafely<T>(operation: Promise<T>): Promise<T> {
    try { return await operation; } catch (error: unknown) {
      const e = error as { code?: string; constraint?: string; driverError?: { code?: string; constraint?: string } };
      const dbError = e.driverError ?? e;
      if (dbError.code === "23505" && dbError.constraint === "uq_items_company_sku") {
        throw new ConflictException("An item with this SKU already exists in your company.");
      }
      throw error;
    }
  }

  constructor(
    @InjectRepository(Item) private readonly items: Repository<Item>,
  ) {}

  findAll(companyId: string): Promise<Item[]> {
    return this.items.find({
      where: { company: { id: companyId } },
      relations: { category: true, unitOfMeasure: true },
    });
  }

  async findOne(id: string): Promise<Item> {
    const item = await this.items.findOne({
      where: { id },
      relations: { category: true, unitOfMeasure: true },
    });
    if (!item) throw new NotFoundException(`Item ${id} not found`);
    return item;
  }

  create(dto: CreateItemDto): Promise<Item> {
    const { companyId, categoryId, unitOfMeasureId, ...rest } = dto;
    return this.saveSafely(this.items.save(
      this.items.create({
        ...rest,
        company: { id: companyId },
        category: categoryId ? { id: categoryId } : undefined,
        unitOfMeasure: { id: unitOfMeasureId },
      }),
    ));
  }

  async update(id: string, dto: UpdateItemDto): Promise<Item> {
    const item = await this.findOne(id);
    const { categoryId, ...rest } = dto;
    Object.assign(item, rest);
    if (categoryId !== undefined)
      item.category = { id: categoryId } as Item['category'];
    return this.saveSafely(this.items.save(item));
  }

}
