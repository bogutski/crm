import { NextRequest, NextResponse } from 'next/server';
import { apiAuth } from '@/lib/api-auth';
import { getSystemSettingsInternal, updateSystemSettings } from '@/modules/system-settings/controller';
import { MCP_TOOLS } from '@/lib/mcp/tools';

// GET /api/system-settings/mcp/tools - Get all MCP tools with their status
export async function GET(request: NextRequest) {
  const authResult = await apiAuth(request);
  if (!authResult) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settings = await getSystemSettingsInternal();
    const enabledTools = settings.ai?.mcpTools?.enabled;

    // Get tool names from MCP_TOOLS
    const tools = MCP_TOOLS.map((tool) => ({
      name: tool.name,
      description: tool.description,
      enabled: !enabledTools || enabledTools.includes(tool.name),
    }));

    return NextResponse.json({
      tools,
      // If enabled is undefined, all tools are enabled
      allEnabled: !enabledTools,
      total: tools.length,
      enabledCount: enabledTools ? enabledTools.length : tools.length,
    });
  } catch (error) {
    console.error('Error fetching MCP tools settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MCP tools settings' },
      { status: 500 }
    );
  }
}

// PATCH /api/system-settings/mcp/tools - Update enabled MCP tools
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

      const validTools = MCP_TOOLS.map((t) => t.name);
      const invalidTools = enabled.filter((t: string) => !validTools.includes(t));

      if (invalidTools.length > 0) {
        return NextResponse.json(
          { error: `Invalid tool names: ${invalidTools.join(', ')}` },
          { status: 400 }
        );
      }
    }

    const settings = await getSystemSettingsInternal();

    // Update MCP tools settings
    await updateSystemSettings({
      ai: {
        ...settings.ai,
        mcpTools: enabled === null ? undefined : { enabled },
      },
    }, authResult.userId);

    // Get updated settings
    const updatedSettings = await getSystemSettingsInternal();
    const enabledTools = updatedSettings.ai?.mcpTools?.enabled;

    const tools = MCP_TOOLS.map((tool) => ({
      name: tool.name,
      description: tool.description,
      enabled: !enabledTools || enabledTools.includes(tool.name),
    }));

    return NextResponse.json({
      tools,
      allEnabled: !enabledTools,
      total: tools.length,
      enabledCount: enabledTools ? enabledTools.length : tools.length,
    });
  } catch (error) {
    console.error('Error updating MCP tools settings:', error);
    return NextResponse.json(
      { error: 'Failed to update MCP tools settings' },
      { status: 500 }
    );
  }
}
