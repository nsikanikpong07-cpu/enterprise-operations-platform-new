import { BaseEntity } from '../../common/entities/base.entity.js';
import { CompanyUser } from '../../iam/entities/company-user.entity.js';
import { Requisition } from './requisition.entity.js';
export declare class Approval extends BaseEntity {
    requisition: Requisition;
    approver: CompanyUser;
    approvalLevel: number;
    approvalStatus: string;
    approvalDate?: Date;
    comments?: string;
    rejectionReason?: string;
}
