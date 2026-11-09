/** Contracts derived from the uploaded NestJS DTOs. */
export type AccountType = "company" | "vendor" | "both";
export interface RegistrationOwner {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}
export interface RegisterOrganization {
  accountType: AccountType;
  name: string;
  legalName?: string;
  registrationNumber?: string;
  taxIdentificationNumber?: string;
  industry?: string;
  countryCode?: string;
  defaultCurrency?: string;
  timezone?: string;
  owner: RegistrationOwner;
}
export interface LoginRequest {
  email: string;
  password: string;
}
export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  companyId: string | null;
  companyUserId: string | null;
  user: { id: string; email: string; firstName: string; lastName: string };
}
