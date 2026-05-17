import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

let socket: Socket | null = null;

export function getSocket(token?: string): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });
  } else if (token && (socket as any).auth?.token !== token) {
    (socket as any).auth = { token };
    socket.disconnect().connect();
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinOrderRoom(orderId: string) {
  const s = getSocket();
  s.emit('join_order', orderId);
}

export function leaveOrderRoom(orderId: string) {
  const s = getSocket();
  s.emit('leave_order', orderId);
}

export function broadcastLocation(lat: number, lng: number, orderId: string) {
  const s = getSocket();
  s.emit('location_update', { lat, lng, orderId });
}

export { socket };
