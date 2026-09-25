import { Repository } from 'typeorm';
import { CreateApprovalDto, DecideApprovalDto } from '../dto/procurement.dto.js';
import { Approval } from '../entities/approval.entity.js';
export declare class ApprovalsService {
    private readonly approvals;
    constructor(approvals: Repository<Approval>);
    create(dto: CreateApprovalDto): Promise<Approval>;
    forRequisition(requisitionId: string): Promise<Approval[]>;
    pendingFor(approverId: string): Promise<Approval[]>;
    decide(id: string, dto: DecideApprovalDto): Promise<Approval>;
}
