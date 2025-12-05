import { moveOpportunityToStage, getOpportunityById } from '@/modules/opportunity/controller';
import { getStageById } from '@/modules/pipeline/controller';
import { UpdateOpportunityStageParams } from '../types';

export async function updateOpportunityStage(params: UpdateOpportunityStageParams) {
  const { opportunityId, stageId } = params;

  // Get current opportunity
  const currentOpp = await getOpportunityById(opportunityId);
  if (!currentOpp) {
    return {
      success: false,
      error: 'Сделка не найдена',
    };
  }

  // Get new stage info
  const newStage = await getStageById(stageId);
  if (!newStage) {
    return {
      success: false,
      error: 'Стадия не найдена',
    };
  }

  const oldStageName = currentOpp.stage?.name || 'Неизвестно';

  // Move to new stage
  const updatedOpp = await moveOpportunityToStage(opportunityId, stageId);

  if (!updatedOpp) {
    return {
      success: false,
      error: 'Не удалось переместить сделку',
    };
  }

  return {
    success: true,
    message: `Сделка "${updatedOpp.name}" перемещена из "${oldStageName}" в "${newStage.name}"`,
    opportunity: {
      id: updatedOpp.id,
      name: updatedOpp.name,
      amount: updatedOpp.amount,
      previousStage: oldStageName,
      newStage: {
        name: newStage.name,
        color: newStage.color,
        probability: newStage.probability,
        isFinal: newStage.isFinal,
        isWon: newStage.isWon,
      },
    },
  };
}
