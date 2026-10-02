import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateItemDto, UpdateItemDto } from '../dto/catalog.dto.js';
import { Item } from '../entities/item.entity.js';

@Injectable()
export class ItemsService {
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
    return this.items.save(
      this.items.create({
        ...rest,
        company: { id: companyId },
        category: categoryId ? { id: categoryId } : undefined,
        unitOfMeasure: { id: unitOfMeasureId },
      }),
    );
  }

  async update(id: string, dto: UpdateItemDto): Promise<Item> {
    const item = await this.findOne(id);
    const { categoryId, ...rest } = dto;
    Object.assign(item, rest);
    if (categoryId !== undefined)
      item.category = { id: categoryId } as Item['category'];
    return this.items.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    await this.items.remove(item);
  }
}
