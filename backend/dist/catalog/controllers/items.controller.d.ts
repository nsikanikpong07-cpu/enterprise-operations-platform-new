import { CreateItemDto, UpdateItemDto } from '../dto/catalog.dto.js';
import { ItemsService } from '../providers/items.service.js';
export declare class ItemsController {
    private readonly items;
    constructor(items: ItemsService);
    findAll(companyId: string): Promise<import("../entities/item.entity.js").Item[]>;
    findOne(id: string): Promise<import("../entities/item.entity.js").Item>;
    create(dto: CreateItemDto): Promise<import("../entities/item.entity.js").Item>;
    update(id: string, dto: UpdateItemDto): Promise<import("../entities/item.entity.js").Item>;
    remove(id: string): Promise<void>;
}
