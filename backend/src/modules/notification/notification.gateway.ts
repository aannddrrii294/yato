import { 
  WebSocketGateway, 
  WebSocketServer, 
  OnGatewayConnection,
  OnGatewayDisconnect 
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/notifications',
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to Notification WebSocket: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @OnEvent('notification.finished')
  handleNotificationFinishedEvent(payload: { userId: string; success: boolean; message: string; type: string }) {
    this.logger.log(`Broadcasting 'notification.finished' event for user ${payload.userId}`);
    
    // In a real app, you'd target a specific user room. Here we broadcast to everyone on this namespace.
    this.server.emit('notification_update', {
      event: 'notification.finished',
      data: payload,
      timestamp: new Date().toISOString(),
    });
  }
}
