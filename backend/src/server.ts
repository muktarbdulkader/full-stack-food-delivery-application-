import http from 'http';
import app from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { initSocket } from './services/socket.service';

const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    
    const server = http.createServer(app);
    initSocket(server);
    
    server.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
      console.log(`Environment: ${env.nodeEnv}`);
      console.log(`Socket.IO real-time engine active`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
