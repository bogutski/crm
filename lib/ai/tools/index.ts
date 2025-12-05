import { tool } from 'ai';
import {
  AI_TOOLS_REGISTRY,
  searchContactsSchema,
  getOpportunitiesStatsSchema,
  getTasksOverviewSchema,
  getPipelineAnalyticsSchema,
  searchOpportunitiesSchema,
  getContactDetailsSchema,
  createTaskSchema,
  updateOpportunityStageSchema,
  createInteractionSchema,
  updateTaskStatusSchema,
  SearchContactsParams,
  GetOpportunitiesStatsParams,
  GetTasksOverviewParams,
  GetPipelineAnalyticsParams,
  SearchOpportunitiesParams,
  GetContactDetailsParams,
  CreateTaskParams,
  UpdateOpportunityStageParams,
  CreateInteractionParams,
  UpdateTaskStatusParams,
} from './types';

// Analytics tools
import { searchContacts } from './analytics/search-contacts';
import { getOpportunitiesStats } from './analytics/get-opportunities-stats';
import { getTasksOverview } from './analytics/get-tasks-overview';
import { getPipelineAnalytics } from './analytics/get-pipeline-analytics';
import { searchOpportunities } from './analytics/search-opportunities';
import { getContactDetails } from './analytics/get-contact-details';

// Action tools
import { createTask } from './actions/create-task';
import { updateOpportunityStage } from './actions/update-opportunity-stage';
import { createInteraction } from './actions/create-interaction';
import { updateTaskStatus } from './actions/update-task-status';

export { AI_TOOLS_REGISTRY } from './types';

interface ToolsConfig {
  userId: string;
  enabledTools?: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ToolsRecord = Record<string, any>;

/**
 * Get all AI tools configured for the Vercel AI SDK
 */
export function getAITools(config: ToolsConfig): ToolsRecord {
  const { userId, enabledTools } = config;

  // Filter tools based on enabled list
  const isToolEnabled = (toolName: string) => {
    if (!enabledTools) return true; // All enabled by default
    return enabledTools.includes(toolName);
  };

  const tools: ToolsRecord = {};

  // Analytics tools
  if (isToolEnabled('search_contacts')) {
    tools.search_contacts = tool({
      description: AI_TOOLS_REGISTRY.search_contacts.description,
      inputSchema: searchContactsSchema,
      execute: async (params: SearchContactsParams) => searchContacts(params),
    });
  }

  if (isToolEnabled('get_opportunities_stats')) {
    tools.get_opportunities_stats = tool({
      description: AI_TOOLS_REGISTRY.get_opportunities_stats.description,
      inputSchema: getOpportunitiesStatsSchema,
      execute: async (params: GetOpportunitiesStatsParams) => getOpportunitiesStats(params),
    });
  }

  if (isToolEnabled('get_tasks_overview')) {
    tools.get_tasks_overview = tool({
      description: AI_TOOLS_REGISTRY.get_tasks_overview.description,
      inputSchema: getTasksOverviewSchema,
      execute: async (params: GetTasksOverviewParams) => getTasksOverview(params),
    });
  }

  if (isToolEnabled('get_pipeline_analytics')) {
    tools.get_pipeline_analytics = tool({
      description: AI_TOOLS_REGISTRY.get_pipeline_analytics.description,
      inputSchema: getPipelineAnalyticsSchema,
      execute: async (params: GetPipelineAnalyticsParams) => getPipelineAnalytics(params),
    });
  }

  if (isToolEnabled('search_opportunities')) {
    tools.search_opportunities = tool({
      description: AI_TOOLS_REGISTRY.search_opportunities.description,
      inputSchema: searchOpportunitiesSchema,
      execute: async (params: SearchOpportunitiesParams) => searchOpportunities(params),
    });
  }

  if (isToolEnabled('get_contact_details')) {
    tools.get_contact_details = tool({
      description: AI_TOOLS_REGISTRY.get_contact_details.description,
      inputSchema: getContactDetailsSchema,
      execute: async (params: GetContactDetailsParams) => getContactDetails(params),
    });
  }

  // Action tools
  if (isToolEnabled('create_task')) {
    tools.create_task = tool({
      description: AI_TOOLS_REGISTRY.create_task.description,
      inputSchema: createTaskSchema,
      execute: async (params: CreateTaskParams) => createTask(params, userId),
    });
  }

  if (isToolEnabled('update_opportunity_stage')) {
    tools.update_opportunity_stage = tool({
      description: AI_TOOLS_REGISTRY.update_opportunity_stage.description,
      inputSchema: updateOpportunityStageSchema,
      execute: async (params: UpdateOpportunityStageParams) => updateOpportunityStage(params),
    });
  }

  if (isToolEnabled('create_interaction')) {
    tools.create_interaction = tool({
      description: AI_TOOLS_REGISTRY.create_interaction.description,
      inputSchema: createInteractionSchema,
      execute: async (params: CreateInteractionParams) => createInteraction(params, userId),
    });
  }

  if (isToolEnabled('update_task_status')) {
    tools.update_task_status = tool({
      description: AI_TOOLS_REGISTRY.update_task_status.description,
      inputSchema: updateTaskStatusSchema,
      execute: async (params: UpdateTaskStatusParams) => updateTaskStatus(params),
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
  const analytics = Object.values(AI_TOOLS_REGISTRY).filter((t) => t.category === 'analytics');
  const actions = Object.values(AI_TOOLS_REGISTRY).filter((t) => t.category === 'actions');

  return {
    analytics: analytics.map((t) => ({
      name: t.name,
      displayName: t.displayName,
      description: t.description,
      enabled: t.enabled,
    })),
    actions: actions.map((t) => ({
      name: t.name,
      displayName: t.displayName,
      description: t.description,
      enabled: t.enabled,
      dangerous: t.dangerous || false,
    })),
  };
}
