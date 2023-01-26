import { fs, Ok, Err, Result, Option, Some, None, path, isDeepStrictEqual } from './utils';

type document = Record<string, any>;
type collectionStore = Record<string, document>;
type lookupResult = string;

class DBClient {
	private static _instance: DBClient;
	databasePath: string;
	collectionStore: collectionStore;
	writeQueue: Set<string>;

	constructor(databasePath?: string, interval?: number) {
		this.databasePath = '';
		this.collectionStore = {};
		this.writeQueue = new Set();

		databasePath = databasePath ? path.format(path.parse(databasePath)) : './db';
		if (!DBClient._instance || (DBClient._instance && DBClient._instance.databasePath !== databasePath)) {
			this.databasePath = databasePath;

			this.populateAllCollections();

			DBClient._instance = this;
		}

		setTimeout(() => this.writeThread(interval), interval);
		return DBClient._instance;
	}

	private populateAllCollections = () => {
		if (!this.collectionStore) this.collectionStore = {};

		const directoryExists = fs.existsSync(this.databasePath);

		if (!directoryExists) {
			fs.mkdirSync(this.databasePath);
		}

		const dbFiles = fs.readdirSync(this.databasePath);

		dbFiles.forEach((fileName) => {
			if (fileName.slice(fileName.length - 4, fileName.length) !== 'json') {
				return;
			}

			this.getCollection(fileName.slice(0, fileName.length - 5), true);
		});
	};

	private writeFileStore = (collectionName: string): Promise<[result: boolean, error: unknown]> => {
		return new Promise((res, rej) => {
			const filePath = `${this.databasePath}/${collectionName}.json`;

			if (!collectionName) return res([false, Error('Missing collectionName')]);

			if (collectionName) {
				fs.writeFile(filePath, JSON.stringify(this.collectionStore[collectionName] || {}), (err) => {
					return res([true, {}]);
				});
			}
		});
	};

	private writeAllFileStore = () => {
		Object.keys(this.collectionStore).forEach((collectionName) => {
			if (!this.collectionStore[collectionName]) return;
			fs.writeFileSync(
				`${this.databasePath}/${collectionName}.json`,
				JSON.stringify(this.collectionStore[collectionName], null),
			);
		});
	};

	private initialiseCollection = (collectionName: string) => {
		if (!collectionName || collectionName.length < 1) {
			collectionName = 'db';
		}

		if (this.collectionStore[collectionName]) return;

		const pathName = `${this.databasePath}/${collectionName}.json`;
		const collectionExists = fs.existsSync(pathName);

		if (!collectionExists) {
			this.collectionStore[collectionName] = {};
			fs.writeFileSync(pathName, '{}');
			return;
		}

		const stats = fs.statSync(pathName);
		if (stats.size < 1) {
			this.collectionStore[collectionName] = {};
			fs.writeFileSync(pathName, '{}');
			return;
		}
	};

	private lookupCollectionData = (
		collectionName: string,
		lookupValue: string | document,
	): Result<lookupResult | lookupResult[], 'Failed to lookup' | string> => {
		if (!collectionName) {
			return new Err('collectionName should be a string with more than one character.');
		}

		if (typeof lookupValue === 'string') {
			return new Ok(this.collectionStore[collectionName][lookupValue] ? lookupValue : '');
		}

		if (typeof lookupValue !== 'object') return new Err('lookupValue should be a string or an object.');

		const output = Object.keys(this.collectionStore[collectionName]).reduce<string[]>((acc, key) => {
			if (isDeepStrictEqual(lookupValue, this.collectionStore[collectionName][key])) {
				acc.push(key);
			}
			return acc;
		}, []);

		return new Ok(output);
	};

	private writeThread = (interval: number = 2000) => {
		const writeQueue: Promise<[result: boolean, error: unknown]>[] = [];

		this.writeQueue.forEach((collectionName) => {
			writeQueue.push(this.writeFileStore(collectionName));
		});

		Promise.all(writeQueue).then(() => {
			console.log('all done');
			console.log(this.writeQueue);
			this.writeQueue.clear();
			setTimeout(() => this.writeThread(interval), interval);
			console.log('next call succesfully enqued');
		});
	};

