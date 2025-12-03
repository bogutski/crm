// Model
export { Interaction } from './model';
export type { IInteraction, InteractionDirection, InteractionStatus } from './model';

// Types
export type {
  Interaction as InteractionType,
  CreateInteractionDTO,
  UpdateInteractionDTO,
  InteractionResponse,
  InteractionListResponse,
  InteractionFilters,
} from './types';

// Controller
export {
  getInteractions,
  getInteractionById,
  getInteractionsByContact,
  createInteraction,
  updateInteraction,
  deleteInteraction,
  getInteractionStats,
} from './controller';

// Validation
export {
  createInteractionSchema,
  updateInteractionSchema,
  interactionFiltersSchema,
  interactionResponseSchema,
  interactionListResponseSchema,
  interactionDirectionSchema,
  interactionStatusSchema,
} from './validation';
export type {
  CreateInteractionInput,
  UpdateInteractionInput,
  InteractionFiltersInput,
} from './validation';
