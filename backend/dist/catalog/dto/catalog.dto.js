var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsBoolean, IsIn, IsOptional, IsString, IsUUID, MaxLength, } from 'class-validator';
export class CreateItemDto {
    companyId;
    categoryId;
    unitOfMeasureId;
    sku;
    name;
    description;
    itemType;
    isStockable;
}
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], CreateItemDto.prototype, "companyId", void 0);
__decorate([
    IsOptional(),
    IsUUID(),
    __metadata("design:type", String)
], CreateItemDto.prototype, "categoryId", void 0);
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], CreateItemDto.prototype, "unitOfMeasureId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateItemDto.prototype, "sku", void 0);
__decorate([
    IsString(),
    MaxLength(255),
    __metadata("design:type", String)
], CreateItemDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateItemDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsIn(['material', 'service', 'asset']),
    __metadata("design:type", String)
], CreateItemDto.prototype, "itemType", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateItemDto.prototype, "isStockable", void 0);
export class UpdateItemDto {
    categoryId;
    name;
    description;
    itemType;
    isStockable;
    isActive;
}
__decorate([
    IsOptional(),
    IsUUID(),
    __metadata("design:type", String)
], UpdateItemDto.prototype, "categoryId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(255),
    __metadata("design:type", String)
], UpdateItemDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateItemDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsIn(['material', 'service', 'asset']),
    __metadata("design:type", String)
], UpdateItemDto.prototype, "itemType", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdateItemDto.prototype, "isStockable", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdateItemDto.prototype, "isActive", void 0);
export class CreateItemCategoryDto {
    companyId;
    parentId;
    name;
    description;
}
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], CreateItemCategoryDto.prototype, "companyId", void 0);
__decorate([
    IsOptional(),
    IsUUID(),
    __metadata("design:type", String)
], CreateItemCategoryDto.prototype, "parentId", void 0);
__decorate([
    IsString(),
    MaxLength(150),
    __metadata("design:type", String)
], CreateItemCategoryDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateItemCategoryDto.prototype, "description", void 0);
export class UpdateItemCategoryDto {
    parentId;
    name;
    description;
}
__decorate([
    IsOptional(),
    IsUUID(),
    __metadata("design:type", String)
], UpdateItemCategoryDto.prototype, "parentId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(150),
    __metadata("design:type", String)
], UpdateItemCategoryDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateItemCategoryDto.prototype, "description", void 0);
export class CreateUnitOfMeasureDto {
    code;
    name;
}
__decorate([
    IsString(),
    MaxLength(20),
    __metadata("design:type", String)
], CreateUnitOfMeasureDto.prototype, "code", void 0);
__decorate([
    IsString(),
    MaxLength(100),
    __metadata("design:type", String)
], CreateUnitOfMeasureDto.prototype, "name", void 0);
//# sourceMappingURL=catalog.dto.js.map