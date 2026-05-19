import { Module } from '@nestjs/common';
import { TerminalGateway } from './terminal.gateway';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [TerminalGateway],
})
export class TerminalModule {}
