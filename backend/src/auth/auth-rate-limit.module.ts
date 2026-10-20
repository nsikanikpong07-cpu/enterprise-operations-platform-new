import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthRateLimitService } from "./providers/auth-rate-limit.service.js";

// Shared by login and public registration without a circular module import.
@Module({
  imports: [ConfigModule],
  providers: [AuthRateLimitService],
  exports: [AuthRateLimitService],
})
export class AuthRateLimitModule {}
