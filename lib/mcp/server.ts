/**
 * MCP Server Handler
 * Integrates MCP protocol into the existing HTTP server via SSE
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { IncomingMessage, ServerResponse } from 'http';
import { MCP_TOOLS, handleMCPToolCall } from './tools';
import { verifyApiToken } from '@/modules/api-token/controller';
import { getSystemSettingsInternal } from '@/modules/system-settings/controller';

/**
 * Get list of enabled MCP tools based on system settings
 */
async function getEnabledMCPTools() {
  try {
    const settings = await getSystemSettingsInternal();
    const enabledToolNames = settings.ai?.mcpTools?.enabled;

    // If no restrictions, return all tools
    if (!enabledToolNames) {
      return MCP_TOOLS;
    }

    // Filter to only enabled tools
    return MCP_TOOLS.filter((tool) => enabledToolNames.includes(tool.name));
  } catch (error) {
    console.error('Error getting MCP tools settings:', error);
    // On error, return all tools (fail open)
    return MCP_TOOLS;
  }
}

/**
 * Check if a tool is enabled
 */
async function isToolEnabled(toolName: string): Promise<boolean> {
  try {
    const settings = await getSystemSettingsInternal();
    const enabledToolNames = settings.ai?.mcpTools?.enabled;

    // If no restrictions, all tools are enabled
    if (!enabledToolNames) {
      return true;
    }

    return enabledToolNames.includes(toolName);
  } catch (error) {
    console.error('Error checking tool enabled status:', error);
    // On error, allow the tool (fail open)
    return true;
  }
}

// Store active transports and their associated tokens
const transports = new Map<string, SSEServerTransport>();
const sessionTokens = new Map<string, string>();

/**
 * Create MCP server instance
 */
function createMCPServer(userId: string, apiToken: string) {
  const server = new Server(
    {
      name: 'crm-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register list tools handler - returns only enabled tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const enabledTools = await getEnabledMCPTools();
    return { tools: enabledTools };
  });

  // Register call tool handler - checks if tool is enabled before execution
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      // Check if tool is enabled
      const enabled = await isToolEnabled(name);
      if (!enabled) {
        return {
          content: [{ type: 'text', text: `Error: Инструмент "${name}" отключён администратором` }],
          isError: true,
        };
      }

      const result = await handleMCPToolCall(
        name,
        (args as Record<string, unknown>) || {},
        userId,
        apiToken
      );
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [{ type: 'text', text: `Error: ${message}` }],
        isError: true,
      };
    }
  });

  return server;
}

/**
 * Handle MCP SSE connection
 * Route: GET /api/mcp/sse
 */
export async function handleMCPSSE(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const url = new URL(req.url || '', `http://${req.headers.host}`);

  // Only handle /api/mcp/sse route
  if (url.pathname !== '/api/mcp/sse') {
    return false;
  }

  // Verify API token
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Authorization header required' }));
    return true;
  }

  const token = authHeader.substring(7);
  const apiToken = await verifyApiToken(token);

  if (!apiToken) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid API token' }));
    return true;
  }

  // Create transport and server
  const transport = new SSEServerTransport('/api/mcp/messages', res);
  const sessionId = Math.random().toString(36).substring(7);
  transports.set(sessionId, transport);
  sessionTokens.set(sessionId, token);

  // Get userId from token - for now use a placeholder since ApiToken doesn't have userId
  // In production, you'd associate tokens with users
  const userId = 'mcp-user';

  const server = createMCPServer(userId, token);

  // Handle connection close
  res.on('close', () => {
    transports.delete(sessionId);
    sessionTokens.delete(sessionId);
  });

  // Connect transport
  await server.connect(transport);

  return true;
}

/**
 * Handle MCP message
 * Route: POST /api/mcp/messages
 */
export async function handleMCPMessage(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const url = new URL(req.url || '', `http://${req.headers.host}`);

  // Only handle /api/mcp/messages route
  if (url.pathname !== '/api/mcp/messages') {
    return false;
  }

  // Get session ID from query
  const sessionId = url.searchParams.get('sessionId');
  if (!sessionId) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Session ID required' }));
    return true;
  }

  const transport = transports.get(sessionId);
  if (!transport) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Session not found' }));
    return true;
  }

  // Read body
  let body = '';
  for await (const chunk of req) {
    body += chunk;
  }

  try {
    await transport.handlePostMessage(req, res, body);
  } catch (error) {
    console.error('MCP message error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }

  return true;
}

/**
 * MCP info endpoint
 * Route: GET /api/mcp
 */
export async function handleMCPInfo(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const url = new URL(req.url || '', `http://${req.headers.host}`);

  if (url.pathname !== '/api/mcp') {
    return false;
  }

  const baseUrl = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`;

  // Always show all tools in info endpoint (for documentation purposes)
  // The actual filtering happens in ListToolsRequestSchema handler
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    name: 'CRM MCP Server',
    version: '1.0.0',
    description: 'MCP сервер для работы с CRM',
    endpoints: {
      sse: `${baseUrl}/api/mcp/sse`,
      messages: `${baseUrl}/api/mcp/messages`,
    },
    tools: MCP_TOOLS.map((t) => ({
      name: t.name,
      description: t.description,
    })),
    authentication: {
      type: 'bearer',
      description: 'Используйте API токен из настроек CRM',
    },
    usage: {
      claudeDesktop: {
        description: 'Добавьте в claude_desktop_config.json:',
        config: {
          mcpServers: {
            crm: {
              command: 'npx',
              args: ['-y', 'mcp-remote', `${baseUrl}/api/mcp/sse`],
              env: {
                MCP_AUTH_TOKEN: '<your-api-token>',
              },
            },
          },
        },
      },
    },
  }, null, 2));

  return true;
}
