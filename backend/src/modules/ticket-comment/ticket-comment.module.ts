import { Module } from '@nestjs/common';
import { TicketCommentController } from './ticket-comment.controller';
import { TicketCommentService } from './ticket-comment.service';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [TicketCommentController],
  providers: [TicketCommentService],
  exports: [TicketCommentService]
})
export class TicketCommentModule {}
