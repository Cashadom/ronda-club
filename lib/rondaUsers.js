import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

/**
 * Récupère un utilisateur Ronda par UID
 */
export async function getRondaUser(uid) {
  if (!uid) return null
  
  try {
    const snap = await getDoc(doc(db, 'ronda_users', uid))
    if (!snap.exists()) return null
    return { id: snap.id, ...snap.data() }
  } catch (error) {
    console.error('Error getting ronda user:', error)
    return null
  }
}

/**
 * Récupère un utilisateur Ronda par email
 */
export async function getRondaUserByEmail(email) {
  if (!email) return null
  
  try {
    const q = query(
      collection(db, 'ronda_users'),
      where('email', '==', email.toLowerCase())
    )
    const snap = await getDocs(q)
    if (snap.empty) return null
    return { id: snap.docs[0].id, ...snap.docs[0].data() }
  } catch (error) {
    console.error('Error getting ronda user by email:', error)
    return null
  }
}

/**
 * Cherche un utilisateur dans l'ancienne collection users
 */
async function findLegacyUser(email) {
  try {
    const q = query(
      collection(db, 'users'),
      where('email', '==', email.toLowerCase())
    )
    const snap = await getDocs(q)
    if (snap.empty) return null
    return { id: snap.docs[0].id, ...snap.docs[0].data() }
  } catch (error) {
    console.error('Error finding legacy user:', error)
    return null
  }
}

/**
 * Crée un utilisateur Ronda (migration douce)
 * - Vérifie d'abord dans ronda_users
 * - Si pas trouvé, cherche dans l'ancien users
 * - Copie les infos et crée le nouveau profil
 */
export async function createOrUpdateRondaUser(authUser) {
  if (!authUser || !authUser.email) {
    console.error('No user or email provided')
    return null
  }

  try {
    // 1. Vérifier si l'utilisateur existe déjà dans ronda_users
    let rondaUser = await getRondaUser(authUser.uid)
    
    if (rondaUser) {
      // Mettre à jour les infos de base (photo, nom)
      const updates = {}
      if (authUser.displayName && authUser.displayName !== rondaUser.displayName) {
        updates.displayName = authUser.displayName
      }
      if (authUser.photoURL && authUser.photoURL !== rondaUser.photoURL) {
        updates.photoURL = authUser.photoURL
      }
      
      if (Object.keys(updates).length > 0) {
        updates.updated_at = serverTimestamp()
        await updateDoc(doc(db, 'ronda_users', authUser.uid), updates)
        rondaUser = { ...rondaUser, ...updates }
      }
      
      console.log(`✅ Ronda user already exists: ${authUser.email}`)
      return rondaUser
    }

    // 2. Chercher dans l'ancienne collection users
    const legacyUser = await findLegacyUser(authUser.email)
    
    // 3. Créer le nouveau profil Ronda
    const newUserData = {
      uid: authUser.uid,
      email: authUser.email.toLowerCase(),
      displayName: authUser.displayName || legacyUser?.displayName || legacyUser?.name || authUser.email.split('@')[0],
      photoURL: authUser.photoURL || legacyUser?.photoURL || legacyUser?.photoUrl || null,
      city: legacyUser?.city || null,
      trust_score: legacyUser?.trustScore || 0,
      events_attended: legacyUser?.eventsAttended || 0,
      events_hosted: legacyUser?.eventsHosted || 0,
      no_shows: legacyUser?.noShows || 0,
      role: authUser.email === 'cyril.ragonet@gmail.com' ? 'admin' : 'user',
      migrated_from_old: !!legacyUser,
      legacy_user_id: legacyUser?.id || null,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    }

    await setDoc(doc(db, 'ronda_users', authUser.uid), newUserData)
    console.log(`🔄 Created Ronda user from ${legacyUser ? 'legacy' : 'auth'} data: ${authUser.email}`)
    
    return { id: authUser.uid, ...newUserData }
    
  } catch (error) {
    console.error('Error creating/updating Ronda user:', error)
    return null
  }
}

/**
 * Met à jour le trust score d'un utilisateur Ronda
 */
export async function updateRondaTrustScore(uid, delta) {
  try {
    const userRef = doc(db, 'ronda_users', uid)
    const userSnap = await getDoc(userRef)
    
    if (userSnap.exists()) {
      const currentScore = userSnap.data().trust_score || 0
      await updateDoc(userRef, {
        trust_score: currentScore + delta,
        updated_at: serverTimestamp()
      })
    }
  } catch (error) {
    console.error('Error updating trust score:', error)
  }
}

/**
 * Incrémente le compteur d'événements auxquels l'utilisateur a participé
 */
export async function incrementRondaEventsAttended(uid) {
  try {
    const userRef = doc(db, 'ronda_users', uid)
    const userSnap = await getDoc(userRef)
    
    if (userSnap.exists()) {
      const current = userSnap.data().events_attended || 0
      await updateDoc(userRef, {
        events_attended: current + 1,
        updated_at: serverTimestamp()
      })
    }
  } catch (error) {
    console.error('Error incrementing events attended:', error)
  }
}

/**
 * Incrémente le compteur d'événements organisés
 */
export async function incrementRondaEventsHosted(uid) {
  try {
    const userRef = doc(db, 'ronda_users', uid)
    const userSnap = await getDoc(userRef)
    
    if (userSnap.exists()) {
      const current = userSnap.data().events_hosted || 0
      await updateDoc(userRef, {
        events_hosted: current + 1,
        updated_at: serverTimestamp()
      })
    }
  } catch (error) {
    console.error('Error incrementing events hosted:', error)
  }
}

/**
 * Incrémente le compteur de no-shows
 */
export async function incrementRondaNoShows(uid) {
  try {
    const userRef = doc(db, 'ronda_users', uid)
    const userSnap = await getDoc(userRef)
    
    if (userSnap.exists()) {
      const current = userSnap.data().no_shows || 0
      await updateDoc(userRef, {
        no_shows: current + 1,
        trust_score: Math.max(0, (userSnap.data().trust_score || 0) - 1),
        updated_at: serverTimestamp()
      })
    }
  } catch (error) {
    console.error('Error incrementing no-shows:', error)
  }
}