import { Check, Column, Entity, Index } from "typeorm";
import { BaseEntity } from "../../common/entities/base.entity.js";

@Entity({ schema: "iam", name: "users" })
@Check(`status IN ('active', 'suspended', 'inactive')`)
export class User extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: "varchar", length: 255, nullable: false, unique: true })
  email!: string;

  @Column({
    name: "password_hash",
    type: "text",
    nullable: false,
    select: false,
  })
  passwordHash!: string;

  // Incrementing this invalidates every earlier JWT for this account.
  // It is internal state and must not appear in API user responses.
  @Column({ name: "auth_version", type: "integer", default: 0, select: false })
  authVersion!: number;

  @Column({ name: "first_name", type: "varchar", length: 100 })
  firstName!: string;

  @Column({ name: "last_name", type: "varchar", length: 100 })
  lastName!: string;
  @Column({ type: "varchar", length: 50, nullable: true })
  phone?: string;

  @Column({ type: "varchar", length: 30, nullable: false, default: "active" })
  status!: string;

  @Column({ name: "last_login_at", type: "timestamptz", nullable: true })
  lastLoginAt?: Date;
}
