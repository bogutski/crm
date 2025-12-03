'use client';

import { signIn } from 'next-auth/react';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Icon } from '@/app/components/icons';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';

const authSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Введите корректный email'),
  password: z.string().min(6, 'Минимум 6 символов'),
});

type AuthFormData = z.infer<typeof authSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const errorParam = searchParams.get('error');

  const [isLogin, setIsLogin] = useState(true);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: AuthFormData) => {
    // Валидация имени при регистрации
    if (!isLogin && (!data.name || data.name.trim().length < 2)) {
      setError('name', { message: 'Введите имя (минимум 2 символа)' });
      return;
    }

    try {
      if (isLogin) {
        const result = await signIn('credentials', {
          email: data.email,
          password: data.password,
          redirect: false,
        });

        if (result?.error) {
          setError('root', { message: 'Неверный email или пароль' });
        } else {
          router.push(callbackUrl);
        }
      } else {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const responseData = await res.json();

        if (!res.ok) {
          setError('root', { message: responseData.error });
        } else {
          const result = await signIn('credentials', {
            email: data.email,
            password: data.password,
            redirect: false,
          });

          if (result?.error) {
            setError('root', { message: 'Ошибка входа после регистрации' });
          } else {
            router.push(callbackUrl);
          }
        }
      }
    } catch {
      setError('root', { message: 'Произошла ошибка' });
    }
  };

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-zinc-950">
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-zinc-900 dark:text-zinc-50">
          CRM Proto
        </h1>

        {(errorParam === 'inactive' || errors.root) && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
            {errorParam === 'inactive'
              ? 'Ваш аккаунт деактивирован. Обратитесь к администратору.'
              : errors.root?.message}
          </div>
        )}

        <div className="flex mb-6 border-b border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 text-center border-b-2 transition-colors cursor-pointer -mb-px ${
              isLogin
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            Вход
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 text-center border-b-2 transition-colors cursor-pointer -mb-px ${
              !isLogin
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            Регистрация
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!isLogin && (
            <FormField label="Имя" htmlFor="name" error={errors.name?.message}>
              <Input
                id="name"
                {...register('name')}
                placeholder="Ваше имя"
                error={errors.name?.message}
              />
            </FormField>
          )}

          <FormField label="Email" htmlFor="email" error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="email@example.com"
              error={errors.email?.message}
            />
          </FormField>

          <FormField label="Пароль" htmlFor="password" error={errors.password?.message}>
            <Input
              id="password"
              type="password"
              {...register('password')}
              placeholder="Минимум 6 символов"
              error={errors.password?.message}
            />
          </FormField>

          <Button type="submit" fullWidth isLoading={isSubmitting}>
            {isLogin ? 'Войти' : 'Зарегистрироваться'}
          </Button>
        </form>

        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-zinc-300 dark:border-zinc-700"></div>
          <span className="px-4 text-sm text-zinc-500 dark:text-zinc-400">или</span>
          <div className="flex-1 border-t border-zinc-300 dark:border-zinc-700"></div>
        </div>

        <Button
          type="button"
          variant="secondary"
          fullWidth
          onClick={handleGoogleSignIn}
          className="flex items-center justify-center gap-3"
        >
          <Icon name="google" className="w-5 h-5" />
          Войти через Google
        </Button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-zinc-950">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-lg shadow-md w-full max-w-md">
            <h1 className="text-2xl font-bold text-center mb-6 text-zinc-900 dark:text-zinc-50">
              CRM Proto
            </h1>
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
              <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
              <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
            </div>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
