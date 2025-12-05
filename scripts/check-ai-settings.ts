import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local
config({ path: resolve(__dirname, '../.env.local') });

import { connectToDatabase } from '../lib/mongodb';
import SystemSettings from '../modules/system-settings/model';

async function checkAISettings() {
  try {
    await connectToDatabase();

    const settings = await SystemSettings.findOne();

    if (!settings) {
      console.log('❌ System settings not found in database');
      process.exit(1);
    }

    console.log('\n=== AI Settings ===\n');

    if (!settings.ai) {
      console.log('❌ AI settings not configured');
      process.exit(1);
    }

    console.log('Active Provider:', settings.ai.activeProvider || '(not set)');
    console.log('\nProviders:');

    const providers = ['openai', 'anthropic', 'google'] as const;

    for (const provider of providers) {
      const config = settings.ai.providers[provider];
      if (config) {
        console.log(`\n${provider}:`);
        console.log('  - Enabled:', config.enabled);
        console.log('  - Model:', config.model);
        console.log('  - API Key:', config.apiKey ? `${config.apiKey.substring(0, 10)}...` : '(not set)');
      }
    }

    // Проверка активного провайдера
    if (settings.ai.activeProvider) {
      const activeConfig = settings.ai.providers[settings.ai.activeProvider];
      console.log('\n=== Active Provider Check ===');

      if (!activeConfig) {
        console.log('❌ Active provider config not found');
      } else if (!activeConfig.enabled) {
        console.log('❌ Active provider is not enabled');
      } else if (!activeConfig.apiKey) {
        console.log('❌ Active provider API key is not set');
      } else {
        console.log('✅ Active provider is properly configured');
      }
    } else {
      console.log('\n❌ No active provider set');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error checking AI settings:', error);
    process.exit(1);
  }
}

checkAISettings();
