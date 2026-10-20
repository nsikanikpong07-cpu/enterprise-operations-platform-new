import { Check, Column, Entity } from "typeorm";
import { BaseEntity } from "../../common/entities/base.entity.js";

@Entity({ schema: "organization", name: "companies" })
@Check("status IN ('active','suspended','inactive')")
export class Company extends BaseEntity {
  @Column({ type: "varchar", length: 255 })
  name!: string;
  @Column({ name: "legal_name", type: "varchar", length: 255, nullable: true })
  legalName?: string;
  @Column({
    name: "registration_number",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  registrationNumber?: string;
  @Column({
    name: "tax_identification_number",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  taxIdentificationNumber?: string;
  @Column({ type: "varchar", length: 100, nullable: true })
  industry?: string;
  @Column({ name: "country_code", type: "char", length: 2, default: "NG" })
  countryCode!: string;
  @Column({ name: "default_currency", type: "char", length: 3, default: "NGN" })
  defaultCurrency!: string;
  @Column({ type: "varchar", length: 100, default: "Africa/Lagos" })
  timezone!: string;
  @Column({ type: "varchar", length: 30, default: "active" })
  status!: string;
}
