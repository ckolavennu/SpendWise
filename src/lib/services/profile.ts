import { db } from '$lib/firebase/client';
import type { UserProfile, UserRole } from '$lib/types/user';
import { doc, getDoc, onSnapshot, setDoc, updateDoc, type Unsubscribe } from 'firebase/firestore';

function requireDb() {
	if (!db) {
		throw new Error('Firestore is only available in the browser.');
	}

	return db;
}

function isUserRole(value: unknown): value is UserRole {
	return value === 'user' || value === 'superadmin';
}

function getProfileDoc(userId: string) {
	return doc(requireDb(), 'users', userId, 'profile', 'main');
}

export async function ensureUserProfile(input: {
	uid: string;
	email: string | null;
	displayName: string | null;
}): Promise<void> {
	const profileRef = getProfileDoc(input.uid);
	const snapshot = await getDoc(profileRef);
	const now = new Date().toISOString();

	if (!snapshot.exists()) {
		await setDoc(profileRef, {
			uid: input.uid,
			email: input.email ?? '',
			displayName: input.displayName ?? '',
			role: 'user',
			createdAt: now,
			updatedAt: now
		});

		return;
	}

	await updateDoc(profileRef, {
		email: input.email ?? '',
		displayName: input.displayName ?? '',
		updatedAt: now
	});
}

export function subscribeToUserProfile(
	userId: string,
	callback: (profile: UserProfile | null) => void
): Unsubscribe {
	return onSnapshot(getProfileDoc(userId), (snapshot) => {
		if (!snapshot.exists()) {
			callback(null);
			return;
		}

		const data = snapshot.data();

		callback({
			uid: String(data.uid ?? userId),
			email: String(data.email ?? ''),
			displayName: String(data.displayName ?? ''),
			role: isUserRole(data.role) ? data.role : 'user',
			createdAt: String(data.createdAt ?? ''),
			updatedAt: String(data.updatedAt ?? '')
		});
	});
}