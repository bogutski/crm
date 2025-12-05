/**
 * Test script for AI chat via Socket.IO
 * Run: npx tsx scripts/test-ai-socket.ts
 */

import { io, Socket } from 'socket.io-client';
import mongoose from 'mongoose';

// Hardcoded for testing - same as .env.local
const MONGODB_URI = 'mongodb://crmproto_user:Xk9mPv3nQwL7rT2s@localhost:27017/crmproto?authSource=crmproto';

const SERVER_URL = 'http://localhost:3000';

interface TestResult {
  step: string;
  success: boolean;
  details: string;
  duration?: number;
}

const results: TestResult[] = [];

function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function logEvent(event: string, data: any) {
  const preview = JSON.stringify(data).substring(0, 200);
  log(`EVENT: ${event} -> ${preview}${JSON.stringify(data).length > 200 ? '...' : ''}`);
}

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(MONGODB_URI);
  log('Connected to MongoDB');
}

async function getTestUser() {
  await connectDB();
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database not connected');
  }
  const user = await db.collection('users').findOne({});
  if (!user) {
    throw new Error('No user found. Run seed script first.');
  }
  return user;
}

function createSocketClient(sessionCookie: string): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const socket = io(SERVER_URL, {
      path: '/api/socket',
      transports: ['websocket', 'polling'],
      withCredentials: true,
      extraHeaders: {
        Cookie: sessionCookie,
      },
      timeout: 10000,
    });

    socket.on('connect', () => {
      log('Socket connected: ' + socket.id);
      resolve(socket);
    });

    socket.on('connect_error', (error) => {
      log('Socket connection error: ' + error.message);
      reject(error);
    });

    setTimeout(() => {
      if (!socket.connected) {
        reject(new Error('Socket connection timeout'));
      }
    }, 10000);
  });
}

async function testAIMessage(
  socket: Socket,
  dialogueId: string | null,
  message: string,
  expectedToolCalls?: string[]
): Promise<{ dialogueId: string; response: string; toolCalls: any[] }> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let receivedDialogueId = dialogueId;
    let fullResponse = '';
    const toolCalls: any[] = [];
    const toolResults: Map<string, any> = new Map();
    let streamStarted = false;
    let streamEnded = false;

    const timeout = setTimeout(() => {
      log('TIMEOUT waiting for response');
      reject(new Error('Timeout waiting for AI response'));
    }, 60000);

    // Event handlers
    const handleStreamStart = (data: { dialogueId: string }) => {
      logEvent('ai:stream:start', data);
      streamStarted = true;
      receivedDialogueId = data.dialogueId;

      results.push({
        step: 'Stream Start',
        success: true,
        details: `Dialogue ID: ${data.dialogueId}`,
        duration: Date.now() - startTime,
      });
    };

    const handleStreamChunk = (data: { dialogueId: string; chunk: string }) => {
      // Don't log every chunk, just accumulate
      fullResponse += data.chunk;
    };

    const handleToolCall = (data: { dialogueId: string; toolCallId: string; toolName: string; args: any }) => {
      logEvent('ai:tool:call', data);
      toolCalls.push({
        id: data.toolCallId,
        name: data.toolName,
        args: data.args,
        status: 'running',
      });
    };

    const handleToolResult = (data: { dialogueId: string; toolCallId: string; result: any; error?: string }) => {
      logEvent('ai:tool:result', { ...data, result: '...(truncated)' });
      toolResults.set(data.toolCallId, data.result);

      // Update tool call status
      const tc = toolCalls.find(t => t.id === data.toolCallId);
      if (tc) {
        tc.status = data.error ? 'error' : 'completed';
        tc.result = data.result;
        tc.error = data.error;
      }
    };

    const handleStreamEnd = (data: { dialogueId: string; fullMessage: string }) => {
      logEvent('ai:stream:end', { dialogueId: data.dialogueId, messageLength: data.fullMessage?.length });
      streamEnded = true;
      fullResponse = data.fullMessage;

      clearTimeout(timeout);
      cleanup();

      results.push({
        step: 'Stream End',
        success: true,
        details: `Response length: ${fullResponse.length}, Tool calls: ${toolCalls.length}`,
        duration: Date.now() - startTime,
      });

      // Check expected tool calls
      if (expectedToolCalls) {
        const actualToolNames = toolCalls.map(t => t.name);
        const allFound = expectedToolCalls.every(name => actualToolNames.includes(name));
        results.push({
          step: 'Tool Calls Validation',
          success: allFound,
          details: `Expected: [${expectedToolCalls.join(', ')}], Got: [${actualToolNames.join(', ')}]`,
        });
      }

      resolve({
        dialogueId: receivedDialogueId!,
        response: fullResponse,
        toolCalls,
      });
    };

    const handleStreamError = (data: { dialogueId: string; error: string }) => {
      logEvent('ai:stream:error', data);
      clearTimeout(timeout);
      cleanup();

      results.push({
        step: 'Stream Error',
        success: false,
        details: data.error,
        duration: Date.now() - startTime,
      });

      reject(new Error(data.error));
    };

    const cleanup = () => {
      socket.off('ai:stream:start', handleStreamStart);
      socket.off('ai:stream:chunk', handleStreamChunk);
      socket.off('ai:stream:end', handleStreamEnd);
      socket.off('ai:stream:error', handleStreamError);
      socket.off('ai:tool:call', handleToolCall);
      socket.off('ai:tool:result', handleToolResult);
    };

    // Register handlers
    socket.on('ai:stream:start', handleStreamStart);
    socket.on('ai:stream:chunk', handleStreamChunk);
    socket.on('ai:stream:end', handleStreamEnd);
    socket.on('ai:stream:error', handleStreamError);
    socket.on('ai:tool:call', handleToolCall);
    socket.on('ai:tool:result', handleToolResult);

    // Send message
    log(`Sending message: "${message}"`);
    socket.emit('ai:message:send', {
      dialogueId: dialogueId || undefined,
      message,
    });
  });
}

