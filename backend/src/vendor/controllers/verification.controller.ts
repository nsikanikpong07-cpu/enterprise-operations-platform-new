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
  CreateRiskAssessmentDto,
  OpenVerificationCaseDto,
  UpdateVerificationCaseDto,
} from '../dto/vendor.dto.js';
import { VerificationService } from '../providers/verification.service.js';

@Controller('vendor/verification')
export class VerificationController {
  constructor(private readonly verification: VerificationService) {}

  @Post('cases')
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
  updateCase(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVerificationCaseDto,
  ) {
    return this.verification.updateCase(id, dto);
  }

  @Post('risk-assessments')
  assess(@Body() dto: CreateRiskAssessmentDto) {
    return this.verification.assess(dto);
  }

  @Get('cases/:id/risk-assessments')
  assessmentsForCase(@Param('id', ParseUUIDPipe) id: string) {
    return this.verification.assessmentsForCase(id);
  }
}
