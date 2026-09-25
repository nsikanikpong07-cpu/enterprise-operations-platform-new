import { BaseEntity } from '../../common/entities/base.entity.js';
export declare class User extends BaseEntity {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phone?: string;
    status: string;
    lastLoginAt?: Date;
}
