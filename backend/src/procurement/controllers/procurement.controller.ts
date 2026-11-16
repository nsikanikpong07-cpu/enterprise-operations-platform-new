import { ApiBody } from "@nestjs/swagger";
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { CompanyAuthenticatedRequest } from '../../auth/guards/company-access.guard.js';
import {
  CreateGoodsReceiptDto,
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
} from '../dto/procurement.dto.js';
import { ProcurementService } from '../providers/procurement.service.js';

@Controller('procurement')
export class ProcurementController {
  constructor(private readonly procurement: ProcurementService) {}

  @Get('eligible-suppliers')
  eligibleSuppliers(@Query('companyId', ParseUUIDPipe) companyId: string) {
    return this.procurement.eligibleSuppliers(companyId);
  }

  @Get('purchase-orders')
  findOrders(@Query('companyId', ParseUUIDPipe) companyId: string) {
    return this.procurement.findOrders(companyId);
  }

  @Get('purchase-orders/:id')
  async findOrder(@Param('id', ParseUUIDPipe) id: string, @Req() request: CompanyAuthenticatedRequest & { canIssueOrder?: boolean; canReceiveGoods?: boolean }) {
    const order = await this.procurement.findOrder(id);
    return { ...order, canIssueOrder: request.canIssueOrder === true, canReceiveGoods: request.canReceiveGoods === true };
  }

  @Get('purchase-orders/:id/items')
  orderItems(@Param('id', ParseUUIDPipe) id: string) {
    return this.procurement.orderItems(id);
  }

  @Post('purchase-orders')
  @ApiBody({ type: CreatePurchaseOrderDto })
  createOrder(@Body() dto: CreatePurchaseOrderDto) {
    return this.procurement.createOrder(dto);
  }

  @Post('purchase-orders/:id/issue')
  issueOrder(@Param('id', ParseUUIDPipe) id: string) {
    return this.procurement.issueOrder(id);
  }

  @Patch('purchase-orders/:id')
  @ApiBody({ type: UpdatePurchaseOrderDto })
  updateOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePurchaseOrderDto,
  ) {
    return this.procurement.updateOrder(id, dto);
  }

  @Post('goods-receipts')
  @ApiBody({ type: CreateGoodsReceiptDto })
  createReceipt(@Body() dto: CreateGoodsReceiptDto) {
    return this.procurement.createReceipt(dto);
  }

  @Get('goods-receipts')
  findReceipts(@Query('companyId', ParseUUIDPipe) companyId: string) {
    return this.procurement.findReceipts(companyId);
  }

  @Get('goods-receipts/:id')
  findReceipt(@Param('id', ParseUUIDPipe) id: string) {
    return this.procurement.findReceipt(id);
  }

  @Get('purchase-orders/:id/receipts')
  receiptsForOrder(@Param('id', ParseUUIDPipe) id: string) {
    return this.procurement.receiptsForOrder(id);
  }
}
