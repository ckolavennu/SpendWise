import { db } from '$lib/firebase/client';
import { doc, onSnapshot, setDoc, type Unsubscribe } from 'firebase/firestore';

export interface BudgetSettings {
	monthlyBudget: number;
	currency: string;
	updatedAt: string;
}

const DEFAULT_BUDGET_SETTINGS: BudgetSettings = {
	monthlyBudget: 1200,
	currency: 'MYR',
	updatedAt: new Date().toISOString()
};

function requireDb() {
	if (!db) {
		throw new Error('Firestore is only available in the browser.');
	}

	return db;
}

function getBudgetSettingsDoc(userId: string) {
	return doc(requireDb(), 'users', userId, 'settings', 'budget');
}

export function subscribeToBudgetSettings(
	userId: string,
	callback: (settings: BudgetSettings) => void
): Unsubscribe {
	return onSnapshot(getBudgetSettingsDoc(userId), (snapshot) => {
		if (!snapshot.exists()) {
			callback(DEFAULT_BUDGET_SETTINGS);
			return;
		}

		const data = snapshot.data();

		callback({
			monthlyBudget: Number(data.monthlyBudget ?? DEFAULT_BUDGET_SETTINGS.monthlyBudget),
			currency: String(data.currency ?? DEFAULT_BUDGET_SETTINGS.currency),
			updatedAt: String(data.updatedAt ?? DEFAULT_BUDGET_SETTINGS.updatedAt)
		});
	});
}

export async function saveBudgetSettings(
	userId: string,
	monthlyBudget: number,
	currency = 'MYR'
): Promise<void> {
	await setDoc(
		getBudgetSettingsDoc(userId),
		{
			monthlyBudget,
			currency,
			updatedAt: new Date().toISOString()
		},
		{ merge: true }
	);
}