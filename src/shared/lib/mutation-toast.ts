import { toast } from 'sonner'

const DEFAULT_ROLLBACK_MESSAGE = 'Не удалось сохранить. Изменения отменены.'

export function showMutationRollbackToast(
  message: string = DEFAULT_ROLLBACK_MESSAGE
) {
  toast.error(message)
}
