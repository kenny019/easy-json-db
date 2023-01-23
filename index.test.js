import { describe, test, expect } from 'vitest';

import { DBClient } from './lib';

describe('DBClient', () => {
	describe('Testing constructor', () => {
		test('initialise DBClient with default path', () => {
			const db = new DBClient();
			const db2 = new DBClient();

			expect(db).toEqual(db2);
		});

		test('initialise DBClient with different path', () => {
			const db = new DBClient();
			const db2 = new DBClient('./db2');

			expect(db).not.toEqual(db2);
		});
	});
});
