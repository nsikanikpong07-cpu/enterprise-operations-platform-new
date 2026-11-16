import { ApiBody, ApiProduces } from '@nestjs/swagger';
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
  StreamableFile,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../../auth/guards/jwt-auth.guard.js';
import {
  CreateRiskAssessmentDto,
  OpenVerificationCaseDto,
  UpdateVerificationCaseDto,
} from '../dto/vendor.dto.js';
import { VerificationService } from '../providers/verification.service.js';
import { CertificateOcrService } from '../providers/certificate-ocr.service.js';

@Controller('vendor/verification')
export class VerificationController {
  constructor(
    private readonly verification: VerificationService,
    private readonly certificateOcr: CertificateOcrService,
  ) {}

  @Get('cases/:id/documents')
  documentsForCase(@Param('id', ParseUUIDPipe) id: string) {
    return this.certificateOcr.documentsForCase(id);
  }

  @Get('cases/:id/documents/:documentId/file')
  @ApiProduces('application/pdf', 'image/jpeg', 'image/png')
  async documentFile(
    @Param('id', ParseUUIDPipe) caseId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
  ) {
    const file = await this.certificateOcr.documentFileForCase(caseId, documentId);
    return new StreamableFile(file.buffer, {
      type: file.contentType,
      disposition: `inline; filename="${file.fileName.replace(/[\r\n"\\]/g, '')}"`,
    });
  }

  @Post('cases/:id/documents/:documentId/ocr')
  compareCacCertificate(
    @Param('id', ParseUUIDPipe) caseId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.certificateOcr.compareCaseDocument(caseId, documentId, request.user.id);
  }

  @Post('cases')
  @ApiBody({ type: OpenVerificationCaseDto })
  openCase(@Body() dto: OpenVerificationCaseDto) {
    return this.verification.openCase(dto);
  }

  @Get('cases')
  casesForProfile(@Query('profileId', ParseUUIDPipe) profileId: string) {
    return this.verification.casesForProfile(profileId);
  }

  @Get('cases/:id')
  findCase(@Param('id', ParseUUIDPipe) id: string) {
    return this.verification.findCase(id);
  }

  @Patch('cases/:id')
  @ApiBody({ type: UpdateVerificationCaseDto })
  updateCase(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVerificationCaseDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.verification.updateCase(id, dto, request.user.id);
  }

  @Post('risk-assessments')
  @ApiBody({ type: CreateRiskAssessmentDto })
  assess(@Body() dto: CreateRiskAssessmentDto) {
    return this.verification.assess(dto);
  }

  @Get('cases/:id/risk-assessments')
  assessmentsForCase(@Param('id', ParseUUIDPipe) id: string) {
    return this.verification.assessmentsForCase(id);
  }
}
