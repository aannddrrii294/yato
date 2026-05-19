import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface AuditContext {
  ipAddress: string;
  userAgent: string;
}

@Injectable()
export class AuditContextService {
  private readonly asyncLocalStorage = new AsyncLocalStorage<AuditContext>();

  run(context: AuditContext, callback: () => void) {
    return this.asyncLocalStorage.run(context, callback);
  }

  getContext(): AuditContext | undefined {
    return this.asyncLocalStorage.getStore();
  }
}