async function authenticateAndGetSession(): Promise<string> {
  // Get user from DB
  const user = await getTestUser();
  log(`Using user: ${user.email} (${user.name})`);

  // Create a session via API
  const response = await fetch(`${SERVER_URL}/api/auth/test-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: user._id.toString() }),
  });

  if (!response.ok) {
    // Try direct socket auth with user ID in headers
    log('No test-session endpoint, using direct user ID auth');
    return `userId=${user._id.toString()}`;
  }

  const cookies = response.headers.get('set-cookie');
  return cookies || '';
}

async function runTests() {
  log('=== AI Chat Socket.IO Tests ===\n');

  try {
    // Get test user
    const user = await getTestUser();
    log(`Test user: ${user.email} (ID: ${user._id})`);

    let dialogueId: string | null = null;

    // Connect socket
    log('\n--- Connecting Socket.IO ---');
    const socket = io(SERVER_URL, {
      path: '/api/socket',
      transports: ['websocket', 'polling'],
      timeout: 10000,
    });

    await new Promise<void>((resolve, reject) => {
      socket.on('connect', () => {
        log(`Socket connected: ${socket.id}`);
        resolve();
      });
      socket.on('connect_error', (err) => {
        log(`Socket error: ${err.message}`);
        reject(err);
      });
      setTimeout(() => reject(new Error('Connection timeout')), 10000);
    });

    // Authenticate
    log('\n--- Authenticating ---');
    await new Promise<void>((resolve, reject) => {
      socket.on('connection:authenticated', (data: any) => {
        log(`Authenticated: ${JSON.stringify(data)}`);
        resolve();
      });
      socket.on('error', (err: any) => {
        log(`Auth error: ${JSON.stringify(err)}`);
        reject(new Error(err.message || 'Auth failed'));
      });

      // Send auth with userId as token
      socket.emit('auth:login', { token: user._id.toString() }, (response: any) => {
        log(`Auth callback: ${JSON.stringify(response)}`);
        if (response?.success) {
          resolve();
        }
      });

      setTimeout(() => reject(new Error('Auth timeout')), 10000);
    });

    // Test 1: First question about Franey contacts
    log('\n--- Test 1: Search contacts Franey ---');
    const test1 = await testAIMessage(
      socket,
      dialogueId,
      'какие сделки и на какую сумму есть у контакта Franey',
      ['search_contacts', 'search_opportunities']
    );

    dialogueId = test1.dialogueId;
    log(`\nResponse preview: ${test1.response.substring(0, 300)}...`);
    log(`Tool calls made: ${test1.toolCalls.map(t => t.name).join(', ')}`);

    // Wait a bit between messages
    await new Promise(r => setTimeout(r, 2000));

    // Test 2: Follow-up about manager
    log('\n--- Test 2: Follow-up about manager for Darrel ---');
    const test2 = await testAIMessage(
      socket,
      dialogueId,
      'дай информацию о менеджере который ведёт Darrel',
      ['get_user_details'] // Should NOT need search_contacts again!
    );

    log(`\nResponse preview: ${test2.response.substring(0, 300)}...`);
    log(`Tool calls made: ${test2.toolCalls.map(t => t.name).join(', ')}`);

    // Check if it avoided redundant search_contacts
    const redundantSearch = test2.toolCalls.filter(t => t.name === 'search_contacts');
    if (redundantSearch.length > 0) {
      results.push({
        step: 'Context Retention Check',
        success: false,
        details: `AI made redundant search_contacts call instead of using context from previous response`,
      });
    } else {
      results.push({
        step: 'Context Retention Check',
        success: true,
        details: 'AI correctly used context from previous response',
      });
    }

    // Cleanup
    socket.disconnect();

    // Print results
    log('\n=== Test Results ===');
    for (const result of results) {
      const status = result.success ? '✅' : '❌';
      const duration = result.duration ? ` (${result.duration}ms)` : '';
      log(`${status} ${result.step}${duration}: ${result.details}`);
    }

    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    log(`\nTotal: ${passed} passed, ${failed} failed`);

  } catch (error) {
    log(`\nTest error: ${error}`);
    console.error(error);
  }

  process.exit(0);
}

runTests().catch(console.error);
