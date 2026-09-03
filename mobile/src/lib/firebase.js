import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { initializeFirestore, getFirestore, setLogLevel } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

try {
  setLogLevel('silent')
} catch (e) {}

const firebaseConfig = {
  apiKey: "AIzaSyCWUklji8CqL6bnxbALrGTgATvHpg8wA-o",
  authDomain: "skill-swap-31053.firebaseapp.com",
  projectId: "skill-swap-31053",
  storageBucket: "skill-swap-31053.firebasestorage.app",
  messagingSenderId: "44979046150",
  appId: "1:44979046150:web:a59abc0f1d1c67370c4087"
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

let auth
try {
  if (typeof getReactNativePersistence === 'function') {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    })
  } else {
    auth = getAuth(app)
  }
} catch (e) {
  auth = getAuth(app)
}

let db
try {
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  })
} catch (e) {
  db = getFirestore(app)
}

const storage = getStorage(app)

export { app, auth, db, storage }
