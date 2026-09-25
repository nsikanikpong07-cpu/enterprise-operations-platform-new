import { CreateItemCategoryDto, CreateUnitOfMeasureDto, UpdateItemCategoryDto } from '../dto/catalog.dto.js';
import { CatalogService } from '../providers/catalog.service.js';
export declare class CatalogController {
    private readonly catalog;
    constructor(catalog: CatalogService);
    findCategories(companyId: string): Promise<import("../entities/item-category.entity.js").ItemCategory[]>;
    findCategory(id: string): Promise<import("../entities/item-category.entity.js").ItemCategory>;
    createCategory(dto: CreateItemCategoryDto): Promise<import("../entities/item-category.entity.js").ItemCategory>;
    updateCategory(id: string, dto: UpdateItemCategoryDto): Promise<import("../entities/item-category.entity.js").ItemCategory>;
    removeCategory(id: string): Promise<void>;
    findUnits(): Promise<import("../entities/unit-of-measure.entity.js").UnitOfMeasure[]>;
    createUnit(dto: CreateUnitOfMeasureDto): Promise<import("../entities/unit-of-measure.entity.js").UnitOfMeasure>;
}
