import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiProduces, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../../auth/guards/jwt-auth.guard.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import {
  SupplierWorkspaceContactDto,
  SupplierWorkspaceProfileDto,
  UpdateSupplierWorkspaceContactDto,
  SupplierListingDto,
  UpdateSupplierListingDto,
} from '../dto/vendor.dto.js';
import { SuppliersService } from '../providers/suppliers.service.js';
import type { UploadedCertificate } from '../providers/certificate-ocr.service.js';

@ApiTags('Supplier workspace')
@ApiBearerAuth('bearer')
@Controller('vendor/me')
@UseGuards(JwtAuthGuard)
export class SupplierWorkspaceController {
  constructor(private readonly suppliers: SuppliersService) {}

  @Get()
  getWorkspace(@Req() request: AuthenticatedRequest) {
    return this.suppliers.workspaceForUser(request.user.id);
  }

  @Get('documents')
  getDocuments(@Req() request: AuthenticatedRequest) {
    return this.suppliers.workspaceDocumentsForUser(request.user.id);
  }

  @Post('documents/upload-ticket')
  createDocumentUploadTicket(@Req() request: AuthenticatedRequest) {
    return this.suppliers.createWorkspaceUploadTicket(request.user.id);
  }

  @Post('documents')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: {
    type: 'object', required: ['file'],
    properties: { file: { type: 'string', format: 'binary' } },
  } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 15 * 1024 * 1024, files: 1 } }))
  uploadCac(@Req() request: AuthenticatedRequest, @UploadedFile() file: UploadedCertificate) {
    return this.suppliers.uploadWorkspaceCac(request.user.id, file);
  }

  @Patch()
  @ApiBody({ type: SupplierWorkspaceProfileDto })
  updateProfile(
    @Req() request: AuthenticatedRequest,
    @Body() dto: SupplierWorkspaceProfileDto,
  ) {
    return this.suppliers.updateWorkspaceProfile(request.user.id, dto);
  }

  @Post('contacts')
  @ApiBody({ type: SupplierWorkspaceContactDto })
  addContact(
    @Req() request: AuthenticatedRequest,
    @Body() dto: SupplierWorkspaceContactDto,
  ) {
    return this.suppliers.addWorkspaceContact(request.user.id, dto);
  }

  @Patch('contacts/:contactId')
  @ApiBody({ type: UpdateSupplierWorkspaceContactDto })
  updateContact(
    @Req() request: AuthenticatedRequest,
    @Param('contactId', ParseUUIDPipe) contactId: string,
    @Body() dto: UpdateSupplierWorkspaceContactDto,
  ) {
    return this.suppliers.updateWorkspaceContact(request.user.id, contactId, dto);
  }

  @Delete('contacts/:contactId')
  removeContact(
    @Req() request: AuthenticatedRequest,
    @Param('contactId', ParseUUIDPipe) contactId: string,
  ) {
    return this.suppliers.removeWorkspaceContact(request.user.id, contactId);
  }

  @Get('listings')
  getListings(@Req() request: AuthenticatedRequest) {
    return this.suppliers.workspaceListingsForUser(request.user.id);
  }

  @Post('listings')
  @ApiBody({ type: SupplierListingDto })
  createListing(@Req() request: AuthenticatedRequest, @Body() dto: SupplierListingDto) {
    return this.suppliers.createWorkspaceListing(request.user.id, dto);
  }

  @Patch('listings/:listingId')
  @ApiBody({ type: UpdateSupplierListingDto })
  updateListing(
    @Req() request: AuthenticatedRequest,
    @Param('listingId', ParseUUIDPipe) listingId: string,
    @Body() dto: UpdateSupplierListingDto,
  ) {
    return this.suppliers.updateWorkspaceListing(request.user.id, listingId, dto);
  }

  @Post('listings/:listingId/publish')
  publishListing(@Req() request: AuthenticatedRequest, @Param('listingId', ParseUUIDPipe) listingId: string) {
    return this.suppliers.publishWorkspaceListing(request.user.id, listingId);
  }

  @Post('listings/:listingId/unpublish')
  unpublishListing(@Req() request: AuthenticatedRequest, @Param('listingId', ParseUUIDPipe) listingId: string) {
    return this.suppliers.unpublishWorkspaceListing(request.user.id, listingId);
  }

  @Post('listings/:listingId/draft')
  saveListingDraft(@Req() request: AuthenticatedRequest, @Param('listingId', ParseUUIDPipe) listingId: string) {
    return this.suppliers.saveWorkspaceListingDraft(request.user.id, listingId);
  }

  @Delete('listings/:listingId')
  deleteListing(@Req() request: AuthenticatedRequest, @Param('listingId', ParseUUIDPipe) listingId: string) {
    return this.suppliers.deleteWorkspaceListing(request.user.id, listingId);
  }

  @Post('listing-photos')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', required: ['file'], properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024, files: 1 } }))
  uploadListingPhoto(@Req() request: AuthenticatedRequest, @UploadedFile() file: UploadedCertificate) {
    return this.suppliers.uploadWorkspaceListingPhoto(request.user.id, file);
  }

  @Get('listing-photos/:photoId')
  @ApiProduces('image/jpeg', 'image/png', 'image/webp')
  async listingPhoto(
    @Req() request: AuthenticatedRequest,
    @Param('photoId', ParseUUIDPipe) photoId: string,
  ) {
    const image = await this.suppliers.workspaceListingPhotoForUser(request.user.id, photoId);
    return new StreamableFile(image.buffer, { type: image.contentType, disposition: 'inline' });
  }
}
