import { CreateApprovalDto, DecideApprovalDto } from '../dto/procurement.dto.js';
import { ApprovalsService } from '../providers/approvals.service.js';
export declare class ApprovalsController {
    private readonly approvals;
    constructor(approvals: ApprovalsService);
    create(dto: CreateApprovalDto): Promise<import("../entities/approval.entity.js").Approval>;
    forRequisition(requisitionId: string): Promise<import("../entities/approval.entity.js").Approval[]>;
    pendingFor(approverId: string): Promise<import("../entities/approval.entity.js").Approval[]>;
    decide(id: string, dto: DecideApprovalDto): Promise<import("../entities/approval.entity.js").Approval>;
}
