import { ArgumentsHost } from '@nestjs/common';
import type {
  RpcArgumentsHost,
  WsArgumentsHost,
} from '@nestjs/common/interfaces';
import { ThrottlerException } from '@nestjs/throttler';
import { ThrottlerExceptionFilter } from './throttler-exception.filter';

describe('ThrottlerExceptionFilter', () => {
  let filter: ThrottlerExceptionFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new ThrottlerExceptionFilter();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });

    mockHost = {
      switchToHttp: () => ({
        getResponse: () => ({ status: mockStatus }),
        getRequest: () => ({ url: '/videos/abc123/view', method: 'POST' }),
      }),
      getArgs: () => [],
      getArgByIndex: () => null,
      switchToRpc: () => ({}) as unknown as RpcArgumentsHost,
      switchToWs: () => ({}) as unknown as WsArgumentsHost,
      getType: () => 'http',
    } as unknown as ArgumentsHost;
  });

  // SI-05.3 — fecha a lacuna do Error Catalog: sem este filtro o 429 seria o
  // único erro da API sem o campo `error` do envelope de phase-02-auth/TD-07.
  it('maps ThrottlerException to 429 in the shared error envelope', () => {
    filter.catch(new ThrottlerException(), mockHost);

    expect(mockStatus).toHaveBeenCalledWith(429);
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: 429,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests',
    });
  });
});
