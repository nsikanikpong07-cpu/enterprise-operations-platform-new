import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Company } from "../../organization/entities/company.entity.js";
import { User } from "../../iam/entities/user.entity.js";

@Entity({ schema: "audit", name: "audit_logs" })
export class AuditLog {
  // Audit records have a creation timestamp only: they cannot be updated.
  // This matches the existing PostgreSQL schema instead of inheriting updated_at.
  @PrimaryGeneratedColumn("uuid")
  id!: string;
  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "NOW()",
  })
  createdAt!: Date;

  @ManyToOne(() => Company, { nullable: true, onDelete: "NO ACTION" })
  @JoinColumn({ name: "company_id" })
  company?: Company;
  @ManyToOne(() => User, { nullable: true, onDelete: "NO ACTION" })
  @JoinColumn({ name: "user_id" })
  user?: User;
  @Index()
  @Column({ type: "varchar", length: 100 })
  action!: string;
  @Index()
  @Column({ name: "entity_type", type: "varchar", length: 100 })
  entityType!: string;
  @Column({ name: "entity_id", type: "uuid", nullable: true })
  entityId?: string;
  @Column({ name: "old_values", type: "jsonb", nullable: true })
  oldValues?: object;
  @Column({ name: "new_values", type: "jsonb", nullable: true })
  newValues?: object;
  @Column({ name: "ip_address", type: "inet", nullable: true })
  ipAddress?: string;
  @Column({ name: "user_agent", type: "text", nullable: true })
  userAgent?: string;
}
