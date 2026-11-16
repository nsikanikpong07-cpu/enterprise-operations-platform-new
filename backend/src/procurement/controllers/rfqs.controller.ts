import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../../auth/guards/jwt-auth.guard.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RfqsService } from '../providers/rfqs.service.js';

@ApiTags('Requests for quotation')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('procurement/rfqs')
export class RfqsController {
  constructor(private readonly rfqs: RfqsService) {}

  @Get('supplier')
  supplierRequests(@Req() request: AuthenticatedRequest, @Query('status') status?: string) {
    return this.rfqs.supplierRequests(request.user.id, status);
  }

  @Get('supplier/notifications')
  notifications(@Req() request: AuthenticatedRequest) { return this.rfqs.supplierNotifications(request.user.id); }

  @Post('supplier/notifications/:notificationId/read')
  markNotificationRead(@Req() request: AuthenticatedRequest, @Param('notificationId', ParseUUIDPipe) notificationId: string) {
    return this.rfqs.markNotificationRead(request.user.id,notificationId);
  }

  @Get('supplier/:id')
  supplierRequest(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.rfqs.supplierRequest(request.user.id, id);
  }

  @Post('supplier/:id/decline')
  decline(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string, @Body() body: { reason?: string }) {
    return this.rfqs.decline(request.user.id, id, body?.reason ?? '');
  }

  @Post('supplier/:id/quotation')
  submitQuotation(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string, @Body() body: { currency?: string; total?: number; proposedDate?: string; terms?: string; notes?: string; items?: Array<{ itemId?: string; unitPrice?: number }> }) {
    return this.rfqs.submitQuotation(request.user.id, id, body);
  }

  @Get()
  companyRequests(@Req() request: AuthenticatedRequest, @Query('companyId') companyId: string, @Query('status') status?: string) {
    return this.rfqs.companyRequests(request.user.id, companyId, status);
  }

  @Post()
  create(@Req() request: AuthenticatedRequest, @Query('companyId') companyId: string, @Body() body: { title?: string; responseDeadline?: string; items?: Array<{ name?: string; type?: string; quantity?: number; unit?: string; scope?: string; location?: string }>; supplierIds?: string[] }) {
    return this.rfqs.create(request.user.id, companyId, body);
  }

  @Post(':id/close')
  close(@Req() request: AuthenticatedRequest, @Query('companyId') companyId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.rfqs.close(request.user.id, companyId, id);
  }

  @Post(':id/select-quote')
  selectQuote(@Req() request: AuthenticatedRequest, @Query('companyId') companyId: string, @Param('id', ParseUUIDPipe) id: string, @Body() body: { quoteId?: string }) {
    return this.rfqs.selectQuote(request.user.id,companyId,id,body?.quoteId ?? '');
  }

  @Get(':id/purchase-order')
  purchaseOrder(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.rfqs.purchaseOrder(request.user.id,id);
  }

  @Get(':id/quotations')
  quotations(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.rfqs.quotations(request.user.id, id);
  }
}
