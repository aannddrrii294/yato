import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuditContextService } from '../context/audit-context.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditContextService: AuditContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    const forwarded = request.headers['x-forwarded-for'];
    const ipAddress = (typeof forwarded === 'string' ? forwarded.split(',')[0] : request.ip) || request.connection.remoteAddress;
    const userAgent = request.headers['user-agent'] || 'Unknown';

    return new Observable((subscriber) => {
      this.auditContextService.run({ ipAddress, userAgent }, () => {
        next.handle().subscribe(subscriber);
      });
    });
  }
}
