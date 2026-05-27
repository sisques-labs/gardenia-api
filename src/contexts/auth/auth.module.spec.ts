import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthModule } from './auth.module';
import { AccountEntity } from './infrastructure/persistence/typeorm/account.entity';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { ACCOUNT_WRITE_REPOSITORY } from './domain/repositories/write/account-write.repository';
import { ACCOUNT_READ_REPOSITORY } from './domain/repositories/read/account-read.repository';
import { AccountBuilder } from './domain/builders/account.builder';

const mockRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
};

const mockJwtStrategy = {
  validate: jest.fn(),
};

async function createTestModule(): Promise<TestingModule> {
  return Test.createTestingModule({
    imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule],
  })
    .overrideProvider(getRepositoryToken(AccountEntity))
    .useValue(mockRepository)
    .overrideProvider(JwtStrategy)
    .useValue(mockJwtStrategy)
    .compile();
}

describe('AuthModule', () => {
  it('should compile the module with mocked TypeORM and JWT dependencies', async () => {
    const moduleRef = await createTestModule();
    expect(moduleRef).toBeDefined();
  });

  it('should resolve ACCOUNT_WRITE_REPOSITORY token', async () => {
    const moduleRef = await createTestModule();
    const writeRepo = moduleRef.get(ACCOUNT_WRITE_REPOSITORY, {
      strict: false,
    });
    expect(writeRepo).toBeDefined();
  });

  it('should resolve ACCOUNT_READ_REPOSITORY token', async () => {
    const moduleRef = await createTestModule();
    const readRepo = moduleRef.get(ACCOUNT_READ_REPOSITORY, { strict: false });
    expect(readRepo).toBeDefined();
  });

  it('should resolve AccountBuilder', async () => {
    const moduleRef = await createTestModule();
    const builder = moduleRef.get(AccountBuilder, { strict: false });
    expect(builder).toBeInstanceOf(AccountBuilder);
  });
});
