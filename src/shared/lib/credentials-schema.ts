import { z } from 'zod'

export const accountNameSchema = z
  .string()
  .trim()
  .min(2, 'Имя должно содержать минимум 2 символа')
  .max(50, 'Имя должно содержать не больше 50 символов')

export const accountPasswordSchema = z
  .string()
  .min(8, 'Пароль должен содержать минимум 8 символов')
  .max(100, 'Пароль должен содержать не больше 100 символов')
