// Model
export { Channel } from './model';
export type { IChannel } from './model';

// Types
export type {
  Channel as ChannelType,
  CreateChannelDTO,
  UpdateChannelDTO,
  ChannelResponse,
  ChannelListResponse,
} from './types';

// Controller
export {
  getChannels,
  getChannelById,
  getChannelByCode,
  createChannel,
  updateChannel,
  deleteChannel,
} from './controller';

// Validation
export {
  createChannelSchema,
  updateChannelSchema,
  channelResponseSchema,
  channelListResponseSchema,
} from './validation';
export type { CreateChannelInput, UpdateChannelInput } from './validation';
