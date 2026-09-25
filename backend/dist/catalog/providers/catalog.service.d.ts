import { Repository } from 'typeorm';
import { CreateItemCategoryDto, CreateUnitOfMeasureDto, UpdateItemCategoryDto } from '../dto/catalog.dto.js';
import { ItemCategory } from '../entities/item-category.entity.js';
import { UnitOfMeasure } from '../entities/unit-of-measure.entity.js';
export declare class CatalogService {
    private readonly categories;
    private readonly units;
    constructor(categories: Repository<ItemCategory>, units: Repository<UnitOfMeasure>);
    findCategories(companyId: string): Promise<ItemCategory[]>;
    findCategory(id: string): Promise<ItemCategory>;
    createCategory(dto: CreateItemCategoryDto): Promise<ItemCategory>;
    updateCategory(id: string, dto: UpdateItemCategoryDto): Promise<ItemCategory>;
    removeCategory(id: string): Promise<void>;
    findUnits(): Promise<UnitOfMeasure[]>;
    createUnit(dto: CreateUnitOfMeasureDto): Promise<UnitOfMeasure>;
}
