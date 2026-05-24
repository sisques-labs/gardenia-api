import { EventBus } from '@nestjs/cqrs';
import { LoginUserCommandHandler } from './login-user.handler';
import { LoginUserCommand } from './login-user.command';
import { TokenService } from '../../services/token.service';

describe('LoginUserCommandHandler', () => {
  let handler: LoginUserCommandHandler;
  let tokenService: jest.Mocked<TokenService>;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    tokenService = {
      sign: jest.fn().mockReturnValue('jwt-token'),
    } as unknown as jest.Mocked<TokenService>;

    eventBus = {
      publish: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new LoginUserCommandHandler(eventBus, tokenService);
  });

  it('should not have QueryBus in constructor (only eventBus and tokenService)', () => {
    const constructorLength = LoginUserCommandHandler.length;
    // Constructor takes 2 params: eventBus + tokenService (no QueryBus)
    expect(constructorLength).toBe(2);
  });

  it('should return only { accessToken } — no user field', async () => {
    const command = new LoginUserCommand({
      userId: '550e8400-e29b-41d4-a716-446655440000',
      email: 'test@example.com',
    });

    const result = await handler.execute(command);

    expect(result).toEqual({ accessToken: 'jwt-token' });
    expect(result).not.toHaveProperty('user');
  });

  it('should call tokenService.sign with userId and email primitives', async () => {
    const command = new LoginUserCommand({
      userId: '550e8400-e29b-41d4-a716-446655440000',
      email: 'test@example.com',
    });

    await handler.execute(command);

    expect(tokenService.sign).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440000',
      'test@example.com',
    );
  });
});
