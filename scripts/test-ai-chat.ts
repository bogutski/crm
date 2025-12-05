/**
 * Test script for AI chat functionality
 * Run: npx tsx scripts/test-ai-chat.ts
 */

import { streamText, stepCountIs } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { getAITools } from '../lib/ai/tools';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

async function testAIChat() {
  console.log('=== Testing AI Chat ===\n');

  const openai = createOpenAI({
    apiKey: OPENAI_API_KEY,
  });

  const model = openai('gpt-4o-mini');
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
        console.log('\n[Tool Call]', part.toolName, JSON.stringify(part.args));
      } else if (part.type === 'tool-result') {
        const resultStr = JSON.stringify((part as any).result || part);
        console.log('[Tool Result]', resultStr.substring(0, 300));
      } else if (part.type === 'step-finish' || part.type === 'finish-step') {
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
}

testAIChat().catch(console.error);
