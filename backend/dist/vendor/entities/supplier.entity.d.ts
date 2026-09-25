import { BaseEntity } from '../../common/entities/base.entity.js';
export declare class Supplier extends BaseEntity {
    legalName: string;
    tradingName?: string;
    registrationNumber?: string;
    taxIdentificationNumber?: string;
    supplierType?: string;
    countryCode?: string;
    status: string;
}
