import admin from 'firebase-admin'

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  console.log('FIREBASE_PROJECT_ID ok:', !!projectId)
  console.log('FIREBASE_CLIENT_EMAIL ok:', !!clientEmail)
  console.log('FIREBASE_PRIVATE_KEY exists:', !!process.env.FIREBASE_PRIVATE_KEY)
  console.log('FIREBASE_PRIVATE_KEY starts with BEGIN:', privateKey?.startsWith('-----BEGIN PRIVATE KEY-----'))
  console.log('FIREBASE_PRIVATE_KEY ends with END:', privateKey?.includes('-----END PRIVATE KEY-----'))

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('🔥 Missing Firebase Admin ENV variables')
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  })
}

export const adminDb = admin.firestore()
export const adminFieldValue = admin.firestore.FieldValue