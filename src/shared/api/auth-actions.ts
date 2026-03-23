'use server'

import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { seedUserDefaults } from '@/shared/auth/seed-defaults'
import { db, users } from '@/shared/db'

const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Имя должно содержать минимум 2 символа')
    .max(50)
    .trim(),
  email: z.string().email('Некорректный email').trim().toLowerCase(),
  password: z
    .string()
    .min(8, 'Пароль должен содержать минимум 8 символов')
    .max(100),
})

export type RegisterUserResult =
  | { success: true }
  | { success: false; error: string }

function getErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return undefined
  }

  const { code } = error as { code?: unknown }
  return typeof code === 'string' ? code : undefined
}

function isRetriableDbError(error: unknown): boolean {
  const code = getErrorCode(error)
  return code === 'CONNECTION_CLOSED' || code === 'ECONNRESET'
}

export async function registerUser(formData: {
  name: string
  email: string
  password: string
}): Promise<RegisterUserResult> {
  const parsed = registerSchema.safeParse(formData)

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { name, email, password } = parsed.data

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1)

      if (existing) {
        return {
          success: false,
          error: 'Пользователь с таким email уже существует',
        }
      }

      const hashedPassword = await bcrypt.hash(password, 12)
      const userId = crypto.randomUUID()

      await db.transaction(async (tx) => {
        await tx.insert(users).values({
          id: userId,
          name,
          email,
          password: hashedPassword,
        })

        await seedUserDefaults(tx, userId)
      })

      return { success: true }
    } catch (error) {
      const code = getErrorCode(error)

      if (code === '23505') {
        return {
          success: false,
          error: 'Пользователь с таким email уже существует',
        }
      }

      if (attempt === 0 && isRetriableDbError(error)) {
        continue
      }

      return { success: false, error: 'Произошла ошибка. Попробуйте ещё раз' }
    }
  }

  return { success: false, error: 'Произошла ошибка. Попробуйте ещё раз' }
}
