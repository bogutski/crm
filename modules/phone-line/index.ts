// Phone line module exports

export * from './types';
// Re-export model explicitly to avoid conflict with UserPhoneLine interface from types
export { UserPhoneLine, type IUserPhoneLine } from './model';
export * from './validation';
export * from './controller';
