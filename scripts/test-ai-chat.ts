/**
 * Test script for AI chat functionality
 * Run: npx tsx scripts/test-ai-chat.ts
 */

import { streamText, stepCountIs } from 'ai';
import { getAIModel } from '../lib/ai/service';
import { getAITools } from '../lib/ai/tools';
import { connectToDatabase } from '../lib/mongodb';

async function testAIChat() {
  console.log('=== Testing AI Chat ===\n');

  // Connect to database to read settings
  await connectToDatabase();

  // Get model from system settings
  console.log('Loading AI model from settings...');
  const model = await getAIModel();
  console.log('Model loaded');

  const userId = '6930a063a5703dd6e7e0d15c';

  // Get tools
  console.log('Loading tools...');
  const tools = getAITools({ userId });
  console.log('Tools loaded:', Object.keys(tools).length);

  const message = 'Создай задачу с названием Тест123';
  console.log('User message:', message);
  console.log('\n--- Starting stream ---\n');

  try {
    const result = streamText({
      model,
      messages: [{ role: 'user', content: message }],
      tools,
      stopWhen: stepCountIs(5), // Allow up to 5 steps for multi-turn tool calls
      system: `Ты - AI ассистент для CRM системы.
Когда пользователь просит создать задачу — используй инструмент create_task.
Не спрашивай дополнительные детали если они не указаны — создавай задачу сразу.
Отвечай на русском языке.`,
    });

    // Use fullStream to see everything
    console.log('Reading fullStream...');
    let textContent = '';

    for await (const part of result.fullStream) {
      console.log('Part type:', part.type);

      if (part.type === 'text-delta') {
        const delta = (part as any).text || (part as any).textDelta || '';
        if (delta) {
          process.stdout.write(delta);
          textContent += delta;
        }
      } else if (part.type === 'tool-call') {
        console.log('\n[Tool Call]', part.toolName, JSON.stringify((part as any).args || (part as any).input));
      } else if (part.type === 'tool-result') {
        const resultStr = JSON.stringify((part as any).result || part);
        console.log('[Tool Result]', resultStr.substring(0, 300));
      } else if ((part as any).type === 'step-finish' || (part as any).type === 'finish-step') {
        console.log('\n[Step Finish]', JSON.stringify(part));
      } else if (part.type === 'finish') {
        console.log('\n[Finish]', {
          finishReason: part.finishReason,
        });
      }
    }

    console.log('\n\n=== Final Result ===');
    console.log('Text:', textContent || '(no text)');

  } catch (error) {
    console.error('\n\nError:', error);
  }

  process.exit(0);
}

testAIChat().catch(console.error);
