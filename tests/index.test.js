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

	describe('Testing insert method', () => {
		test('insert a document', () => {
			const db = new DBClient(TEST_DB);

			const result = db.insert('users', 'test_user', {
				age: 49,
				gender: 'female',
			});

			const verify = db.get('users', 'test_user');

			expect(result.ok).toBeTruthy;
			expect(result.val).toBeTruthy;
			expect(verify.val).toEqual({
				age: 49,
				gender: 'female',
			});
		});

		test('insert a document containing an object', () => {
			const db = new DBClient(TEST_DB);

			const result = db.insert('users', 'test_user2', {
				rules: {
					admin: true,
				},
			});

			const verify = db.get('users', 'test_user2');

			expect(result.ok).toBeTruthy;
			expect(result.val).toBeTruthy;
			expect(verify.val).toEqual({
				rules: {
					admin: true,
				},
			});
		});
	});

	describe('Testing update method', () => {
		test('update a document', () => {
			const db = new DBClient(TEST_DB);

			const insert = db.insert('users', 'test_user3', {
				rules: {
					admin: true,
				},
			});

			const update = db.update('users', 'test_user3', {
				rules: {
					admin: false,
				},
			});

			const get = db.get('users', 'test_user3');

			expect(insert.ok).toBeTruthy;
			expect(update.ok).toBeTruthy;
			expect(get.val).toEqual({
				rules: {
					admin: false,
				},
			});
		});

		test('update a document not found', () => {
			const db = new DBClient(TEST_DB);

			const update = db.update('users', 'fake_user', {
				is_real: true,
			});

			expect(update.ok).toBeFalsy;
			expect(update.err).toBeTruthy;
		});
	});

	describe('Testing replace method', () => {
		test('replace a document', () => {
			const db = new DBClient(TEST_DB);

			const insert = db.insert('users', 'test_user4', {
				is_guild: false,
			});

			const replace = db.replace('users', 'test_user4', {});

			expect(insert.ok).toBeTruthy;
			expect(replace.val).toEqual({});
		});

		test('replace a document not found', () => {
			const db = new DBClient(TEST_DB);

			const replace = db.replace('users', 'fake_user2', {});

			expect(replace.ok).toBeFalsy;
			expect(replace.err).toBeTruthy;
		});
	});

	describe('Testing remove method', () => {
		test('remove a document', () => {
			const db = new DBClient(TEST_DB);

			const remove = db.remove('users', 'test_user');

			expect(remove.ok).toBeTruthy;
			expect(remove.err).toBeFalsy;
		});

		test('remove a non existant document', () => {
			const db = new DBClient(TEST_DB);

			const remove = db.remove('users', 'fake_user3');

			expect(remove.ok).toBeFalsy;
			expect(remove.err).toBeTruthy;
		});
	});
});
