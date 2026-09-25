export declare class RequisitionItemDto {
    itemId: string;
    description: string;
    quantityRequested: number;
    unitOfMeasureId: string;
    estimatedUnitPrice?: number;
    requiredDate?: string;
}
export declare class CreateRequisitionDto {
    companyId: string;
    requisitionNumber: string;
    requesterId: string;
    departmentId?: string;
    requiredDate?: string;
    justification: string;
    items: RequisitionItemDto[];
}
export declare class UpdateRequisitionDto {
    status?: string;
    justification?: string;
}
export declare class CreateApprovalDto {
    requisitionId: string;
    approverId: string;
    approvalLevel: number;
}
export declare class DecideApprovalDto {
    approvalStatus: 'Approved' | 'Rejected';
    comments?: string;
    rejectionReason?: string;
}
export declare class PurchaseOrderItemDto {
    requisitionItemId?: string;
    itemId: string;
    description: string;
    quantityOrdered: number;
    unitOfMeasureId: string;
    unitPrice: number;
    deliveryDate?: string;
}
export declare class CreatePurchaseOrderDto {
    companyId: string;
    poNumber: string;
    requisitionId: string;
    supplierId: string;
    buyerId: string;
    expectedDeliveryDate?: string;
    currency?: string;
    paymentTerms?: string;
    items: PurchaseOrderItemDto[];
}
export declare class UpdatePurchaseOrderDto {
    status?: string;
    expectedDeliveryDate?: string;
    paymentTerms?: string;
}
export declare class GoodsReceiptItemDto {
    purchaseOrderItemId: string;
    quantityReceived: number;
    quantityAccepted: number;
    quantityRejected?: number;
    rejectionReason?: string;
}
export declare class CreateGoodsReceiptDto {
    receiptNumber: string;
    purchaseOrderId: string;
    receivedById: string;
    deliveryNoteNumber?: string;
    remarks?: string;
    items: GoodsReceiptItemDto[];
}
