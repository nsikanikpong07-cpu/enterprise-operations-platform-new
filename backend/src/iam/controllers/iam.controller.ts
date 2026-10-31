import { ApiBearerAuth } from "@nestjs/swagger";
import { IamScope } from "../../auth/decorators/iam-scope.decorator.js";
import { Controller, Get, Param, ParseUUIDPipe } from "@nestjs/common";
import { IamService } from "../providers/iam.service.js";

@ApiBearerAuth()
@Controller("iam")
export class IamController {
  constructor(private readonly iam: IamService) {}

  @IamScope({ kind: "membership", location: "params", key: "companyUserId" })
  @Get("memberships/:companyUserId/permissions")
  permissionsForCompanyUser(
    @Param("companyUserId", ParseUUIDPipe) companyUserId: string,
  ) {
    return this.iam.permissionsForCompanyUser(companyUserId);
  }
}
