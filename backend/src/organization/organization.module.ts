import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities/company.entity.js';
import { Department } from './entities/department.entity.js';
import { Location } from './entities/location.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Company, Department, Location])],
  exports: [TypeOrmModule],
})
export class OrganizationModule {}
