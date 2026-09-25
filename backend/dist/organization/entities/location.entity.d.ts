import { BaseEntity } from '../../common/entities/base.entity.js';
import { Company } from './company.entity.js';
export declare class Location extends BaseEntity {
    company: Company;
    name: string;
    code: string;
    type: string;
    address?: string;
    city?: string;
    state?: string;
    countryCode?: string;
    isActive: boolean;
}
