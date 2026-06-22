import { AccountBuilder } from '@contexts/auth/domain/builders/account.builder';
import { AccountViewModel } from '@contexts/auth/domain/view-models/account.view-model';
import { AccountRestMapper } from './account.mapper';

const ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const NOW = new Date('2026-01-01T00:00:00.000Z');

const buildViewModel = (): AccountViewModel =>
  new AccountViewModel({
    id: ID,
    userId: USER_ID,
    email: 'user@example.com',
    createdAt: NOW,
    updatedAt: NOW,
  });

describe('AccountRestMapper', () => {
  let mapper: AccountRestMapper;

  beforeEach(() => {
    mapper = new AccountRestMapper(new AccountBuilder());
  });

  it('maps the account view model to a REST response dto', () => {
    const dto = mapper.toViewModel(buildViewModel());

    expect(dto.id).toBe(ID);
    expect(dto.userId).toBe(USER_ID);
    expect(dto.email).toBe('user@example.com');
    expect(dto.createdAt).toEqual(NOW);
    expect(dto.updatedAt).toEqual(NOW);
  });
});
