'use server'

import { signOut } from '@/shared/auth'

export async function signOutCurrentUser() {
  await signOut({ redirectTo: '/login' })
}
