import { NextRequest, NextResponse } from 'next/server';
import { apiAuth } from '@/lib/api-auth';
import { getSystemSettingsInternal, updateSystemSettings } from '@/modules/system-settings/controller';
import { getToolsByCategory, AI_TOOLS_REGISTRY } from '@/lib/ai/tools';

// GET /api/system-settings/ai/tools - Get all tools with their status
export async function GET(request: NextRequest) {
  const authResult = await apiAuth(request);
  if (!authResult) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settings = await getSystemSettingsInternal();
    const enabledTools = settings.ai?.tools?.enabled;
    const toolsByCategory = getToolsByCategory();

    // Mark tools as enabled/disabled based on settings
    const mapEnabled = (tools: typeof toolsByCategory.analytics) => {
      return tools.map((t) => ({
        ...t,
        enabled: !enabledTools || enabledTools.includes(t.name),
      }));
    };

    return NextResponse.json({
      tools: {
        analytics: mapEnabled(toolsByCategory.analytics),
        actions: mapEnabled(toolsByCategory.actions as typeof toolsByCategory.analytics),
      },
      // If enabled is undefined, all tools are enabled
      allEnabled: !enabledTools,
    });
  } catch (error) {
    console.error('Error fetching AI tools settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI tools settings' },
      { status: 500 }
    );
  }
}

// PATCH /api/system-settings/ai/tools - Update enabled tools
export async function PATCH(request: NextRequest) {
  const authResult = await apiAuth(request);
  if (!authResult) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { enabled } = body;

    // Validate tool names
    if (enabled !== undefined && enabled !== null) {
      if (!Array.isArray(enabled)) {
        return NextResponse.json(
          { error: 'enabled must be an array of tool names' },
          { status: 400 }
        );
      }

      const validTools = Object.keys(AI_TOOLS_REGISTRY);
      const invalidTools = enabled.filter((t: string) => !validTools.includes(t));

      if (invalidTools.length > 0) {
        return NextResponse.json(
          { error: `Invalid tool names: ${invalidTools.join(', ')}` },
          { status: 400 }
        );
      }
    }

    const settings = await getSystemSettingsInternal();

    // Update tools settings
    const updatedSettings = await updateSystemSettings({
      ai: {
        ...settings.ai,
        tools: enabled === null ? undefined : { enabled },
      },
    }, authResult.userId);

    const enabledTools = updatedSettings.ai?.tools?.enabled;
    const toolsByCategory = getToolsByCategory();

    const mapEnabled = (tools: typeof toolsByCategory.analytics) => {
      return tools.map((t) => ({
        ...t,
        enabled: !enabledTools || enabledTools.includes(t.name),
      }));
    };

    return NextResponse.json({
      tools: {
        analytics: mapEnabled(toolsByCategory.analytics),
        actions: mapEnabled(toolsByCategory.actions as typeof toolsByCategory.analytics),
      },
      allEnabled: !enabledTools,
    });
  } catch (error) {
    console.error('Error updating AI tools settings:', error);
    return NextResponse.json(
      { error: 'Failed to update AI tools settings' },
      { status: 500 }
    );
  }
}
