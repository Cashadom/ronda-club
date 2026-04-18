import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from "firebase/firestore"

import { db } from "./firebase"

export async function fetchUpcomingMeetupsGlobal(max = 3) {
  const now = Timestamp.now()

  const q = query(
    collection(db, "meetups"),
    where("time", ">=", now),
    where("status", "==", "open"),
    orderBy("time", "asc"),
    limit(max)
  )

  const snap = await getDocs(q)

  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
}

export async function fetchMeetupById(meetupId) {
  const snap = await getDoc(doc(db, 'meetups', meetupId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}