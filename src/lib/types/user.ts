export type UserRole = 'user' | 'superadmin';

export interface UserProfile {
	uid: string;
	email: string;
	displayName: string;
	role: UserRole;
	createdAt: string;
	updatedAt: string;
}