'use server'

import { createHash, randomBytes } from 'crypto'

import bcrypt from 'bcryptjs'
import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'

import { auth } from '@/shared/auth'
import { seedUserDefaults } from '@/shared/auth/seed-defaults'
import {
  db,
  emailVerificationTokens,
  passwordResetTokens,
  users,
} from '@/shared/db'
import { sendAccountEmail } from '@/shared/lib/account-email'

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

const passwordResetRequestSchema = z.object({
  email: z.string().email('Некорректный email').trim().toLowerCase(),
})

const passwordResetSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, 'Пароль должен содержать минимум 8 символов')
    .max(100),
})

const PASSWORD_RESET_TTL_MINUTES = 15
const EMAIL_VERIFICATION_TTL_HOURS = 24
const PASSWORD_RESET_SUCCESS_MESSAGE =
  'Если аккаунт с таким email существует, мы отправили ссылку для сброса пароля.'
const EMAIL_VERIFICATION_RESEND_MESSAGE =
  'Мы отправили письмо для подтверждения email.'

export type RegisterUserResult =
  | { success: true }
  | { success: false; error: string }

export type RequestPasswordResetResult =
  | { success: true; message: string }
  | { success: false; error: string }

export type ResetPasswordResult =
  | { success: true }
  | { success: false; error: string }

export type PasswordResetTokenStatus = 'valid' | 'invalid' | 'expired' | 'used'
export type EmailVerificationTokenStatus =
  | 'success'
  | 'invalid'
  | 'expired'
  | 'used'

export type EmailVerificationStatus =
  | {
      requiresVerification: true
      email: string
    }
  | {
      requiresVerification: false
      email?: string
    }

export type ResendEmailVerificationResult =
  | { success: true; message: string }
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

function hashPasswordResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function hashEmailVerificationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function createPasswordResetToken(): string {
  return randomBytes(32).toString('base64url')
}

function createEmailVerificationToken(): string {
  return randomBytes(32).toString('base64url')
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000)
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000)
}

function getAppOrigin(): string {
  const configuredOrigin = process.env.APP_ORIGIN?.trim()

  if (configuredOrigin) {
    return new URL(configuredOrigin).origin
  }

  if (process.env.NODE_ENV !== 'production') {
    return 'http://localhost:3000'
  }

  throw new Error('APP_ORIGIN is required to generate password reset URLs')
}

function createPasswordResetUrl(token: string): string {
  return `${getAppOrigin()}/reset-password/${encodeURIComponent(token)}`
}

function createEmailVerificationUrl(token: string): string {
  return `${getAppOrigin()}/verify-email/${encodeURIComponent(token)}`
}

function createPasswordResetEmail(input: {
  resetUrl: string
  expiresInMinutes: number
}) {
  const subject = 'Сброс пароля SmartSpend'
  const text = [
    'Вы запросили сброс пароля SmartSpend.',
    `Откройте ссылку и задайте новый пароль: ${input.resetUrl}`,
    `Ссылка действует ${input.expiresInMinutes} минут.`,
    'Если это были не вы, просто проигнорируйте письмо.',
  ].join('\n\n')
  const html = [
    '<p>Вы запросили сброс пароля SmartSpend.</p>',
    `<p><a href="${input.resetUrl}">Задать новый пароль</a></p>`,
    `<p>Ссылка действует ${input.expiresInMinutes} минут.</p>`,
    '<p>Если это были не вы, просто проигнорируйте письмо.</p>',
  ].join('')

  return { subject, text, html }
}

function createEmailVerificationEmail(input: {
  verifyUrl: string
  expiresInHours: number
}) {
  const subject = 'Подтвердите email SmartSpend'
  const text = [
    'Подтвердите email для аккаунта SmartSpend.',
    `Откройте ссылку: ${input.verifyUrl}`,
    `Ссылка действует ${input.expiresInHours} часа.`,
    'Если это были не вы, просто проигнорируйте письмо.',
  ].join('\n\n')
  const html = [
    '<p>Подтвердите email для аккаунта SmartSpend.</p>',
    `<p><a href="${input.verifyUrl}">Подтвердить email</a></p>`,
    `<p>Ссылка действует ${input.expiresInHours} часа.</p>`,
    '<p>Если это были не вы, просто проигнорируйте письмо.</p>',
  ].join('')

  return { subject, text, html }
}

