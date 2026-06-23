import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)

// Only initialize when real keys are present. This prevents Firebase from
// throwing at import time (which would crash the whole app into a blank screen)
// when the dev server was started before `.env` existed or keys are missing.
let app: FirebaseApp | undefined
let authInstance: Auth | undefined
let dbInstance: Firestore | undefined

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig)
  authInstance = getAuth(app)
  dbInstance = getFirestore(app)
} else {
  console.warn(
    '[Logic Locker] Firebase is not configured. Add your keys to .env and RESTART the dev server (npm run dev).',
  )
}

// These are only ever used after `isFirebaseConfigured` is checked (the auth
// context short-circuits when unconfigured), so the non-null assertions are safe.
export const auth = authInstance as Auth
export const db = dbInstance as Firestore
export default app
