import { IamService } from '../providers/iam.service.js';
export declare class IamController {
    private readonly iam;
    constructor(iam: IamService);
    permissionsForCompanyUser(companyUserId: string): Promise<string[]>;
}
