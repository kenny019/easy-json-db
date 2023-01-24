import { describe, bench, expect } from 'vitest';

import { DBClient } from '../lib';

const BENCH_DB = './tests/bench/db';

describe('get method', () => {
	bench('get collection by string', () => {
		const db = new DBClient(BENCH_DB);

		const userData = db.get('users', 'kenny');
		expect(userData.val).toEqual({
			age: 22,
			gender: 'male',
		});
	});

	bench('get colletion by data', () => {
		const db = new DBClient(BENCH_DB);

		const userData = db.get('users', { age: 22, gender: 'male' });

		expect(userData.val).toEqual([
			{
				age: 22,
				gender: 'male',
			},
		]);
	});
});

describe('insert method', () => {
	bench('insert collection', () => {
		const db = new DBClient(BENCH_DB);

		for (let i = 0; i < 100; i++) {
			db.insert('insert', `entry${i}`, {
				index: i,
			});
		}
	});
});