async function issueEmailVerificationToken(input: {
  userId: string
  email: string
}) {
  const token = createEmailVerificationToken()
  const tokenHash = hashEmailVerificationToken(token)
  const now = new Date()
  const expiresAt = addHours(now, EMAIL_VERIFICATION_TTL_HOURS)

  await db.transaction(async (tx) => {
    await tx
      .update(emailVerificationTokens)
      .set({ usedAt: now })
      .where(
        and(
          eq(emailVerificationTokens.userId, input.userId),
          isNull(emailVerificationTokens.usedAt)
        )
      )

    await tx.insert(emailVerificationTokens).values({
      userId: input.userId,
      tokenHash,
      expiresAt,
    })
  })

  const verifyUrl = createEmailVerificationUrl(token)
  const emailPayload = createEmailVerificationEmail({
    verifyUrl,
    expiresInHours: EMAIL_VERIFICATION_TTL_HOURS,
  })

  await sendAccountEmail({
    type: 'auth.verify_email',
    to: input.email,
    subject: emailPayload.subject,
    text: emailPayload.text,
    html: emailPayload.html,
    idempotencyKey: `auth.verify_email:${input.userId}:${tokenHash}`,
  })
}

async function getPasswordResetRecord(token: string): Promise<
  | {
      id: string
      userId: string
      userEmail: string | null
      userPassword: string | null
      expiresAt: Date
      usedAt: Date | null
    }
  | undefined
> {
  const tokenHash = hashPasswordResetToken(token)
  const [record] = await db
    .select({
      id: passwordResetTokens.id,
      userId: passwordResetTokens.userId,
      userEmail: users.email,
      userPassword: users.password,
      expiresAt: passwordResetTokens.expiresAt,
      usedAt: passwordResetTokens.usedAt,
    })
    .from(passwordResetTokens)
    .innerJoin(users, eq(passwordResetTokens.userId, users.id))
    .where(eq(passwordResetTokens.tokenHash, tokenHash))
    .limit(1)

  return record
}

async function getEmailVerificationRecord(token: string): Promise<
  | {
      id: string
      userId: string
      userEmail: string | null
      userPassword: string | null
      userEmailVerified: Date | null
      expiresAt: Date
      usedAt: Date | null
    }
  | undefined
> {
  const tokenHash = hashEmailVerificationToken(token)
  const [record] = await db
    .select({
      id: emailVerificationTokens.id,
      userId: emailVerificationTokens.userId,
      userEmail: users.email,
      userPassword: users.password,
      userEmailVerified: users.emailVerified,
      expiresAt: emailVerificationTokens.expiresAt,
      usedAt: emailVerificationTokens.usedAt,
    })
    .from(emailVerificationTokens)
    .innerJoin(users, eq(emailVerificationTokens.userId, users.id))
    .where(eq(emailVerificationTokens.tokenHash, tokenHash))
    .limit(1)

  return record
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

      try {
        await issueEmailVerificationToken({ userId, email })
      } catch (error) {
        console.error('Email verification request failed', error)
      }

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

export async function getCurrentEmailVerificationStatus(): Promise<EmailVerificationStatus> {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    return { requiresVerification: false }
  }

  const [user] = await db
    .select({
      email: users.email,
      password: users.password,
      emailVerified: users.emailVerified,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user?.email || !user.password || user.emailVerified) {
    return { requiresVerification: false, email: user?.email ?? undefined }
  }

  return { requiresVerification: true, email: user.email }
}

export async function resendEmailVerification(): Promise<ResendEmailVerificationResult> {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    return { success: false, error: 'Войдите, чтобы подтвердить email' }
  }

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      password: users.password,
      emailVerified: users.emailVerified,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user?.email || !user.password) {
    return { success: false, error: 'Подтверждение email недоступно' }
  }

  if (user.emailVerified) {
    return { success: true, message: 'Email уже подтверждён.' }
  }

  try {
    await issueEmailVerificationToken({ userId: user.id, email: user.email })
    return { success: true, message: EMAIL_VERIFICATION_RESEND_MESSAGE }
  } catch (error) {
    console.error('Email verification resend failed', error)
    return {
      success: false,
      error: 'Не удалось отправить письмо. Попробуйте ещё раз',
    }
  }
}

