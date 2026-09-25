import { BaseEntity } from '../../common/entities/base.entity.js';
import { Supplier } from './supplier.entity.js';
export declare class SupplierContact extends BaseEntity {
    supplier: Supplier;
    name: string;
    email?: string;
    phone?: string;
    position?: string;
    isPrimary: boolean;
}
