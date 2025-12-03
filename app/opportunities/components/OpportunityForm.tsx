'use client';

import { useEffect, useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { opportunityFormSchema, type OpportunityFormData } from '@/modules/opportunity/validation';
import { ColorSelect, type ColorOption } from '@/components/ui/ColorSelect';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';

interface Priority {
  id: string;
  name: string;
  color?: string;
}

interface Stage {
  id: string;
  name: string;
  color: string;
  pipelineId?: string;
  isInitial?: boolean;
}

interface Pipeline {
  id: string;
  name: string;
  code: string;
  stages: Stage[];
}

interface Contact {
  id: string;
  name: string;
}

interface Opportunity {
  id: string;
  name?: string;
  amount?: number;
  closingDate?: string;
  description?: string;
  externalId?: string;
  archived: boolean;
  priority?: Priority | null;
  pipeline?: { id: string; name: string; code: string } | null;
  stage?: Stage | null;
  contact?: Contact | null;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
}

interface DictionaryItem {
  id: string;
  code?: string;
  name: string;
  properties: Record<string, unknown>;
}

interface ContactItem {
  id: string;
  name: string;
}

interface OpportunityFormProps {
  opportunity?: Opportunity;
  onSuccess: () => void;
  onCancel: () => void;
}

const getDefaultValues = (opportunity?: Opportunity): OpportunityFormData => {
  if (opportunity) {
    return {
      name: opportunity.name || '',
      amount: opportunity.amount,
      closingDate: opportunity.closingDate
        ? new Date(opportunity.closingDate).toISOString().split('T')[0]
        : '',
      description: opportunity.description || '',
      externalId: opportunity.externalId || '',
      archived: opportunity.archived,
      contactId: opportunity.contact?.id || '',
      priorityId: opportunity.priority?.id || '',
      pipelineId: opportunity.pipeline?.id || '',
      stageId: opportunity.stage?.id || '',
      utm: opportunity.utm || {},
    };
  }

  return {
    name: '',
    amount: undefined,
    closingDate: '',
    description: '',
    externalId: '',
    archived: false,
    contactId: '',
    priorityId: '',
    pipelineId: '',
    stageId: '',
    utm: {},
  };
};

export function OpportunityForm({ opportunity, onSuccess, onCancel }: OpportunityFormProps) {
  const isEditMode = Boolean(opportunity);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showUtm, setShowUtm] = useState(false);

  // Словари
  const [priorities, setPriorities] = useState<DictionaryItem[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [contacts, setContacts] = useState<ContactItem[]>([]);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OpportunityFormData>({
    resolver: zodResolver(opportunityFormSchema),
    defaultValues: getDefaultValues(opportunity),
  });

  const selectedPipelineId = watch('pipelineId');

  useEffect(() => {
    Promise.all([
      fetch('/api/dictionaries/opportunity_priority/items').then(r => r.ok ? r.json() : { items: [] }),
      fetch('/api/pipelines/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      }).then(r => r.ok ? r.json() : { pipelines: [] }),
      fetch('/api/contacts/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 100 }),
      }).then(r => r.ok ? r.json() : { contacts: [] }),
    ]).then(async ([prioritiesData, pipelinesData, contactsData]) => {
      setPriorities(prioritiesData.items || []);
      setContacts(contactsData.contacts || []);

      // Загрузить этапы для каждой воронки
      const pipelinesWithStages = await Promise.all(
        (pipelinesData.pipelines || []).map(async (pipeline: Pipeline) => {
          const stagesRes = await fetch(`/api/pipelines/${pipeline.id}/stages`);
          const stagesData = stagesRes.ok ? await stagesRes.json() : { stages: [] };
          return { ...pipeline, stages: stagesData.stages || [] };
        })
      );
      setPipelines(pipelinesWithStages);
    });
  }, []);

  useEffect(() => {
    if (opportunity) {
      reset(getDefaultValues(opportunity));
      // Показать UTM если есть данные
      if (opportunity.utm && Object.values(opportunity.utm).some(v => v)) {
        setShowUtm(true);
      }
    }
  }, [opportunity, reset]);

  // При смене воронки сбросить этап
  useEffect(() => {
    const currentPipeline = pipelines.find(p => p.id === selectedPipelineId);
    if (currentPipeline && currentPipeline.stages.length > 0) {
      const currentStageId = watch('stageId');
      const stageInPipeline = currentPipeline.stages.find(s => s.id === currentStageId);
      if (!stageInPipeline) {
        // Выбрать первый этап новой воронки
        const initialStage = currentPipeline.stages.find(s => s.isInitial) || currentPipeline.stages[0];
        if (initialStage) {
          setValue('stageId', initialStage.id);
        }
      }
    }
  }, [selectedPipelineId, pipelines, setValue, watch]);

  const onSubmit = async (data: OpportunityFormData) => {
    setSubmitError(null);

    try {
      const payload = {
        name: data.name?.trim() || undefined,
        amount: data.amount,
        closingDate: data.closingDate || undefined,
        description: data.description?.trim() || undefined,
        externalId: data.externalId?.trim() || undefined,
        archived: data.archived,
        contactId: isEditMode ? (data.contactId || null) : (data.contactId || undefined),
        priorityId: isEditMode ? (data.priorityId || null) : (data.priorityId || undefined),
        pipelineId: isEditMode ? (data.pipelineId || null) : (data.pipelineId || undefined),
        stageId: isEditMode ? (data.stageId || null) : (data.stageId || undefined),
        utm: showUtm ? data.utm : undefined,
      };

      const url = isEditMode ? `/api/opportunities/${opportunity!.id}` : '/api/opportunities';
      const method = isEditMode ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || `Failed to ${isEditMode ? 'update' : 'create'} opportunity`);
      }

      window.dispatchEvent(new CustomEvent(isEditMode ? 'opportunityUpdated' : 'opportunityCreated'));
      onSuccess();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    }
  };

  const priorityOptions: ColorOption[] = useMemo(() =>
    priorities.map(p => ({
      value: p.id,
      label: p.name,
      color: p.properties.color as string | undefined,
    })),
    [priorities]
  );

  const pipelineOptions: ColorOption[] = useMemo(() =>
    pipelines.map(p => ({
      value: p.id,
      label: p.name,
    })),
    [pipelines]
  );

  const stageOptions: ColorOption[] = useMemo(() => {
    const currentPipeline = pipelines.find(p => p.id === selectedPipelineId);
    if (!currentPipeline) return [];
    return currentPipeline.stages.map(s => ({
      value: s.id,
      label: s.name,
      color: s.color,
    }));
  }, [pipelines, selectedPipelineId]);

  const contactOptions: ColorOption[] = useMemo(() =>
    contacts.map(c => ({
      value: c.id,
      label: c.name,
    })),
    [contacts]
  );

  const idPrefix = isEditMode ? 'edit-' : '';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {submitError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
        </div>
      )}

      {/* Name */}
      <div>
        <label htmlFor={`${idPrefix}name`} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Название
        </label>
        <input
          id={`${idPrefix}name`}
          type="text"
          {...register('name')}
          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      {/* Amount & Closing Date */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor={`${idPrefix}amount`} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Сумма
          </label>
          <input
            id={`${idPrefix}amount`}
            type="number"
            step="0.01"
            min="0"
            {...register('amount', { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.amount && (
            <p className="mt-1 text-sm text-red-500">{errors.amount.message}</p>
          )}
        </div>
        <div>
          <label htmlFor={`${idPrefix}closingDate`} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Дата закрытия
          </label>
          <Controller
            control={control}
            name="closingDate"
            render={({ field }) => (
              <DatePicker
                id={`${idPrefix}closingDate`}
                value={field.value ? new Date(field.value) : null}
                onChange={(date) => field.onChange(date?.toISOString().split('T')[0] || '')}
                placeholder="Выберите дату"
              />
            )}
          />
        </div>
      </div>

      {/* Pipeline & Stage */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor={`${idPrefix}pipelineId`} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Воронка
          </label>
          <Controller
            control={control}
            name="pipelineId"
            render={({ field }) => (
              <ColorSelect
                id={`${idPrefix}pipelineId`}
                options={pipelineOptions}
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="Выберите воронку"
              />
            )}
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}stageId`} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Этап
          </label>
          <Controller
            control={control}
            name="stageId"
            render={({ field }) => (
              <ColorSelect
                id={`${idPrefix}stageId`}
                options={stageOptions}
                value={field.value || ''}
                onChange={field.onChange}
                placeholder={selectedPipelineId ? "Выберите этап" : "Сначала выберите воронку"}
                isDisabled={!selectedPipelineId}
              />
            )}
          />
        </div>
      </div>

      {/* Priority & Contact */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor={`${idPrefix}priorityId`} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Приоритет
          </label>
          <Controller
            control={control}
            name="priorityId"
            render={({ field }) => (
              <ColorSelect
                id={`${idPrefix}priorityId`}
                options={priorityOptions}
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="Не указан"
              />
            )}
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}contactId`} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Контакт
          </label>
          <Controller
            control={control}
            name="contactId"
            render={({ field }) => (
              <ColorSelect
                id={`${idPrefix}contactId`}
                options={contactOptions}
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="Не выбран"
              />
            )}
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor={`${idPrefix}description`} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Описание
        </label>
        <textarea
          id={`${idPrefix}description`}
          {...register('description')}
          rows={3}
          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* External ID */}
      <div>
        <label htmlFor={`${idPrefix}externalId`} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Внешний ID
        </label>
        <input
          id={`${idPrefix}externalId`}
          type="text"
          {...register('externalId')}
          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* UTM Toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowUtm(!showUtm)}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
        >
          {showUtm ? '− Скрыть UTM метки' : '+ Добавить UTM метки'}
        </button>
      </div>

      {/* UTM Fields */}
      {showUtm && (
        <div className="space-y-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-md">
          <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">UTM метки</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor={`${idPrefix}utm-source`} className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                Source
              </label>
              <input
                id={`${idPrefix}utm-source`}
                type="text"
                {...register('utm.source')}
                placeholder="google, facebook..."
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor={`${idPrefix}utm-medium`} className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                Medium
              </label>
              <input
                id={`${idPrefix}utm-medium`}
                type="text"
                {...register('utm.medium')}
                placeholder="cpc, email..."
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor={`${idPrefix}utm-campaign`} className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                Campaign
              </label>
              <input
                id={`${idPrefix}utm-campaign`}
                type="text"
                {...register('utm.campaign')}
                placeholder="summer_sale..."
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor={`${idPrefix}utm-term`} className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                Term
              </label>
              <input
                id={`${idPrefix}utm-term`}
                type="text"
                {...register('utm.term')}
                placeholder="keyword..."
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-2">
              <label htmlFor={`${idPrefix}utm-content`} className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                Content
              </label>
              <input
                id={`${idPrefix}utm-content`}
                type="text"
                {...register('utm.content')}
                placeholder="banner_v1..."
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Archived */}
      <div className="flex items-center gap-2">
        <input
          id={`${idPrefix}archived`}
          type="checkbox"
          {...register('archived')}
          className="w-4 h-4 text-blue-600 border-zinc-300 rounded focus:ring-blue-500"
        />
        <label htmlFor={`${idPrefix}archived`} className="text-sm text-zinc-700 dark:text-zinc-300">
          Архивирована
        </label>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <Button type="submit" fullWidth isLoading={isSubmitting}>
          {isEditMode ? 'Сохранить' : 'Создать сделку'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Отмена
        </Button>
      </div>
    </form>
  );
}
