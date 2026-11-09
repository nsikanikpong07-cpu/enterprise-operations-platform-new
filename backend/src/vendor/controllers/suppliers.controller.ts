import { ApiBody } from "@nestjs/swagger";
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
  CreateSupplierContactDto,
  CreateSupplierDocumentDto,
  CreateSupplierDto,
  OnboardSupplierDto,
  UpdateSupplierDto,
  UpdateSupplierProfileDto,
} from '../dto/vendor.dto.js';
import { SuppliersService } from '../providers/suppliers.service.js';

@Controller('vendor/suppliers')
export class SuppliersController {
  constructor(private readonly suppliers: SuppliersService) {}

  @Get()
  findAll() {
    return this.suppliers.findAll();
  }

  @Get('profiles')
  profilesForCompany(@Query('companyId', ParseUUIDPipe) companyId: string) {
    return this.suppliers.profilesForCompany(companyId);
  }
  
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.suppliers.findOne(id);
  }

  @Post()
  @ApiBody({ type: CreateSupplierDto })
  create(@Body() dto: CreateSupplierDto) {
    return this.suppliers.create(dto);
  }

  @Patch(':id')
  @ApiBody({ type: UpdateSupplierDto })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSupplierDto) {
    return this.suppliers.update(id, dto);
  }

  @Post('onboard')
  @ApiBody({ type: OnboardSupplierDto })
  onboard(@Body() dto: OnboardSupplierDto) {
    return this.suppliers.onboard(dto);
  }


  @Patch('profiles/:id')
  @ApiBody({ type: UpdateSupplierProfileDto })
  updateProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSupplierProfileDto,
  ) {
    return this.suppliers.updateProfile(id, dto);
  }

  @Post('contacts')
  @ApiBody({ type: CreateSupplierContactDto })
  addContact(@Body() dto: CreateSupplierContactDto) {
    return this.suppliers.addContact(dto);
  }

  @Get(':id/contacts')
  contactsFor(@Param('id', ParseUUIDPipe) id: string) {
    return this.suppliers.contactsFor(id);
  }

  @Post('documents')
  @ApiBody({ type: CreateSupplierDocumentDto })
  addDocument(@Body() dto: CreateSupplierDocumentDto) {
    return this.suppliers.addDocument(dto);
  }

  @Get(':id/documents')
  documentsFor(@Param('id', ParseUUIDPipe) id: string) {
    return this.suppliers.documentsFor(id);
  }
}
