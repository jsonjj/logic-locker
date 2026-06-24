import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

// Firebase web config. These values are safe to ship in client code (they are
// public identifiers, not secrets); access is controlled by Firestore security
// rules and the Auth authorized-domains list. Env vars take priority so local
// dev can override via .env, with a baked-in fallback so hosting (e.g. Vercel)
// works without configuring any environment variables.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyDQSPz-4g5f1_c6EREuxNCyN77MDzuAr_g',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'logic-locker.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'logic-locker',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'logic-locker.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '629018168021',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:629018168021:web:ab46440856e99dababf05c',
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
