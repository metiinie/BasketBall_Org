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

  handleConnection(client: Socket) {}

  handleDisconnect(client: Socket) {}

  @SubscribeMessage('joinRound')
  handleJoinRound(client: Socket, roundId: string) {
    client.join(`round_${roundId}`);
  }

  broadcastMatchUpdate(roundId: string, match: any) {
    this.server.to(`round_${roundId}`).emit('matchUpdated', match);
  }

  broadcastMatchDelete(roundId: string, matchId: string) {
    this.server.to(`round_${roundId}`).emit('matchDeleted', matchId);
  }
}
