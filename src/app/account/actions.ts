'use server'

import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { auth, signOut, unstable_update } from '@/shared/auth'
import { db, users } from '@/shared/db'
import { accountNameSchema, accountPasswordSchema } from '@/shared/lib'

export type AccountActionResult =
  | { success: true }
  | { success: false; error: string }

const GENERIC_ERROR = 'Не удалось сохранить изменения. Попробуйте ещё раз.'
const UNAUTHORIZED_ERROR = 'Сессия истекла. Войдите снова.'

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Введите текущий пароль'),
    newPassword: accountPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Новые пароли не совпадают',
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'Новый пароль должен отличаться от текущего',
  })

export async function signOutCurrentUser() {
  await signOut({ redirectTo: '/login' })
}

export async function updateAccountName(formData: {
  name: string
}): Promise<AccountActionResult> {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    return { success: false, error: UNAUTHORIZED_ERROR }
  }

  const parsed = accountNameSchema.safeParse(formData?.name ?? '')

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    await db
      .update(users)
      .set({ name: parsed.data })
      .where(eq(users.id, userId))
  } catch {
    return { success: false, error: GENERIC_ERROR }
  }

  try {
    await unstable_update({ user: { name: parsed.data } })
  } catch {
    // The database is the source of truth; a stale JWT name is not fatal.
  }

  revalidatePath('/account')
  revalidatePath('/')

  return { success: true }
}

export async function changeAccountPassword(formData: {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}): Promise<AccountActionResult> {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    return { success: false, error: UNAUTHORIZED_ERROR }
  }

  const parsed = changePasswordSchema.safeParse(formData)

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { currentPassword, newPassword } = parsed.data

  try {
    const [user] = await db
      .select({ password: users.password })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user?.password) {
      return {
        success: false,
        error: 'Для этого аккаунта вход по паролю не настроен',
      }
    }

    const isValid = await bcrypt.compare(currentPassword, user.password)

    if (!isValid) {
      return { success: false, error: 'Текущий пароль указан неверно' }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12)

    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId))

    return { success: true }
  } catch {
    return { success: false, error: GENERIC_ERROR }
  }
}
