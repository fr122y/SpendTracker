export function getSafeCallbackUrl(
  callbackUrl: string | null | undefined,
  fallback = '/'
): string {
  if (!callbackUrl?.startsWith('/') || callbackUrl.startsWith('//')) {
    return fallback
  }

  return callbackUrl
}

/** `/login`, with `callbackUrl` leading back to any page other than `/`. */
export function getLoginPath({
  pathname,
  search,
}: {
  pathname: string
  search: string
}): string {
  const target = `${pathname}${search}`
  if (target === '/') return '/login'
  return `/login?${new URLSearchParams({ callbackUrl: target }).toString()}`
}
