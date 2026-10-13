import { SetMetadata } from "@nestjs/common";

export const IAM_SCOPE_KEY = "iam:company-scope";
export type IamScopeOptions =
  | { kind: "company"; location: "query" | "body" | "params"; key: string }
  | { kind: "role"; location: "body" | "params"; key: string }
  | { kind: "membership"; location: "body" | "params"; key: string }
  | { kind: "user"; location: "body" | "params"; key: string };

// Declare where ownership must be resolved for this endpoint.
// Resource IDs are resolved through the database, never trusted as company IDs.
export const IamScope = (scope: IamScopeOptions) =>
  SetMetadata(IAM_SCOPE_KEY, scope);
