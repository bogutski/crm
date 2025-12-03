'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { ColorSelect } from '@/components/ui/ColorSelect';
import { ChannelIcon, CHANNEL_ICONS } from './ChannelIcon';

const channelFormSchema = z.object({
  code: z.string().min(1, 'Код обязателен'),
  name: z.string().min(1, 'Название обязательно'),
  icon: z.string().min(1, 'Иконка обязательна'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Неверный формат цвета'),
  isActive: z.boolean(),
});

type ChannelFormData = z.infer<typeof channelFormSchema>;

interface Channel {
  id: string;
  code: string;
  name: string;
  icon: string;
  color: string;
  isActive: boolean;
}

interface ChannelFormProps {
  channel?: Channel;
  onSuccess: () => void;
  onCancel: () => void;
}

const colorOptions = [
  { value: '#22c55e', label: 'Зелёный', color: '#22c55e' },
  { value: '#3b82f6', label: 'Синий', color: '#3b82f6' },
  { value: '#8b5cf6', label: 'Фиолетовый', color: '#8b5cf6' },
  { value: '#f97316', label: 'Оранжевый', color: '#f97316' },
  { value: '#ef4444', label: 'Красный', color: '#ef4444' },
  { value: '#ec4899', label: 'Розовый', color: '#ec4899' },
  { value: '#6366f1', label: 'Индиго', color: '#6366f1' },
  { value: '#14b8a6', label: 'Бирюзовый', color: '#14b8a6' },
  { value: '#eab308', label: 'Жёлтый', color: '#eab308' },
  { value: '#6b7280', label: 'Серый', color: '#6b7280' },
  { value: '#0088cc', label: 'Telegram', color: '#0088cc' },
  { value: '#25d366', label: 'WhatsApp', color: '#25d366' },
  { value: '#0084ff', label: 'Messenger', color: '#0084ff' },
];

export function ChannelForm({ channel, onSuccess, onCancel }: ChannelFormProps) {
  const isEditing = !!channel;

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChannelFormData>({
    resolver: zodResolver(channelFormSchema),
    defaultValues: {
      code: channel?.code || '',
      name: channel?.name || '',
      icon: channel?.icon || 'message-circle',
      color: channel?.color || '#3b82f6',
      isActive: channel?.isActive ?? true,
    },
  });

  const selectedIcon = watch('icon');
  const selectedColor = watch('color');

  const onSubmit = async (data: ChannelFormData) => {
    try {
      const url = isEditing ? `/api/channels/${channel.id}` : '/api/channels';
      const method = isEditing ? 'PATCH' : 'POST';

      const body = isEditing
        ? {
            name: data.name,
            icon: data.icon,
            color: data.color,
            isActive: data.isActive,
          }
        : data;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.error || 'Ошибка сохранения');
      }

      onSuccess();
    } catch (err) {
      setError('root', {
        message: err instanceof Error ? err.message : 'Ошибка сохранения',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {errors.root && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          {errors.root.message}
        </div>
      )}

      {!isEditing && (
        <FormField
          label="Код"
          htmlFor="code"
          required
          error={errors.code?.message}
          hint="Только латинские буквы, цифры и _"
        >
          <Input
            id="code"
            {...register('code', {
              onChange: (e) => {
                e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
              },
            })}
            placeholder="telegram"
            className="font-mono"
            error={errors.code?.message}
          />
        </FormField>
      )}

      <FormField label="Название" htmlFor="name" required error={errors.name?.message}>
        <Input
          id="name"
          {...register('name')}
          placeholder="Telegram"
          error={errors.name?.message}
        />
      </FormField>

      {/* Выбор иконки */}
      <FormField label="Иконка" required error={errors.icon?.message}>
        <div className="grid grid-cols-8 gap-2">
          {CHANNEL_ICONS.map((iconName) => (
            <button
              key={iconName}
              type="button"
              onClick={() => setValue('icon', iconName)}
              className={`p-2 rounded-lg border transition-colors ${
                selectedIcon === iconName
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
              }`}
              title={iconName}
            >
              <ChannelIcon
                name={iconName}
                color={selectedIcon === iconName ? selectedColor : '#6b7280'}
                size={20}
              />
            </button>
          ))}
        </div>
      </FormField>

      {/* Выбор цвета */}
      <FormField label="Цвет" required error={errors.color?.message}>
        <div className="flex items-center gap-3">
          <ColorSelect
            value={selectedColor}
            onChange={(color) => setValue('color', color)}
            options={colorOptions}
          />
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: selectedColor + '20' }}
          >
            <ChannelIcon name={selectedIcon} color={selectedColor} size={24} />
          </div>
        </div>
      </FormField>

      {/* Кнопки */}
      <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <Button type="submit" fullWidth isLoading={isSubmitting}>
          {isEditing ? 'Сохранить' : 'Создать'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Отмена
        </Button>
      </div>
    </form>
  );
}
