import 'server-only'

import { Resend } from 'resend'

export type AccountEmailType = 'auth.reset_password' | 'auth.verify_email'

export type AccountEmailErrorCode =
  | 'configuration_error'
  | 'invalid_input'
  | 'provider_error'

export type SendAccountEmailInput = {
  type: AccountEmailType
  to: string
  subject: string
  text: string
  html: string
  idempotencyKey: string
  replyTo?: string
}

export type SendAccountEmailResult =
  | {
      status: 'sent'
      provider: 'resend'
      providerMessageId: string
    }
  | {
      status: 'dev_logged'
      provider: 'console'
    }

export class AccountEmailError extends Error {
  constructor(
    public readonly code: AccountEmailErrorCode,
    message: string
  ) {
    super(message)
    this.name = 'AccountEmailError'
  }
}

const MAX_IDEMPOTENCY_KEY_LENGTH = 256
const ACCOUNT_EMAIL_TYPES = new Set<AccountEmailType>([
  'auth.reset_password',
  'auth.verify_email',
])

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function assertNonEmptyString(
  value: unknown,
  fieldName: keyof SendAccountEmailInput
): asserts value is string {
  if (!isNonEmptyString(value)) {
    throw new AccountEmailError(
      'invalid_input',
      `Account email ${fieldName} is required`
    )
  }
}

function validateInput(input: SendAccountEmailInput): void {
  assertNonEmptyString(input.type, 'type')
  assertNonEmptyString(input.to, 'to')
  assertNonEmptyString(input.subject, 'subject')
  assertNonEmptyString(input.text, 'text')
  assertNonEmptyString(input.html, 'html')
  assertNonEmptyString(input.idempotencyKey, 'idempotencyKey')

  if (!ACCOUNT_EMAIL_TYPES.has(input.type)) {
    throw new AccountEmailError(
      'invalid_input',
      `Unsupported account email type: ${input.type}`
    )
  }

  if (input.idempotencyKey.length > MAX_IDEMPOTENCY_KEY_LENGTH) {
    throw new AccountEmailError(
      'invalid_input',
      'Account email idempotencyKey must be at most 256 characters'
    )
  }

  if (input.replyTo !== undefined) {
    assertNonEmptyString(input.replyTo, 'replyTo')
  }
}

function shouldUseDevConsole(apiKey: string | undefined): boolean {
  return !apiKey && process.env.NODE_ENV !== 'production'
}

function getRequiredEnv(value: string | undefined, name: string): string {
  if (!isNonEmptyString(value)) {
    throw new AccountEmailError(
      'configuration_error',
      `${name} is required to send account emails`
    )
  }

  return value
}

function getProviderErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object' || !('message' in error)) {
    return 'Resend failed to send account email'
  }

  const { message } = error as { message?: unknown }
  return typeof message === 'string' && message
    ? message
    : 'Resend failed to send account email'
}

export async function sendAccountEmail(
  input: SendAccountEmailInput
): Promise<SendAccountEmailResult> {
  validateInput(input)

  const apiKey = process.env.RESEND_API_KEY

  if (shouldUseDevConsole(apiKey)) {
    console.info('[account-email:dev]', {
      type: input.type,
      to: input.to,
      subject: input.subject,
      idempotencyKey: input.idempotencyKey,
    })

    return { status: 'dev_logged', provider: 'console' }
  }

  const resolvedApiKey = getRequiredEnv(apiKey, 'RESEND_API_KEY')
  const from = getRequiredEnv(
    process.env.ACCOUNT_EMAIL_FROM,
    'ACCOUNT_EMAIL_FROM'
  )
  const replyTo = input.replyTo ?? process.env.ACCOUNT_EMAIL_REPLY_TO
  const resend = new Resend(resolvedApiKey)

  const { data, error } = await resend.emails
    .send(
      {
        from,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
        ...(isNonEmptyString(replyTo) ? { replyTo } : {}),
      },
      { idempotencyKey: input.idempotencyKey }
    )
    .catch((error: unknown) => {
      throw new AccountEmailError(
        'provider_error',
        getProviderErrorMessage(error)
      )
    })

  if (error) {
    throw new AccountEmailError(
      'provider_error',
      getProviderErrorMessage(error)
    )
  }

  if (!data?.id) {
    throw new AccountEmailError(
      'provider_error',
      'Resend did not return an account email message id'
    )
  }

  return {
    status: 'sent',
    provider: 'resend',
    providerMessageId: data.id,
  }
}
