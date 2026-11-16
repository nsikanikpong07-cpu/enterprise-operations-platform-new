import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import type { IamService } from '../../iam/providers/iam.service.js';
import { RfqsService } from './rfqs.service.js';

const companyId = '11111111-1111-4111-8111-111111111111';

describe('RfqsService', () => {
  let db: { transaction: ReturnType<typeof vi.fn>; query: ReturnType<typeof vi.fn> };
  let iam: { requireActiveCompanyMembership: ReturnType<typeof vi.fn>; permissionsForCompanyUser: ReturnType<typeof vi.fn> };
  let notices: { send: ReturnType<typeof vi.fn>; notifications: ReturnType<typeof vi.fn>; markRead: ReturnType<typeof vi.fn> };
  let service: RfqsService;

  beforeEach(() => {
    db = { transaction: vi.fn(), query: vi.fn() };
    iam = {
      requireActiveCompanyMembership: vi.fn().mockResolvedValue({ id: 'membership' }),
      permissionsForCompanyUser: vi.fn().mockResolvedValue(['create_rfq']),
    };
    notices={send:vi.fn(),notifications:vi.fn(),markRead:vi.fn()};
    service = new RfqsService(db as unknown as DataSource, iam as unknown as IamService,notices as never);
  });

  it('requires company RFQ permission before listing', async () => {
    iam.permissionsForCompanyUser.mockResolvedValue([]);
    await expect(service.companyRequests('user', companyId)).rejects.toBeInstanceOf(ForbiddenException);
    expect(db.query).not.toHaveBeenCalled();
  });

  it('rejects an RFQ with no verified supplier invite before writing', async () => {
    await expect(service.create('user', companyId, {
      title: 'Office cleaning',
      responseDeadline: new Date(Date.now() + 86_400_000).toISOString(),
      items: [{ name: 'Office cleaning', type: 'service', quantity: 4, unit: 'visits', scope: 'General cleaning', location: 'Eket' }],
      supplierIds: [],
    })).rejects.toThrow('Invite at least one valid supplier.');
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it('rejects invalid RFQ items before opening a transaction', async () => {
    await expect(service.create('user', companyId, {
      title: 'Office cleaning',
      responseDeadline: new Date(Date.now() + 86_400_000).toISOString(),
      items: [{ name: 'Office cleaning', type: 'service', quantity: 0, unit: 'visits', scope: 'General cleaning', location: 'Eket' }],
      supplierIds: ['22222222-2222-4222-8222-222222222222'],
    })).rejects.toThrow('Each RFQ line needs a name, type, positive quantity, unit, scope and location.');
    expect(db.transaction).not.toHaveBeenCalled();
  });
});
