import { CallRoutingRule, ICallRoutingRule } from './model';
import {
  CallRoutingRuleResponse,
  CallRoutingRuleListResponse,
  CreateCallRoutingRuleDTO,
  UpdateCallRoutingRuleDTO,
  Schedule,
} from './types';
import { connectToDatabase as dbConnect } from '@/lib/mongodb';
import mongoose from 'mongoose';

// === Преобразователь в Response ===

function toRuleResponse(
  rule: ICallRoutingRule,
  phoneLineInfo?: { phoneNumber: string; displayName: string }
): CallRoutingRuleResponse {
  return {
    id: rule._id.toString(),
    phoneLineId: rule.phoneLineId.toString(),
    phoneNumber: phoneLineInfo?.phoneNumber,
    phoneLineDisplayName: phoneLineInfo?.displayName,
    name: rule.name,
    description: rule.description,
    priority: rule.priority,
    isActive: rule.isActive,
    condition: rule.condition,
    schedule: rule.schedule,
    noAnswerRings: rule.noAnswerRings,
    action: rule.action,
    triggeredCount: rule.triggeredCount,
    lastTriggered: rule.lastTriggered,
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt,
  };
}

// === CRUD ===

export interface SearchRulesOptions {
  phoneLineId?: string;
  condition?: string;
  actionType?: string;
  isActive?: boolean;
  includeInactive?: boolean;
}

export async function getCallRoutingRules(
  options: SearchRulesOptions = {}
): Promise<CallRoutingRuleListResponse> {
  await dbConnect();

  const query: Record<string, unknown> = {};

  if (options.phoneLineId) {
    query.phoneLineId = new mongoose.Types.ObjectId(options.phoneLineId);
  }

  if (options.condition) {
    query.condition = options.condition;
  }

  if (options.actionType) {
    query['action.type'] = options.actionType;
  }

  if (!options.includeInactive) {
    query.isActive = true;
  } else if (options.isActive !== undefined) {
    query.isActive = options.isActive;
  }

  const rules = await CallRoutingRule.find(query)
    .sort({ priority: -1, name: 1 })
    .populate('phoneLineId', 'phoneNumber displayName');

  const results = rules.map(rule => {
    const phoneLine = rule.phoneLineId as unknown as { phoneNumber: string; displayName: string } | null;
    return toRuleResponse(
      rule,
      phoneLine ? { phoneNumber: phoneLine.phoneNumber, displayName: phoneLine.displayName } : undefined
    );
  });

  return {
    rules: results,
    total: results.length,
  };
}

export async function getCallRoutingRuleById(
  id: string
): Promise<CallRoutingRuleResponse | null> {
  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  const rule = await CallRoutingRule.findById(id)
    .populate('phoneLineId', 'phoneNumber displayName');

  if (!rule) return null;

  const phoneLine = rule.phoneLineId as unknown as { phoneNumber: string; displayName: string } | null;
  return toRuleResponse(
    rule,
    phoneLine ? { phoneNumber: phoneLine.phoneNumber, displayName: phoneLine.displayName } : undefined
  );
}

export async function getRulesForPhoneLine(
  phoneLineId: string
): Promise<CallRoutingRuleResponse[]> {
  await dbConnect();

  const rules = await CallRoutingRule.find({
    phoneLineId: new mongoose.Types.ObjectId(phoneLineId),
    isActive: true,
  })
    .sort({ priority: -1 })
    .populate('phoneLineId', 'phoneNumber displayName');

  return rules.map(rule => {
    const phoneLine = rule.phoneLineId as unknown as { phoneNumber: string; displayName: string } | null;
    return toRuleResponse(
      rule,
      phoneLine ? { phoneNumber: phoneLine.phoneNumber, displayName: phoneLine.displayName } : undefined
    );
  });
}

export async function createCallRoutingRule(
  data: CreateCallRoutingRuleDTO
): Promise<CallRoutingRuleResponse> {
  await dbConnect();

  const rule = await CallRoutingRule.create({
    phoneLineId: new mongoose.Types.ObjectId(data.phoneLineId),
    name: data.name,
    description: data.description,
    priority: data.priority ?? 0,
    isActive: data.isActive ?? true,
    condition: data.condition,
    schedule: data.schedule,
    noAnswerRings: data.noAnswerRings ?? 3,
    action: data.action,
    triggeredCount: 0,
  });

  return toRuleResponse(rule);
}

