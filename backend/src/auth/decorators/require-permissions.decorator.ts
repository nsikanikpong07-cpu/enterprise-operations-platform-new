import { SetMetadata } from '@nestjs/common';

// The permission guard uses this key to read endpoint requirements.
export const REQUIRED_PERMISSIONS_KEY =
  'auth:required-permissions';

// Example: @RequirePermissions('create_requisition')
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);