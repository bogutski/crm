import { tool } from 'ai';
import { AI_TOOLS_REGISTRY, TOOL_SCHEMAS } from './types';
import { handleMCPToolCall, INTERNAL_USER_TOKEN } from '@/lib/mcp/tools';

export { AI_TOOLS_REGISTRY } from './types';

interface ToolsConfig {
  userId: string;
  enabledTools?: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ToolsRecord = Record<string, any>;

/**
 * Get all AI tools configured for the Vercel AI SDK
 * Uses MCP tool handlers to avoid code duplication
 */
export function getAITools(config: ToolsConfig): ToolsRecord {
  const { userId, enabledTools } = config;

  // Filter tools based on enabled list
  const isToolEnabled = (toolName: string) => {
    if (!enabledTools) return true; // All enabled by default
    return enabledTools.includes(toolName);
  };

  const tools: ToolsRecord = {};

  // Dynamically register all tools from the registry
  for (const [toolName, toolDef] of Object.entries(AI_TOOLS_REGISTRY)) {
    if (!isToolEnabled(toolName)) continue;

    const schema = TOOL_SCHEMAS[toolName];
    if (!schema) {
      console.warn(`[AI Tools] No schema found for tool: ${toolName}`);
      continue;
    }

    tools[toolName] = tool({
      description: toolDef.description,
      inputSchema: schema,
      execute: async (params: Record<string, unknown>) => {
        console.log(`[AI Tools] Executing tool: ${toolName}`, { params, userId });
        try {
          // Use MCP handler for all tools with internal token for server-to-server auth
          const result = await handleMCPToolCall(toolName, params, userId, INTERNAL_USER_TOKEN);
          console.log(`[AI Tools] Tool ${toolName} completed successfully`);
          return result;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`[AI Tools] Error executing ${toolName}:`, errorMessage);
          return {
            success: false,
            error: errorMessage,
          };
        }
      },
    });
  }

  return tools;
}

/**
 * Get list of all available tools with their metadata
 */
export function getAllToolsInfo() {
  return Object.values(AI_TOOLS_REGISTRY).map((t) => ({
    name: t.name,
    displayName: t.displayName,
    description: t.description,
    category: t.category,
    dangerous: t.dangerous || false,
  }));
}

/**
 * Get tools grouped by category
 */
export function getToolsByCategory() {
  const categories: Record<string, typeof AI_TOOLS_REGISTRY[string][]> = {};

  for (const tool of Object.values(AI_TOOLS_REGISTRY)) {
    if (!categories[tool.category]) {
      categories[tool.category] = [];
    }
    categories[tool.category].push(tool);
  }

  return Object.entries(categories).reduce(
    (acc, [category, tools]) => {
      acc[category] = tools.map((t) => ({
        name: t.name,
        displayName: t.displayName,
        description: t.description,
        enabled: t.enabled,
        dangerous: t.dangerous || false,
      }));
      return acc;
    },
    {} as Record<string, Array<{
      name: string;
      displayName: string;
      description: string;
      enabled: boolean;
      dangerous: boolean;
    }>>
  );
}
