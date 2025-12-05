import { getOpportunities } from '@/modules/opportunity/controller';
import { SearchOpportunitiesParams } from '../types';

export async function searchOpportunities(params: SearchOpportunitiesParams) {
  const { query, minAmount, maxAmount, stageId, closingDateFrom, closingDateTo, limit } = params;

  const result = await getOpportunities({
    search: query,
    minAmount,
    maxAmount,
    stageId,
    closingDateFrom,
    closingDateTo,
    archived: false,
    page: 1,
    limit,
  });

  return {
    success: true,
    total: result.total,
    totalAmount: result.totalAmount,
    opportunities: result.opportunities.map((opp) => ({
      id: opp.id,
      name: opp.name,
      amount: opp.amount,
      closingDate: opp.closingDate,
      contact: opp.contact ? {
        id: opp.contact.id,
        name: opp.contact.name,
      } : null,
      stage: opp.stage ? {
        name: opp.stage.name,
        color: opp.stage.color,
        probability: opp.stage.probability,
        isFinal: opp.stage.isFinal,
        isWon: opp.stage.isWon,
      } : null,
      pipeline: opp.pipeline?.name,
      priority: opp.priority?.name,
      owner: opp.owner?.name,
      description: opp.description,
    })),
  };
}
