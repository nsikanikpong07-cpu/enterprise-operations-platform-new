import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  CreateGoodsReceiptDto,
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
} from '../dto/procurement.dto.js';
import { ProcurementService } from '../providers/procurement.service.js';

@Controller('procurement')
export class ProcurementController {
  constructor(private readonly procurement: ProcurementService) {}

  @Get('purchase-orders')
  findOrders(@Query('companyId', ParseUUIDPipe) companyId: string) {
    return this.procurement.findOrders(companyId);
  }

  @Get('purchase-orders/:id')
  findOrder(@Param('id', ParseUUIDPipe) id: string) {
    return this.procurement.findOrder(id);
  }

  @Get('purchase-orders/:id/items')
  orderItems(@Param('id', ParseUUIDPipe) id: string) {
    return this.procurement.orderItems(id);
  }

  @Post('purchase-orders')
  createOrder(@Body() dto: CreatePurchaseOrderDto) {
    return this.procurement.createOrder(dto);
  }

  @Patch('purchase-orders/:id')
  updateOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePurchaseOrderDto,
  ) {
    return this.procurement.updateOrder(id, dto);
  }

  @Post('goods-receipts')
  createReceipt(@Body() dto: CreateGoodsReceiptDto) {
    return this.procurement.createReceipt(dto);
  }

  @Get('purchase-orders/:id/receipts')
  receiptsForOrder(@Param('id', ParseUUIDPipe) id: string) {
    return this.procurement.receiptsForOrder(id);
  }
}
