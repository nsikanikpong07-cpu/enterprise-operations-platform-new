import { Body, Controller, Post, Req } from "@nestjs/common";
import type { Request } from "express";
import { RegisterOrganizationDto } from "../dto/register-organization.dto.js";
import { RegistrationService } from "../providers/registration.service.js";

@Controller("auth")
export class RegistrationController {
  constructor(private readonly registration: RegistrationService) {}
  // Organization owners register publicly. Ordinary staff still cannot
  // self-register: their Company Admin uses the protected IAM endpoint.
  @Post("register")
  register(@Body() dto: RegisterOrganizationDto, @Req() request: Request) {
    return this.registration.register(
      dto,
      request.ip ?? request.socket.remoteAddress ?? "unknown",
    );
  }
}
