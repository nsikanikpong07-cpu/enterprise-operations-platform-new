import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { IamService } from '../providers/iam.service.js';

@Controller('iam')
export class IamController {
  constructor(private readonly iam: IamService) {}

  @Get('memberships/:companyUserId/permissions')
  permissionsForCompanyUser(
    @Param('companyUserId', ParseUUIDPipe) companyUserId: string,
  ) {
    return this.iam.permissionsForCompanyUser(companyUserId);
  }
}
