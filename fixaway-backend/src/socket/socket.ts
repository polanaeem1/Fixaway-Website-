import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { prisma } from '../lib/prisma';

export const initSocket = (io: Server) => {
  // Middleware: authenticate socket connections
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = verifyAccessToken(token);
      (socket as any).user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    console.log(`[Socket] Connected: ${user.userId} (${user.role})`);

    // Join personal room
    socket.join(`user:${user.userId}`);
    
    // Join role room
    if (user.role === 'TECHNICIAN') {
      socket.join('role:TECHNICIAN');
    }

    // Join order room
    socket.on('join_order', (orderId: string) => {
      socket.join(`order:${orderId}`);
      console.log(`[Socket] ${user.userId} joined order room: ${orderId}`);
    });

    socket.on('leave_order', (orderId: string) => {
      socket.leave(`order:${orderId}`);
    });

    // Real-time chat
    socket.on('send_message', async ({ orderId, content, mediaUrl }: any) => {
      try {
        const message = await prisma.chatMessage.create({
          data: { orderId, senderId: user.userId, content: content || '', mediaUrl },
          include: { sender: { select: { id: true, name: true, avatarUrl: true, role: true } } },
        });
        io.to(`order:${orderId}`).emit('message_received', message);
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Technician location update
    socket.on('update_location', async ({ lat, lng }: any) => {
      if (user.role !== 'TECHNICIAN') return;
      await prisma.technicianProfile.update({
        where: { userId: user.userId },
        data: { lat, lng },
      });
      // Broadcast to any orders this technician is part of
      const activeOrders = await prisma.order.findMany({
        where: { technicianId: user.userId, status: { in: ['CONFIRMED', 'TECHNICIAN_EN_ROUTE', 'IN_PROGRESS'] } },
      });
      activeOrders.forEach((order) => {
        io.to(`order:${order.id}`).emit('technician_location', { lat, lng, technicianId: user.userId });
      });
    });

    // Online/offline toggle
    socket.on('set_online', async (isOnline: boolean) => {
      if (user.role !== 'TECHNICIAN') return;
      await prisma.technicianProfile.update({ where: { userId: user.userId }, data: { isOnline } });
      socket.emit('status_updated', { isOnline });
    });

    socket.on('disconnect', async () => {
      console.log(`[Socket] Disconnected: ${user.userId}`);
      if (user.role === 'TECHNICIAN') {
        await prisma.technicianProfile.update({
          where: { userId: user.userId },
          data: { isOnline: false },
        }).catch(() => {});
      }
    });
  });
};

// Helper: push notification to a user's personal socket room
export const notifyUser = (io: Server, userId: string, event: string, data: any) => {
  io.to(`user:${userId}`).emit(event, data);
};
