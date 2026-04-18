import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

/**
 * Create a new user profile document.
 */
export async function createUserProfile(userData) {
  const ref = doc(db, 'users', userData.id)
  await setDoc(ref, {
    ...userData,
    created_at: serverTimestamp(),
  })
}

/**
 * Fetch a user profile by UID.
 * Returns null if not found.
 */
export async function getUserProfile(uid) {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

/**
 * Update user profile fields.
 */
export async function updateUserProfile(uid, updates) {
  const ref = doc(db, 'users', uid)
  await updateDoc(ref, updates)
}

/**
 * Delete a user account and all their data.
 * GDPR compliance — called from profile settings.
 */
export async function deleteUserAccount(uid) {
  // Delete user doc
  await deleteDoc(doc(db, 'users', uid))

  // Delete their participant records
  const pQuery = query(
    collection(db, 'participants'),
    where('user_id', '==', uid)
  )
  const pSnap = await getDocs(pQuery)
  const deletes = pSnap.docs.map(d => deleteDoc(d.ref))
  await Promise.all(deletes)
}
