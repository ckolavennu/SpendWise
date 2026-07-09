import { browser } from '$app/environment';
import { auth } from '$lib/firebase/client';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { derived, writable } from 'svelte/store';

export const currentUser = writable<User | null>(null);
export const authLoading = writable(true);

if (browser && auth) {
	onAuthStateChanged(auth, (user) => {
		currentUser.set(user);
		authLoading.set(false);
	});
} else {
	authLoading.set(false);
}

export const isLoggedIn = derived(currentUser, ($currentUser) => Boolean($currentUser));