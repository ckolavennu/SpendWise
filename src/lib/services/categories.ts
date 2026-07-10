import { db } from '$lib/firebase/client';
import type { Category, CategoryType, CreateCategoryInput } from '$lib/types/category';
import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	onSnapshot,
	orderBy,
	query,
	type Unsubscribe
} from 'firebase/firestore';

function requireDb() {
	if (!db) {
		throw new Error('Firestore is only available in the browser.');
	}

	return db;
}

function isCategoryType(value: unknown): value is CategoryType {
	return value === 'income' || value === 'expense' || value === 'both';
}

function getCategoriesCollection(userId: string) {
	return collection(requireDb(), 'users', userId, 'categories');
}

export function subscribeToCategories(
	userId: string,
	callback: (categories: Category[]) => void
): Unsubscribe {
	const categoriesQuery = query(getCategoriesCollection(userId), orderBy('name', 'asc'));

	return onSnapshot(categoriesQuery, (snapshot) => {
		const categories = snapshot.docs.map((document) => {
			const data = document.data();

			return {
				id: document.id,
				name: String(data.name ?? ''),
				type: isCategoryType(data.type) ? data.type : 'both',
				createdAt: String(data.createdAt ?? ''),
				updatedAt: String(data.updatedAt ?? '')
			} satisfies Category;
		});

		callback(categories);
	});
}

export async function createCategory(
	userId: string,
	input: CreateCategoryInput
): Promise<void> {
	const name = input.name.trim();

	if (!name) {
		throw new Error('Category name is required.');
	}

	const now = new Date().toISOString();

	await addDoc(getCategoriesCollection(userId), {
		name,
		type: input.type,
		createdAt: now,
		updatedAt: now
	});
}

export async function deleteCategory(userId: string, categoryId: string): Promise<void> {
	await deleteDoc(doc(requireDb(), 'users', userId, 'categories', categoryId));
}