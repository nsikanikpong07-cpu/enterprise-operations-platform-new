import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../auth/guards/jwt-auth.guard.js';
import { UpdateSupplierRelationshipDto } from '../dto/vendor-hub.dto.js';
import { VendorHubService } from '../providers/vendor-hub.service.js';

@ApiTags('Vendor Hub')
@ApiBearerAuth('bearer')
@Controller('vendor-hub')
export class VendorHubController {
  constructor(private readonly hub: VendorHubService) {}

  @Get()
  search(@Req() req: AuthenticatedRequest, @Query('search') search?: string, @Query('category') category?: string, @Query('location') location?: string, @Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    const companyId = String(req.query.companyId);
    return this.hub.search(companyId, { search, category, location, page: Number(page) || 1, pageSize: Number(pageSize) || 10 });
  }

  @Get('my-suppliers')
  mySuppliers(@Req() req: AuthenticatedRequest, @Query('search') search?: string, @Query('relationshipStatus') relationshipStatus?: string, @Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.hub.mySuppliers(String(req.query.companyId), { search, category: relationshipStatus, page: Number(page) || 1, pageSize: Number(pageSize) || 10 });
  }

  @Get('suppliers/:supplierId')
  supplierDetails(@Req() req: AuthenticatedRequest, @Param('supplierId', ParseUUIDPipe) supplierId: string) {
    return this.hub.supplierDetails(String(req.query.companyId), supplierId);
  }

  @Post('suppliers/:supplierId')
  addSupplier(@Req() req: AuthenticatedRequest, @Param('supplierId', ParseUUIDPipe) supplierId: string) {
    return this.hub.addSupplier(String(req.query.companyId), supplierId, req.user.id);
  }

  @Patch('relationships/:profileId')
  updateRelationship(@Req() req: AuthenticatedRequest, @Param('profileId', ParseUUIDPipe) profileId: string, @Body() body: UpdateSupplierRelationshipDto) {
    return this.hub.updateRelationship(String(req.query.companyId), profileId, body, req.user.id);
  }

  @Get('photos/:photoId')
  async photo(@Req() req: AuthenticatedRequest, @Param('photoId', ParseUUIDPipe) photoId: string, @Res() res: Response) {
    const image = await this.hub.companyListingPhoto(String(req.query.companyId), photoId);
    res.setHeader('Content-Type', image.contentType);
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.send(image.buffer);
  }
}
