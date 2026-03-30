import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });

  const PORT = 3000;

  // In-memory store for messages (for demo)
  const messages: any[] = [];
  const clients = new Map<string, WebSocket>();

  wss.on('connection', (ws) => {
    let userId: string | null = null;

    ws.on('message', (data) => {
      let message;
      try {
        message = JSON.parse(data.toString());
      } catch (e) {
        console.error('Error parsing WebSocket message:', e);
        return;
      }

      if (message.type === 'auth') {
        userId = message.userId;
        if (userId) clients.set(userId, ws);
        // Send existing messages for this user
        const userMessages = messages.filter(m => m.senderId === userId || m.receiverId === userId);
        ws.send(JSON.stringify({ type: 'init', messages: userMessages }));
      } else if (message.type === 'chat') {
        const newMessage = {
          id: `msg_${Date.now()}`,
          senderId: userId,
          receiverId: message.receiverId,
          content: message.content,
          timestamp: Date.now()
        };
        messages.push(newMessage);

        // Send to receiver if online
        const receiverWs = clients.get(message.receiverId);
        if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
          receiverWs.send(JSON.stringify({ type: 'chat', message: newMessage }));
        }
        // Send back to sender for confirmation
        ws.send(JSON.stringify({ type: 'chat', message: newMessage }));
      } else if (message.type === 'code-sync') {
        // Broadcast code changes to other clients in the same assignment
        wss.clients.forEach(client => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'code-sync', assignmentId: message.assignmentId, files: message.files }));
          }
        });
      }
    });

    ws.on('close', () => {
      if (userId) clients.delete(userId);
    });
  });

  // API routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
