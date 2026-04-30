import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MatchGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRound')
  handleJoinRound(client: Socket, roundId: string) {
    client.join(`round_${roundId}`);
    console.log(`Client ${client.id} joined round: ${roundId}`);
  }

  broadcastMatchUpdate(roundId: string, match: any) {
    this.server.to(`round_${roundId}`).emit('matchUpdated', match);
  }
}
