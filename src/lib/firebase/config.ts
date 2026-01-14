import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider, type AppCheck } from 'firebase/app-check';
import { env } from '$env/dynamic/public';

// Helper to safely get environment variable with fallback
function getEnv(key: string, fallback: string): string {
	return env[key] || fallback;
}

// Firebase configuration from environment variables with fallback defaults for build
const firebaseConfig = {
	apiKey: getEnv('PUBLIC_FIREBASE_API_KEY', 'placeholder-api-key'),
	authDomain: getEnv('PUBLIC_FIREBASE_AUTH_DOMAIN', 'placeholder.firebaseapp.com'),
	projectId: getEnv('PUBLIC_FIREBASE_PROJECT_ID', 'placeholder-project'),
	storageBucket: getEnv('PUBLIC_FIREBASE_STORAGE_BUCKET', 'placeholder-project.appspot.com'),
	messagingSenderId: getEnv('PUBLIC_FIREBASE_MESSAGING_SENDER_ID', '123456789'),
	appId: getEnv('PUBLIC_FIREBASE_APP_ID', '1:123456789:web:placeholder')
};

// reCAPTCHA v3 configuration from environment variables
const RECAPTCHA_SITE_KEY = getEnv('PUBLIC_RECAPTCHA_SITE_KEY', 'placeholder-recaptcha-key');

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let appCheck: AppCheck | null = null;

// Initialize Firebase App
// Note: Even with placeholder values, Firebase will initialize
// but operations will fail at runtime if credentials are invalid
app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
auth = getAuth(app);

// Initialize Firestore
db = getFirestore(app);


// Initialize App Check (only in browser, not during SSR)
if (typeof window !== 'undefined') {
	// Only initialize App Check if we have a valid reCAPTCHA key (not placeholder)
	if (RECAPTCHA_SITE_KEY && RECAPTCHA_SITE_KEY !== 'placeholder-recaptcha-key' && !RECAPTCHA_SITE_KEY.includes('placeholder')) {
		try {
			appCheck = initializeAppCheck(app, {
				provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
				isTokenAutoRefreshEnabled: true
			});
		} catch (error) {
			appCheck = null;
		}
	} else {
		appCheck = null;
	}
}

export { app, auth, db, appCheck };
export type { FirebaseApp, Auth, Firestore, AppCheck };
