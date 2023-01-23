import { describe, test, expect } from 'vitest';

import { DBClient } from '../lib';

const TEST_DB = './tests/db';

describe('DBClient', () => {
	describe('Testing constructor', () => {
		test('initialise DBClient with default path', () => {
			const db = new DBClient();
			const db2 = new DBClient();

			expect(db).toEqual(db2);
		});

		test('initialise DBClient with different path', () => {
			const db = new DBClient();
			const db2 = new DBClient(TEST_DB);

			expect(db).not.toEqual(db2);
		});

		test('initialise same DBClient and maintain same instance', () => {
			const db = new DBClient();
			const db2 = new DBClient();

			db.insert('users', 'new_user', {
				age: 33,
				gender: 'male',
			});

			expect(db).toEqual(db2);
		});
	});

	describe('Testing get method', () => {
		test('get a document from a collection with key string', () => {
			const db = new DBClient(TEST_DB);

			const userData = db.get('users', 'kenny');

			expect(userData.val).toEqual({ age: 22, gender: 'male' });
		});

		test('get an array of documents from a collection with object properties', () => {
			const db = new DBClient(TEST_DB);

			const userData = db.get('users', { age: 22, gender: 'male' });

			expect(userData.val).toEqual([{ age: 22, gender: 'male' }]);
		});

		test('call get method with empty collectionName string', () => {
			const db = new DBClient(TEST_DB);

			const userData = db.get('', 'kenny');

			expect(userData.val).toBeNull;
			expect(userData.some).toBeFalsy;
			expect(userData.none).toBeTruthy;
		});

		test('call get method with empty lookupValue string', () => {
			const db = new DBClient(TEST_DB);

			const userData = db.get('users', '');

			expect(userData.val).toBeNull;
			expect(userData.some).toBeFalsy;
			expect(userData.none).toBeTruthy;
		});
	});
});
