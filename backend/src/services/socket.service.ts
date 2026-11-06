import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;

export const initSocket = (server: HTTPServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    },
  });

  io.on('connection', (socket) => {
    // Join branch-specific rooms for multi-branch isolation
    socket.on('join_branch', (branchId: string) => {
      socket.join(`branch_${branchId}`);
    });

    // Join specific table room for live customer updates
    socket.on('join_table', (tableId: string) => {
      socket.join(`table_${tableId}`);
    });

    // Kitchen station rooms
    socket.on('join_kitchen', (branchId: string) => {
      socket.join(`kitchen_${branchId}`);
    });

    // Waiter & staff room
    socket.on('join_waiters', (branchId: string) => {
      socket.join(`waiters_${branchId}`);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer | null => {
  return io;
};

// High-level broadcasting helpers
export const emitOrderToKitchen = (branchId: string, orderData: any): void => {
  if (io) {
    io.to(`kitchen_${branchId}`).emit('new_kitchen_order', orderData);
    io.to(`branch_${branchId}`).emit('order_created', orderData);
  }
};

export const emitWaiterCall = (branchId: string, requestData: any): void => {
  if (io) {
    io.to(`waiters_${branchId}`).emit('waiter_called', requestData);
    io.to(`branch_${branchId}`).emit('waiter_called', requestData);
  }
};

export const emitTableStatusUpdate = (branchId: string, tableId: string, status: string): void => {
  if (io) {
    io.to(`table_${tableId}`).emit('table_status_changed', { tableId, status });
    io.to(`branch_${branchId}`).emit('table_status_changed', { tableId, status });
  }
};

export const emitOrderStatusUpdate = (tableId: string, orderId: string, status: string): void => {
  if (io) {
    io.to(`table_${tableId}`).emit('order_status_updated', { orderId, status });
  }
};

