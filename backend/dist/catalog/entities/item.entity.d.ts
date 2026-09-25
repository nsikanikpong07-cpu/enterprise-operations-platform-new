import { BaseEntity } from '../../common/entities/base.entity.js';
import { Company } from '../../organization/entities/company.entity.js';
import { ItemCategory } from './item-category.entity.js';
import { UnitOfMeasure } from './unit-of-measure.entity.js';
export declare class Item extends BaseEntity {
    company: Company;
    category?: ItemCategory;
    unitOfMeasure: UnitOfMeasure;
    sku?: string;
    name: string;
    description?: string;
    itemType: string;
    isStockable: boolean;
    isActive: boolean;
}
