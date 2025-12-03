'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';

const userRoleSchema = z.enum(['admin', 'manager', 'user']);
type UserRole = z.infer<typeof userRoleSchema>;

const userFormSchema = z.object({
  name: z.string().min(1, 'Введите имя пользователя'),
  email: z.string().email('Введите корректный email'),
  password: z.string().optional(),
  roles: z.array(userRoleSchema).min(1, 'Выберите хотя бы одну роль'),
  isActive: z.boolean(),
});

type UserFormData = z.infer<typeof userFormSchema>;

interface UserData {
  id: string;
  email: string;
  name: string;
  image?: string;
  roles: UserRole[];
  isActive: boolean;
}

interface UserFormProps {
  user?: UserData;
  onSuccess: () => void;
  onCancel: () => void;
}

const availableRoles: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Администратор' },
  { value: 'manager', label: 'Менеджер' },
  { value: 'user', label: 'Пользователь' },
];

export function UserForm({ user, onSuccess, onCancel }: UserFormProps) {
  const isEditing = !!user;

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(
      isEditing
        ? userFormSchema
        : userFormSchema.refine((data) => data.password && data.password.length >= 6, {
            message: 'Пароль должен быть не менее 6 символов',
            path: ['password'],
          })
    ),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      password: '',
      roles: user?.roles || ['user'],
      isActive: user?.isActive ?? true,
    },
  });

  const onSubmit = async (data: UserFormData) => {
    try {
      const url = isEditing ? `/api/users/${user.id}` : '/api/users';
      const method = isEditing ? 'PATCH' : 'POST';

      const body: Record<string, unknown> = {
        name: data.name.trim(),
        email: data.email.trim(),
        roles: data.roles,
        isActive: data.isActive,
      };

      if (data.password?.trim()) {
        body.password = data.password;
      }

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
        message: err instanceof Error ? err.message : 'Произошла ошибка',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {errors.root && (
        <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg">
          {errors.root.message}
        </div>
      )}

      <FormField label="Имя" htmlFor="name" required error={errors.name?.message}>
        <Input
          id="name"
          {...register('name')}
          placeholder="Введите имя"
          error={errors.name?.message}
        />
      </FormField>

      <FormField label="Email" htmlFor="email" required error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          {...register('email')}
          placeholder="user@example.com"
          error={errors.email?.message}
        />
      </FormField>

      <FormField
        label="Пароль"
        htmlFor="password"
        required={!isEditing}
        error={errors.password?.message}
        hint={isEditing ? 'Оставьте пустым, чтобы не менять' : undefined}
      >
        <Input
          id="password"
          type="password"
          {...register('password')}
          placeholder={isEditing ? '••••••••' : 'Введите пароль'}
          error={errors.password?.message}
        />
      </FormField>

      <FormField label="Роли" error={errors.roles?.message}>
        <div className="space-y-2">
          {availableRoles.map((role) => (
            <Controller
              key={role.value}
              control={control}
              name="roles"
              render={({ field }) => (
                <div className="p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <Checkbox
                    checked={(field.value || []).includes(role.value)}
                    onChange={(e) => {
                      const currentValue = field.value || [];
                      if (e.target.checked) {
                        field.onChange([...currentValue, role.value]);
                      } else {
                        field.onChange(currentValue.filter((r) => r !== role.value));
                      }
                    }}
                    label={role.label}
                  />
                </div>
              )}
            />
          ))}
        </div>
      </FormField>

      <Controller
        control={control}
        name="isActive"
        render={({ field }) => (
          <Checkbox
            checked={field.value}
            onChange={field.onChange}
            label="Активный пользователь"
            description="Неактивные пользователи не могут войти в систему"
          />
        )}
      />

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
