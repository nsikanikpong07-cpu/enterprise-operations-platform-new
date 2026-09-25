import { Repository } from 'typeorm';
import { CreateItemDto, UpdateItemDto } from '../dto/catalog.dto.js';
import { Item } from '../entities/item.entity.js';
export declare class ItemsService {
    private readonly items;
    constructor(items: Repository<Item>);
    findAll(companyId: string): Promise<Item[]>;
    findOne(id: string): Promise<Item>;
    create(dto: CreateItemDto): Promise<Item>;
    update(id: string, dto: UpdateItemDto): Promise<Item>;
    remove(id: string): Promise<void>;
}
