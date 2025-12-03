import { IPipeline, IPipelineStage } from './model';

export type { IPipeline, IPipelineStage };

// ==================== PIPELINE DTOs ====================

export interface CreatePipelineDTO {
  name: string;
  code: string;
  description?: string;
  isDefault?: boolean;
  isActive?: boolean;
  order?: number;
}

export interface UpdatePipelineDTO {
  name?: string;
  code?: string;
  description?: string | null;
  isDefault?: boolean;
  isActive?: boolean;
  order?: number;
}

export interface PipelineResponse {
  id: string;
  name: string;
  code: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  order: number;
  stagesCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PipelineWithStagesResponse extends PipelineResponse {
  stages: PipelineStageResponse[];
}

export interface PipelinesListResponse {
  pipelines: PipelineResponse[];
  total: number;
}

export interface PipelineFilters {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

// ==================== PIPELINE STAGE DTOs ====================

export interface CreatePipelineStageDTO {
  name: string;
  code: string;
  color?: string;
  order?: number;
  probability?: number;
  isInitial?: boolean;
  isFinal?: boolean;
  isWon?: boolean;
  isActive?: boolean;
}

export interface UpdatePipelineStageDTO {
  name?: string;
  code?: string;
  color?: string;
  order?: number;
  probability?: number;
  isInitial?: boolean;
  isFinal?: boolean;
  isWon?: boolean;
  isActive?: boolean;
}

export interface PipelineStageResponse {
  id: string;
  pipelineId: string;
  name: string;
  code: string;
  color: string;
  order: number;
  probability: number;
  isInitial: boolean;
  isFinal: boolean;
  isWon: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PipelineStagesListResponse {
  stages: PipelineStageResponse[];
  total: number;
}

export interface ReorderStagesDTO {
  stageIds: string[];
}
