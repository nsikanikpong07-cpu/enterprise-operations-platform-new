import { AuditWriterService } from "./providers/audit-writer.service.js";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuditController } from "./controllers/audit.controller.js";
import { AuditLog } from "./entities/audit-log.entity.js";
import { AuditService } from "./providers/audit.service.js";

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  controllers: [AuditController],
  providers: [AuditService, AuditWriterService],
  exports: [TypeOrmModule, AuditService, AuditWriterService],
})
export class AuditModule {}
