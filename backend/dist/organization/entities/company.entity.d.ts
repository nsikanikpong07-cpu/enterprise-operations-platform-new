import { BaseEntity } from '../../common/entities/base.entity.js';
export declare class Company extends BaseEntity {
    name: string;
    legalName?: string;
    registrationNumber?: string;
    taxIdentificationNumber?: string;
    industry?: string;
    countryCode: string;
    defaultCurrency: string;
    timezone: string;
    status: string;
}
