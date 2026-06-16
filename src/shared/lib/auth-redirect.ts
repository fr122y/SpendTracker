export function getSafeCallbackUrl(
  callbackUrl: string | null | undefined,
  fallback = '/'
): string {
  if (!callbackUrl?.startsWith('/') || callbackUrl.startsWith('//')) {
    return fallback
  }

  return callbackUrl
}
