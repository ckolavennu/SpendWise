import { browser } from '$app/environment';
import { ensureUserProfile, subscribeToUserProfile } from '$lib/services/profile';
import { currentUser } from '$lib/stores/auth';
import type { UserProfile } from '$lib/types/user';
import type { Unsubscribe } from 'firebase/firestore';
import { derived, writable } from 'svelte/store';

export const currentUserProfile = writable<UserProfile | null>(null);
export const userProfileLoading = writable(true);

let profileUnsubscribe: Unsubscribe | null = null;

if (browser) {
	currentUser.subscribe(async (user) => {
		if (profileUnsubscribe) {
			profileUnsubscribe();
			profileUnsubscribe = null;
		}

		if (!user) {
			currentUserProfile.set(null);
			userProfileLoading.set(false);
			return;
		}

		userProfileLoading.set(true);

		try {
			await ensureUserProfile({
				uid: user.uid,
				email: user.email,
				displayName: user.displayName
			});

			profileUnsubscribe = subscribeToUserProfile(user.uid, (profile) => {
				currentUserProfile.set(profile);
				userProfileLoading.set(false);
			});
		} catch {
			currentUserProfile.set(null);
			userProfileLoading.set(false);
		}
	});
} else {
	userProfileLoading.set(false);
}

export const isSuperAdmin = derived(
	currentUserProfile,
	($currentUserProfile) => $currentUserProfile?.role === 'superadmin'
);