	getCollection = (
		collectionName: string,
		force?: boolean,
	): Result<collectionStore, string | 'Collection not found'> => {
		if (!collectionName) {
			return new Err('getCollection expects name argument');
		}
		this.initialiseCollection(collectionName);

		const pathName = `${this.databasePath}/${collectionName}.json`;
		if (force || !this.collectionStore) {
			const fileExists = fs.existsSync(pathName);

			if (!fileExists) {
				return new Err(`Collection ${collectionName} was not found`);
			}

			const fileBuffer = fs.readFileSync(pathName);

			const collectionData: collectionStore = JSON.parse(fileBuffer.toString());
			this.collectionStore[collectionName] = collectionData;
		}

		return new Ok(this.collectionStore[collectionName]);
	};

	get = (collectionName: string, lookupValue: string | document): Option<document | document[]> => {
		this.initialiseCollection(collectionName);
		const foundKey = this.lookupCollectionData(collectionName, lookupValue);

		if (foundKey.ok) {
			if (Array.isArray(foundKey.val)) {
				return Some(
					foundKey.val.map((key) => {
						return this.collectionStore[collectionName][key];
					}),
				);
			}

			return Some(this.collectionStore[collectionName][foundKey.val]);
		}

		return None;
	};

	insert = (collectionName: string, key: string, data: document): Result<boolean, 'Failed to insert' | string> => {
		this.initialiseCollection(collectionName);

		if (this.collectionStore[collectionName][key]) {
			return new Err('Failed to insert, key already has data. Use the replace method instead.');
		}

		Object.assign(this.collectionStore[collectionName], { [key]: data });

		this.writeQueue.add(collectionName);
		return new Ok(true);
	};

	update = (
		collectionName: string,
		lookupValue: string | document,
		data: document,
	): Result<document | document[], 'Failed to update' | string> => {
		this.initialiseCollection(collectionName);
		const foundKey = this.lookupCollectionData(collectionName, lookupValue);

		if (!foundKey.ok) return new Err(foundKey.val);

		if (!foundKey.val) return new Err('Failed to update, key does not exist. Use the insert method instead.');

		let output: document | document[];

		if (Array.isArray(foundKey.val)) {
			output = foundKey.val.map((key) => {
				return Object.assign(this.collectionStore[collectionName][key], data);
			});
		} else {
			output = Object.assign(this.collectionStore[collectionName][foundKey.val], data);
		}

		console.log(output);

		this.writeQueue.add(collectionName);
		return new Ok(output);
	};

	remove = (
		collectionName: string,
		lookupValue: string | document,
	): Result<boolean, 'Failed to remove, value does not exist' | string> => {
		this.initialiseCollection(collectionName);
		const foundKey = this.lookupCollectionData(collectionName, lookupValue);

		if (!foundKey.ok) return new Err(foundKey.val);

		if (!foundKey.val) return new Ok(false);

		if (Array.isArray(foundKey.val)) {
			foundKey.val.forEach((key) => {
				delete this.collectionStore[collectionName][key];
			});
		} else {
			delete this.collectionStore[collectionName][foundKey.val];
		}

		this.writeQueue.add(collectionName);
		return new Ok(true);
	};

	replace = (
		collectionName: string,
		lookupValue: string | document,
		data: document | document[],
	): Result<document, 'Failed to update' | string> => {
		this.initialiseCollection(collectionName);
		const foundKey = this.lookupCollectionData(collectionName, lookupValue);

		if (!foundKey.ok) return new Err(foundKey.val);

		if (!foundKey.val) return new Err('Failed to replace, key does not exist. Use the insert method instead.');

		let output: document | document[];

		if (Array.isArray(foundKey.val)) {
			output = foundKey.val.map((key) => {
				return (this.collectionStore[collectionName][key] = data);
			});
		} else {
			this.collectionStore[collectionName][foundKey.val] = data;
			output = data;
		}

		this.writeQueue.add(collectionName);
		return new Ok(output);
	};
}

export = DBClient;