export async function updateCallRoutingRule(
  id: string,
  data: UpdateCallRoutingRuleDTO
): Promise<CallRoutingRuleResponse | null> {
  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  // Build update object
  const updateData: Record<string, unknown> = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.condition !== undefined) updateData.condition = data.condition;
  if (data.schedule !== undefined) updateData.schedule = data.schedule;
  if (data.noAnswerRings !== undefined) updateData.noAnswerRings = data.noAnswerRings;

  // Для action делаем partial update
  if (data.action) {
    for (const [key, value] of Object.entries(data.action)) {
      if (value !== undefined) {
        updateData[`action.${key}`] = value;
      }
    }
  }

  const rule = await CallRoutingRule.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true }
  ).populate('phoneLineId', 'phoneNumber displayName');

  if (!rule) return null;

  const phoneLine = rule.phoneLineId as unknown as { phoneNumber: string; displayName: string } | null;
  return toRuleResponse(
    rule,
    phoneLine ? { phoneNumber: phoneLine.phoneNumber, displayName: phoneLine.displayName } : undefined
  );
}

export async function deleteCallRoutingRule(id: string): Promise<boolean> {
  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(id)) return false;

  const result = await CallRoutingRule.findByIdAndDelete(id);
  return !!result;
}

// === Логика маршрутизации ===

export async function incrementTriggeredCount(ruleId: string): Promise<void> {
  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(ruleId)) return;

  await CallRoutingRule.findByIdAndUpdate(ruleId, {
    $inc: { triggeredCount: 1 },
    lastTriggered: new Date(),
  });
}

/**
 * Проверяет, находится ли текущее время в рамках расписания
 */
export function isWithinSchedule(schedule: Schedule, now: Date = new Date()): boolean {
  // Конвертируем в часовой пояс расписания
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: schedule.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'short',
  });

  const parts = formatter.formatToParts(now);
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
  const weekday = parts.find(p => p.type === 'weekday')?.value || '';

  // Конвертируем день недели в число (0 = Sunday)
  const dayMap: Record<string, number> = {
    'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6,
  };
  const dayOfWeek = dayMap[weekday] ?? 0;

  // Проверяем день недели
  if (!schedule.workingDays.includes(dayOfWeek)) {
    return false;
  }

  // Проверяем праздники
  if (schedule.holidays?.length) {
    const dateStr = now.toISOString().split('T')[0];
    if (schedule.holidays.includes(dateStr)) {
      return false;
    }
  }

  // Проверяем время
  const [startHour, startMin] = schedule.startTime.split(':').map(Number);
  const [endHour, endMin] = schedule.endTime.split(':').map(Number);

  const currentMinutes = hour * 60 + minute;
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

/**
 * Находит подходящее правило для входящего звонка
 */
export async function findMatchingRule(
  phoneLineId: string,
  context: {
    isNoAnswer?: boolean;
    isBusy?: boolean;
    isOffline?: boolean;
    isVIP?: boolean;
    isNewCaller?: boolean;
  }
): Promise<CallRoutingRuleResponse | null> {
  await dbConnect();

  const rules = await getRulesForPhoneLine(phoneLineId);
  const now = new Date();

  for (const rule of rules) {
    let matches = false;

    switch (rule.condition) {
      case 'always':
        matches = true;
        break;

      case 'working_hours':
        if (rule.schedule) {
          matches = isWithinSchedule(rule.schedule, now);
        }
        break;

      case 'after_hours':
        if (rule.schedule) {
          matches = !isWithinSchedule(rule.schedule, now);
        }
        break;

      case 'schedule':
        if (rule.schedule) {
          matches = isWithinSchedule(rule.schedule, now);
        }
        break;

      case 'no_answer':
        matches = context.isNoAnswer === true;
        break;

      case 'busy':
        matches = context.isBusy === true;
        break;

      case 'offline':
        matches = context.isOffline === true;
        break;

      case 'vip_caller':
        matches = context.isVIP === true;
        break;

      case 'new_caller':
        matches = context.isNewCaller === true;
        break;
    }

    if (matches) {
      return rule;
    }
  }

  return null;
}

// === Reorder priorities ===

export async function reorderRules(
  phoneLineId: string,
  ruleIds: string[]
): Promise<void> {
  await dbConnect();

  // Update priorities based on array order (higher index = lower priority)
  const updates = ruleIds.map((id, index) => ({
    updateOne: {
      filter: { _id: new mongoose.Types.ObjectId(id) },
      update: { $set: { priority: ruleIds.length - index } },
    },
  }));

  await CallRoutingRule.bulkWrite(updates);
}
