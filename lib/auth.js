import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth } from './firebase'
import { createUserProfile, getUserProfile } from './users'

const googleProvider = new GoogleAuthProvider()

/**
 * Sign in with Google popup.
 * Creates user profile in Firestore if first time.
 */
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider)
  const user = result.user

  // Check if profile exists, create if not
  const existing = await getUserProfile(user.uid)
  if (!existing) {
    await createUserProfile({
      id:          user.uid,
      name:        user.displayName || 'Ronda User',
      email:       user.email,
      photo_url:   user.photoURL || '',
      trust_score: 0,
      city:        '',
      events_attended: 0,
      events_hosted:   0,
      created_at:  new Date(),
    })
  }

  return user
}

/**
 * Sign out current user.
 */
export async function signOut() {
  await firebaseSignOut(auth)
}

/**
 * Get current user (synchronous snapshot).
 */
export function getCurrentUser() {
  return auth.currentUser
}

/**
 * Subscribe to auth state changes.
 * Returns unsubscribe function.
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback)
}
