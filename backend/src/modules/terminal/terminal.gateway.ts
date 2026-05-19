import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Client } from 'ssh2';
import { PrismaService } from '../prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'terminal',
})
@Injectable()
export class TerminalGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private logger = new Logger('TerminalGateway');
  private sshClients = new Map<string, Client>();

  constructor(private prisma: PrismaService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const sshClient = this.sshClients.get(client.id);
    if (sshClient) {
      sshClient.end();
      this.sshClients.delete(client.id);
    }
  }

  @SubscribeMessage('startTerminal')
  async handleStartTerminal(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { vmId: string; username?: string; password?: string },
  ) {
    const { vmId, username: overrideUser, password: overridePassword } = data;
    const vm = await this.prisma.vMInventory.findUnique({
      where: { requestId: vmId },
    });

    if (!vm) {
      client.emit('terminalError', 'VM not found in inventory');
      return;
    }

    // Check if we already have a client for this socket, if so close it
    const existingClient = this.sshClients.get(client.id);
    if (existingClient) {
      existingClient.end();
      this.sshClients.delete(client.id);
    }

    const ssh = new Client();
    this.sshClients.set(client.id, ssh);

    ssh
      .on('ready', () => {
        ssh.shell((err, stream) => {
          if (err) {
            client.emit('terminalError', 'SSH Shell error: ' + err.message);
            return;
          }

          client.emit('terminalReady');

          stream.on('data', (data: Buffer) => {
            client.emit('terminalOutput', data.toString());
          });

          stream.on('close', () => {
            client.disconnect();
          });

          // Clean up old listeners to prevent duplication on reconnect
          client.removeAllListeners('terminalInput');
          client.removeAllListeners('terminalResize');

          client.on('terminalInput', (input: string) => {
            stream.write(input);
          });

          client.on('terminalResize', (size: { cols: number; rows: number }) => {
            stream.setWindow(size.rows, size.cols, 0, 0);
          });
        });
      })
      .on('error', (err) => {
        this.logger.error(`SSH Error for ${vm.ipAddress}: ${err.message}`);
        client.emit('terminalError', 'SSH Connection failed: ' + err.message);
      })
      .connect({
        host: vm.ipAddress || '',
        port: vm.sshPort || 22,
        username: overrideUser || vm.sshUser || 'root',
        password: overridePassword || vm.sshPassword || '',
        readyTimeout: 10000,
      });
  }
}
