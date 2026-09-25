import { BaseEntity } from '../../common/entities/base.entity.js';
import { Company } from '../../organization/entities/company.entity.js';
export declare class ItemCategory extends BaseEntity {
    company: Company;
    parent?: ItemCategory;
    children: ItemCategory[];
    name: string;
    description?: string;
}
