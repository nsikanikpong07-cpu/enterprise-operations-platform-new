import {
  Controller,
  Headers,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiHeader, ApiTags } from '@nestjs/swagger';
import type { UploadedCertificate } from '../providers/certificate-ocr.service.js';
import { SuppliersService } from '../providers/suppliers.service.js';

@ApiTags('Supplier certificate uploads')
@Controller('vendor/document-uploads')
export class SupplierDocumentUploadController {
  constructor(private readonly suppliers: SuppliersService) {}

  @Post()
  @ApiHeader({ name: 'X-Supplier-Upload-Ticket', required: true })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 15 * 1024 * 1024, files: 1 },
    }),
  )
  upload(
    @Headers('x-supplier-upload-ticket') ticket: string,
    @UploadedFile() file: UploadedCertificate,
  ) {
    return this.suppliers.uploadWorkspaceCacWithTicket(ticket, file);
  }
}