export async function verifyEmail(
  token: string
): Promise<EmailVerificationTokenStatus> {
  if (!token) {
    return 'invalid'
  }

  const record = await getEmailVerificationRecord(token)

  if (!record?.userPassword) {
    return 'invalid'
  }

  if (record.usedAt) {
    return 'used'
  }

  if (record.expiresAt.getTime() <= Date.now()) {
    return 'expired'
  }

  const verifiedAt = new Date()

  if (record.userEmailVerified) {
    await db
      .update(emailVerificationTokens)
      .set({ usedAt: verifiedAt })
      .where(
        and(
          eq(emailVerificationTokens.id, record.id),
          isNull(emailVerificationTokens.usedAt)
        )
      )

    return 'success'
  }

  const wasUpdated = await db.transaction(async (tx) => {
    const claimedTokens = await tx
      .update(emailVerificationTokens)
      .set({ usedAt: verifiedAt })
      .where(
        and(
          eq(emailVerificationTokens.id, record.id),
          isNull(emailVerificationTokens.usedAt)
        )
      )
      .returning({ id: emailVerificationTokens.id })

    if (claimedTokens.length === 0) {
      return false
    }

    await tx
      .update(users)
      .set({ emailVerified: verifiedAt })
      .where(eq(users.id, record.userId))

    return true
  })

  return wasUpdated ? 'success' : 'used'
}

export async function requestPasswordReset(formData: {
  email: string
}): Promise<RequestPasswordResetResult> {
  const parsed = passwordResetRequestSchema.safeParse(formData)

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { email } = parsed.data

  try {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        password: users.password,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (!user?.password || !user.email) {
      return { success: true, message: PASSWORD_RESET_SUCCESS_MESSAGE }
    }

    const token = createPasswordResetToken()
    const tokenHash = hashPasswordResetToken(token)
    const now = new Date()
    const expiresAt = addMinutes(now, PASSWORD_RESET_TTL_MINUTES)

    await db.transaction(async (tx) => {
      await tx
        .update(passwordResetTokens)
        .set({ usedAt: now })
        .where(
          and(
            eq(passwordResetTokens.userId, user.id),
            isNull(passwordResetTokens.usedAt)
          )
        )

      await tx.insert(passwordResetTokens).values({
        userId: user.id,
        tokenHash,
        expiresAt,
      })
    })

    const resetUrl = createPasswordResetUrl(token)
    const emailPayload = createPasswordResetEmail({
      resetUrl,
      expiresInMinutes: PASSWORD_RESET_TTL_MINUTES,
    })

    await sendAccountEmail({
      type: 'auth.reset_password',
      to: user.email,
      subject: emailPayload.subject,
      text: emailPayload.text,
      html: emailPayload.html,
      idempotencyKey: `auth.reset_password:${user.id}:${tokenHash}`,
    })

    return { success: true, message: PASSWORD_RESET_SUCCESS_MESSAGE }
  } catch (error) {
    console.error('Password reset request failed', error)
    return { success: true, message: PASSWORD_RESET_SUCCESS_MESSAGE }
  }
}

export async function getPasswordResetTokenStatus(
  token: string
): Promise<PasswordResetTokenStatus> {
  if (!token) {
    return 'invalid'
  }

  const record = await getPasswordResetRecord(token)

  if (!record?.userPassword) {
    return 'invalid'
  }

  if (record.usedAt) {
    return 'used'
  }

  if (record.expiresAt.getTime() <= Date.now()) {
    return 'expired'
  }

  return 'valid'
}

export async function resetPassword(formData: {
  token: string
  password: string
}): Promise<ResetPasswordResult> {
  const parsed = passwordResetSchema.safeParse(formData)

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { token, password } = parsed.data
  const record = await getPasswordResetRecord(token)

  if (!record?.userPassword) {
    return { success: false, error: 'Ссылка для сброса пароля недействительна' }
  }

  if (record.usedAt) {
    return { success: false, error: 'Ссылка уже была использована' }
  }

  if (record.expiresAt.getTime() <= Date.now()) {
    return { success: false, error: 'Срок действия ссылки истёк' }
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 12)
    const usedAt = new Date()

    const wasUpdated = await db.transaction(async (tx) => {
      const claimedTokens = await tx
        .update(passwordResetTokens)
        .set({ usedAt })
        .where(
          and(
            eq(passwordResetTokens.id, record.id),
            isNull(passwordResetTokens.usedAt)
          )
        )
        .returning({ id: passwordResetTokens.id })

      if (claimedTokens.length === 0) {
        return false
      }

      await tx
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, record.userId))

      return true
    })

    if (!wasUpdated) {
      return { success: false, error: 'Ссылка уже была использована' }
    }

    return { success: true }
  } catch {
    return { success: false, error: 'Произошла ошибка. Попробуйте ещё раз' }
  }
}
