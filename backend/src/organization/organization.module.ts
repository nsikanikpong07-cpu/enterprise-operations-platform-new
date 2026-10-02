import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationController } from './controllers/organization.controller.js';
import { Company } from './entities/company.entity.js';
import { Department } from './entities/department.entity.js';
import { Location } from './entities/location.entity.js';
import { OrganizationService } from './providers/organization.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Company, Department, Location])],
  controllers: [OrganizationController],
  providers: [OrganizationService],
  exports: [TypeOrmModule, OrganizationService],
})
export class OrganizationModule {}
