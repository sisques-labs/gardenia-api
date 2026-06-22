import type { Request, Response } from 'express';

import { CurrentUserPayload } from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { McpServerFactory } from '../services/mcp-server.factory';
import { McpController } from './mcp.controller';

const mockTransport = {
  handleRequest: jest.fn(),
  close: jest.fn(),
};

jest.mock('@modelcontextprotocol/sdk/server/streamableHttp.js', () => ({
  StreamableHTTPServerTransport: jest
    .fn()
    .mockImplementation(() => mockTransport),
}));

const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const user = {
  userId: '660e8400-e29b-41d4-a716-446655440001',
  email: 'user@example.com',
} as CurrentUserPayload;

describe('McpController', () => {
  let controller: McpController;
  let factory: jest.Mocked<McpServerFactory>;
  let spaceContext: jest.Mocked<SpaceContext>;
  let server: { connect: jest.Mock; close: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    server = { connect: jest.fn(), close: jest.fn() };
    factory = {
      create: jest.fn().mockReturnValue(server),
    } as unknown as jest.Mocked<McpServerFactory>;
    spaceContext = {
      require: jest.fn().mockReturnValue(SPACE_ID),
    } as unknown as jest.Mocked<SpaceContext>;
    controller = new McpController(factory, spaceContext);
  });

  describe('handleRequest()', () => {
    it('creates a per-request server bound to the user/space and wires the transport', async () => {
      const req = { body: { jsonrpc: '2.0' } } as unknown as Request;
      const res = { on: jest.fn() } as unknown as Response;

      await controller.handleRequest(req, res, user);

      expect(spaceContext.require).toHaveBeenCalledTimes(1);
      expect(factory.create).toHaveBeenCalledWith({
        userId: user.userId,
        email: user.email,
        spaceId: SPACE_ID,
      });
      expect(server.connect).toHaveBeenCalledWith(mockTransport);
      expect(mockTransport.handleRequest).toHaveBeenCalledWith(
        req,
        res,
        req.body,
      );
      expect(res.on).toHaveBeenCalledWith('close', expect.any(Function));
    });

    it('closes the transport and server when the response closes', async () => {
      const req = { body: {} } as unknown as Request;
      let closeHandler: () => void = () => undefined;
      const res = {
        on: jest.fn((event: string, cb: () => void) => {
          if (event === 'close') closeHandler = cb;
        }),
      } as unknown as Response;

      await controller.handleRequest(req, res, user);
      closeHandler();

      expect(mockTransport.close).toHaveBeenCalledTimes(1);
      expect(server.close).toHaveBeenCalledTimes(1);
    });
  });

  describe('unsupported methods', () => {
    it('responds 405 for GET', () => {
      const json = jest.fn();
      const res = {
        status: jest.fn().mockReturnValue({ json }),
      } as unknown as Response;

      controller.handleGet(res);

      expect(res.status).toHaveBeenCalledWith(405);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ jsonrpc: '2.0' }),
      );
    });

    it('responds 405 for DELETE', () => {
      const json = jest.fn();
      const res = {
        status: jest.fn().mockReturnValue({ json }),
      } as unknown as Response;

      controller.handleDelete(res);

      expect(res.status).toHaveBeenCalledWith(405);
    });
  });
});
