import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MutationResponseGraphQLMapper } from '@sisques-labs/nestjs-kit';

import { USER_READ_REPOSITORY } from '@contexts/users/domain/repositories/read/user-read.repository';
import { USER_WRITE_REPOSITORY } from '@contexts/users/domain/repositories/write/user-write.repository';
import { UserTypeOrmEntity } from '@contexts/users/infrastructure/persistence/typeorm/entities/user.entity';
import { UserBuilder } from '@contexts/users/domain/builders/user.builder';

import { UsersModule } from './users.module';

const mockRepository = {
  findOne: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(),
};

const mockMutationResponseGraphQLMapper = {
  toResponseDto: jest.fn(),
};

async function createTestModule(): Promise<TestingModule> {
  return Test.createTestingModule({
    imports: [ConfigModule.forRoot({ isGlobal: true }), UsersModule],
  })
    .overrideProvider(getRepositoryToken(UserTypeOrmEntity))
    .useValue(mockRepository)
    .overrideProvider(MutationResponseGraphQLMapper)
    .useValue(mockMutationResponseGraphQLMapper)
    .compile();
}

describe('UsersModule', () => {
  it('should compile the module with mocked TypeORM dependencies', async () => {
    const moduleRef = await createTestModule();
    expect(moduleRef).toBeDefined();
  });

  it('should resolve USER_WRITE_REPOSITORY token', async () => {
    const moduleRef = await createTestModule();
    const writeRepo = moduleRef.get(USER_WRITE_REPOSITORY, { strict: false });
    expect(writeRepo).toBeDefined();
  });

  it('should resolve USER_READ_REPOSITORY token', async () => {
    const moduleRef = await createTestModule();
    const readRepo = moduleRef.get(USER_READ_REPOSITORY, { strict: false });
    expect(readRepo).toBeDefined();
  });

  it('should resolve UserBuilder', async () => {
    const moduleRef = await createTestModule();
    const builder = moduleRef.get(UserBuilder, { strict: false });
    expect(builder).toBeInstanceOf(UserBuilder);
  });
});
