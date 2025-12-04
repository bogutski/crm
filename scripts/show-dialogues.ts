import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local first
config({ path: resolve(process.cwd(), '.env.local') });

import { connectDB } from '../lib/mongodb';
import { AIDialogue } from '../modules/ai-dialogue/model';

async function showDialogues() {
  try {
    await connectDB();

    console.log('\n=== AI Assistant Dialogues (ai_assistant_dialogues) ===\n');

    const dialogues = await AIDialogue.find().sort({ createdAt: -1 }).limit(10);

    if (dialogues.length === 0) {
      console.log('📭 No dialogues found in database');
      console.log('\nThis is expected if you haven\'t sent any messages yet.');
      console.log('Try sending a message in the AI chat to create your first dialogue!');
    } else {
      console.log(`📊 Found ${dialogues.length} dialogue(s):\n`);

      for (const dialogue of dialogues) {
        console.log('─'.repeat(60));
        console.log(`ID: ${dialogue._id}`);
        console.log(`Title: ${dialogue.title}`);
        console.log(`Status: ${dialogue.status}`);
        console.log(`Provider: ${dialogue.metadata.provider} (${dialogue.metadata.model})`);
        console.log(`Messages: ${dialogue.messages.length}`);
        console.log(`Total Tokens: ${dialogue.metadata.totalTokens}`);
        console.log(`Created: ${dialogue.createdAt.toLocaleString()}`);
        console.log(`Updated: ${dialogue.updatedAt.toLocaleString()}`);

        if (dialogue.messages.length > 0) {
          console.log('\n💬 Messages:');
          dialogue.messages.forEach((msg, idx) => {
            const preview = msg.content.substring(0, 100);
            const truncated = msg.content.length > 100 ? '...' : '';
            console.log(`  ${idx + 1}. [${msg.role}] ${preview}${truncated}`);
            if (msg.metadata?.tokens) {
              console.log(`     Tokens: ${msg.metadata.tokens.total}`);
            }
          });
        }
        console.log();
      }

      // Статистика
      const total = await AIDialogue.countDocuments();
      const active = await AIDialogue.countDocuments({ status: 'active' });
      const completed = await AIDialogue.countDocuments({ status: 'completed' });

      console.log('─'.repeat(60));
      console.log('📈 Statistics:');
      console.log(`Total dialogues: ${total}`);
      console.log(`Active: ${active}`);
      console.log(`Completed: ${completed}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

showDialogues();
