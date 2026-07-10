import { auth } from '$lib/firebase/client';
import {
	GoogleAuthProvider,
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	signInWithPopup,
	signOut,
	type UserCredential
} from 'firebase/auth';

function requireAuth() {
	if (!auth) {
		throw new Error('Firebase Auth is only available in the browser.');
	}

	return auth;
}

export async function registerWithEmail(email: string, password: string): Promise<UserCredential> {
	return createUserWithEmailAndPassword(requireAuth(), email, password);
}

export async function loginWithEmail(email: string, password: string): Promise<UserCredential> {
	return signInWithEmailAndPassword(requireAuth(), email, password);
}

export async function loginWithGoogle(): Promise<UserCredential> {
	const provider = new GoogleAuthProvider();

	provider.setCustomParameters({
		prompt: 'select_account'
	});

	return signInWithPopup(requireAuth(), provider);
}

export async function logoutUser(): Promise<void> {
	return signOut(requireAuth());
}