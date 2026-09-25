var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, } from '@nestjs/common';
import { CreateGoodsReceiptDto, CreatePurchaseOrderDto, UpdatePurchaseOrderDto, } from '../dto/procurement.dto.js';
import { ProcurementService } from '../providers/procurement.service.js';
let ProcurementController = class ProcurementController {
    procurement;
    constructor(procurement) {
        this.procurement = procurement;
    }
    findOrders(companyId) {
        return this.procurement.findOrders(companyId);
    }
    findOrder(id) {
        return this.procurement.findOrder(id);
    }
    orderItems(id) {
        return this.procurement.orderItems(id);
    }
    createOrder(dto) {
        return this.procurement.createOrder(dto);
    }
    updateOrder(id, dto) {
        return this.procurement.updateOrder(id, dto);
    }
    createReceipt(dto) {
        return this.procurement.createReceipt(dto);
    }
    receiptsForOrder(id) {
        return this.procurement.receiptsForOrder(id);
    }
};
__decorate([
    Get('purchase-orders'),
    __param(0, Query('companyId', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProcurementController.prototype, "findOrders", null);
__decorate([
    Get('purchase-orders/:id'),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProcurementController.prototype, "findOrder", null);
__decorate([
    Get('purchase-orders/:id/items'),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProcurementController.prototype, "orderItems", null);
__decorate([
    Post('purchase-orders'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreatePurchaseOrderDto]),
    __metadata("design:returntype", void 0)
], ProcurementController.prototype, "createOrder", null);
__decorate([
    Patch('purchase-orders/:id'),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdatePurchaseOrderDto]),
    __metadata("design:returntype", void 0)
], ProcurementController.prototype, "updateOrder", null);
__decorate([
    Post('goods-receipts'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateGoodsReceiptDto]),
    __metadata("design:returntype", void 0)
], ProcurementController.prototype, "createReceipt", null);
__decorate([
    Get('purchase-orders/:id/receipts'),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProcurementController.prototype, "receiptsForOrder", null);
ProcurementController = __decorate([
    Controller('procurement'),
    __metadata("design:paramtypes", [ProcurementService])
], ProcurementController);
export { ProcurementController };
//# sourceMappingURL=procurement.controller.js.map