import { createServer } from 'http';
import { parse } from 'url';
import { config } from 'dotenv';

// Загружаем переменные окружения ДО всех остальных импортов
config({ path: '.env.local' });
config({ path: '.env' });

import next from 'next';
import { Server as SocketIOServer } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  // Динамически импортируем handlers после подготовки next
  // чтобы env переменные были доступны
  const { initSocketHandlers } = await import('./lib/socket/handlers');
  const { handleMCPSSE, handleMCPMessage, handleMCPInfo } = await import('./lib/mcp');

  const httpServer = createServer(async (req, res) => {
    // Handle MCP endpoints
    if (req.url?.startsWith('/api/mcp')) {
      try {
        // MCP info endpoint
        if (req.method === 'GET' && req.url === '/api/mcp') {
          await handleMCPInfo(req, res);
          return;
        }

        // MCP SSE endpoint
        if (req.method === 'GET' && req.url?.startsWith('/api/mcp/sse')) {
          await handleMCPSSE(req, res);
          return;
        }

        // MCP messages endpoint
        if (req.method === 'POST' && req.url?.startsWith('/api/mcp/messages')) {
          await handleMCPMessage(req, res);
          return;
        }
      } catch (error) {
        console.error('MCP error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'MCP server error' }));
        return;
      }
    }

    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(httpServer, {
    path: '/api/socket',
    cors: {
      origin: dev ? '*' : process.env.NEXT_PUBLIC_APP_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Сохраняем io в глобальной переменной для доступа из API routes
  (global as any).io = io;

  // Инициализируем обработчики событий
  initSocketHandlers(io);

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.IO server running on /api/socket`);
    console.log(`> MCP server running on /api/mcp`);
  });
});
