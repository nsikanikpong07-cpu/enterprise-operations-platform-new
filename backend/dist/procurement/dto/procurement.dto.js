var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ArrayMinSize, IsArray, IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString, IsUUID, Length, MaxLength, Min, ValidateNested, } from 'class-validator';
import { Type } from 'class-transformer';
export class RequisitionItemDto {
    itemId;
    description;
    quantityRequested;
    unitOfMeasureId;
    estimatedUnitPrice;
    requiredDate;
}
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], RequisitionItemDto.prototype, "itemId", void 0);
__decorate([
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], RequisitionItemDto.prototype, "description", void 0);
__decorate([
    IsNumber(),
    Min(0.01),
    __metadata("design:type", Number)
], RequisitionItemDto.prototype, "quantityRequested", void 0);
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], RequisitionItemDto.prototype, "unitOfMeasureId", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], RequisitionItemDto.prototype, "estimatedUnitPrice", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], RequisitionItemDto.prototype, "requiredDate", void 0);
export class CreateRequisitionDto {
    companyId;
    requisitionNumber;
    requesterId;
    departmentId;
    requiredDate;
    justification;
    items;
}
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], CreateRequisitionDto.prototype, "companyId", void 0);
__decorate([
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateRequisitionDto.prototype, "requisitionNumber", void 0);
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], CreateRequisitionDto.prototype, "requesterId", void 0);
__decorate([
    IsOptional(),
    IsUUID(),
    __metadata("design:type", String)
], CreateRequisitionDto.prototype, "departmentId", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], CreateRequisitionDto.prototype, "requiredDate", void 0);
__decorate([
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], CreateRequisitionDto.prototype, "justification", void 0);
__decorate([
    IsArray(),
    ArrayMinSize(1),
    ValidateNested({ each: true }),
    Type(() => RequisitionItemDto),
    __metadata("design:type", Array)
], CreateRequisitionDto.prototype, "items", void 0);
export class UpdateRequisitionDto {
    status;
    justification;
}
__decorate([
    IsOptional(),
    IsIn([
        'Draft',
        'Submitted',
        'Pending',
        'Approved',
        'Rejected',
        'Cancelled',
        'Completed',
    ]),
    __metadata("design:type", String)
], UpdateRequisitionDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], UpdateRequisitionDto.prototype, "justification", void 0);
export class CreateApprovalDto {
    requisitionId;
    approverId;
    approvalLevel;
}
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], CreateApprovalDto.prototype, "requisitionId", void 0);
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], CreateApprovalDto.prototype, "approverId", void 0);
__decorate([
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], CreateApprovalDto.prototype, "approvalLevel", void 0);
export class DecideApprovalDto {
    approvalStatus;
    comments;
    rejectionReason;
}
__decorate([
    IsIn(['Approved', 'Rejected']),
    __metadata("design:type", String)
], DecideApprovalDto.prototype, "approvalStatus", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], DecideApprovalDto.prototype, "comments", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], DecideApprovalDto.prototype, "rejectionReason", void 0);
export class PurchaseOrderItemDto {
    requisitionItemId;
    itemId;
    description;
    quantityOrdered;
    unitOfMeasureId;
    unitPrice;
    deliveryDate;
}
__decorate([
    IsOptional(),
    IsUUID(),
    __metadata("design:type", String)
], PurchaseOrderItemDto.prototype, "requisitionItemId", void 0);
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], PurchaseOrderItemDto.prototype, "itemId", void 0);
__decorate([
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], PurchaseOrderItemDto.prototype, "description", void 0);
__decorate([
    IsNumber(),
    Min(0.01),
    __metadata("design:type", Number)
], PurchaseOrderItemDto.prototype, "quantityOrdered", void 0);
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], PurchaseOrderItemDto.prototype, "unitOfMeasureId", void 0);
__decorate([
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], PurchaseOrderItemDto.prototype, "unitPrice", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], PurchaseOrderItemDto.prototype, "deliveryDate", void 0);
export class CreatePurchaseOrderDto {
    companyId;
    poNumber;
    requisitionId;
    supplierId;
    buyerId;
    expectedDeliveryDate;
    currency;
    paymentTerms;
    items;
}
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], CreatePurchaseOrderDto.prototype, "companyId", void 0);
__decorate([
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreatePurchaseOrderDto.prototype, "poNumber", void 0);
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], CreatePurchaseOrderDto.prototype, "requisitionId", void 0);
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], CreatePurchaseOrderDto.prototype, "supplierId", void 0);
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], CreatePurchaseOrderDto.prototype, "buyerId", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], CreatePurchaseOrderDto.prototype, "expectedDeliveryDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    Length(3, 3),
    __metadata("design:type", String)
], CreatePurchaseOrderDto.prototype, "currency", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreatePurchaseOrderDto.prototype, "paymentTerms", void 0);
__decorate([
    IsArray(),
    ArrayMinSize(1),
    ValidateNested({ each: true }),
    Type(() => PurchaseOrderItemDto),
    __metadata("design:type", Array)
], CreatePurchaseOrderDto.prototype, "items", void 0);
export class UpdatePurchaseOrderDto {
    status;
    expectedDeliveryDate;
    paymentTerms;
}
__decorate([
    IsOptional(),
    IsIn([
        'Draft',
        'Submitted',
        'Pending',
        'Approved',
        'Rejected',
        'Cancelled',
        'Completed',
    ]),
    __metadata("design:type", String)
], UpdatePurchaseOrderDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], UpdatePurchaseOrderDto.prototype, "expectedDeliveryDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], UpdatePurchaseOrderDto.prototype, "paymentTerms", void 0);
export class GoodsReceiptItemDto {
    purchaseOrderItemId;
    quantityReceived;
    quantityAccepted;
    quantityRejected;
    rejectionReason;
}
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], GoodsReceiptItemDto.prototype, "purchaseOrderItemId", void 0);
__decorate([
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], GoodsReceiptItemDto.prototype, "quantityReceived", void 0);
__decorate([
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], GoodsReceiptItemDto.prototype, "quantityAccepted", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], GoodsReceiptItemDto.prototype, "quantityRejected", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], GoodsReceiptItemDto.prototype, "rejectionReason", void 0);
export class CreateGoodsReceiptDto {
    receiptNumber;
    purchaseOrderId;
    receivedById;
    deliveryNoteNumber;
    remarks;
    items;
}
__decorate([
    IsString(),
    MaxLength(50),
    __metadata("design:type", String)
], CreateGoodsReceiptDto.prototype, "receiptNumber", void 0);
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], CreateGoodsReceiptDto.prototype, "purchaseOrderId", void 0);
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], CreateGoodsReceiptDto.prototype, "receivedById", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateGoodsReceiptDto.prototype, "deliveryNoteNumber", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], CreateGoodsReceiptDto.prototype, "remarks", void 0);
__decorate([
    IsArray(),
    ArrayMinSize(1),
    ValidateNested({ each: true }),
    Type(() => GoodsReceiptItemDto),
    __metadata("design:type", Array)
], CreateGoodsReceiptDto.prototype, "items", void 0);
//# sourceMappingURL=procurement.dto.js.map