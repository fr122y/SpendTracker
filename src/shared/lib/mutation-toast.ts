import { toast } from 'sonner'

import { handleRequestFailure } from './session-expiry'

const DEFAULT_ROLLBACK_MESSAGE = 'Не удалось сохранить. Изменения отменены.'

/**
 * Reports a rolled-back mutation. When the failure came from an expired
 * session, the user is sent to sign in again instead of seeing the generic
 * error.
 */
export function showMutationRollbackToast(
  message: string = DEFAULT_ROLLBACK_MESSAGE
) {
  void handleRequestFailure(() => toast.error(message))
}
