export declare class CreateItemDto {
    companyId: string;
    categoryId?: string;
    unitOfMeasureId: string;
    sku?: string;
    name: string;
    description?: string;
    itemType?: string;
    isStockable?: boolean;
}
export declare class UpdateItemDto {
    categoryId?: string;
    name?: string;
    description?: string;
    itemType?: string;
    isStockable?: boolean;
    isActive?: boolean;
}
export declare class CreateItemCategoryDto {
    companyId: string;
    parentId?: string;
    name: string;
    description?: string;
}
export declare class UpdateItemCategoryDto {
    parentId?: string;
    name?: string;
    description?: string;
}
export declare class CreateUnitOfMeasureDto {
    code: string;
    name: string;
}
