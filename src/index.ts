import { fs, Ok, Err, Result, Option, Some, None, path } from './utils';

type collectionStore = Partial<Record<string, object>>;

type lookupResult = string;

export class DBClient {
	private static _instance: DBClient;
	databasePath: string;
	collectionStore: collectionStore;

	constructor(databasePath?: string) {
		this.databasePath = databasePath || './db';
		if (DBClient._instance) {
			return DBClient._instance;
		}

		this.populateAllCollections();

		DBClient._instance = this;
	}

	private populateAllCollections = () => {
		if (!this.collectionStore) this.collectionStore = {};

		const dbFiles = fs.readdirSync(this.databasePath);

		dbFiles.forEach((fileName) => {
			if (fileName.slice(fileName.length - 4, fileName.length) !== 'json') {
				return;
			}

			this.getCollection(fileName.slice(0, fileName.length - 5), true);
		});
	};

	private writeFileStore = (collectionName?: string) => {
		if (collectionName) {
			fs.writeFileSync(
				`${this.databasePath}/${collectionName}.json`,
				JSON.stringify(this.collectionStore[collectionName]),
			);
			return;
		}

		Object.keys(this.collectionStore).forEach((collectionName) => {
			if (!this.collectionStore[collectionName]) return;
			fs.writeFileSync(
				`${this.databasePath}/${collectionName}.json`,
				JSON.stringify(this.collectionStore[collectionName], null),
			);
		});
	};

	private lookupCollectionData = (
		collectionName: string,
		lookupValue: string | Record<string, any>,
	): Result<lookupResult, 'Failed to lookup' | string> => {
		if (typeof lookupValue === 'string') {
			return new Ok(this.collectionStore[collectionName][lookupValue]);
		}

		if (typeof lookupValue !== 'object') return new Err('lookupValue should be a string or an object.');

		const lookupResult = Object.keys(this.collectionStore[collectionName]).reduce((acc, key) => {
			if (lookupValue[key] && lookupValue[key] === this.collectionStore[collectionName][key]) {
				acc = key;
			}
			return acc;
		}, '');

		return new Ok(lookupResult);
	};

	getCollection = (
		collectionName: string,
		force?: boolean,
	): Result<collectionStore, string | 'Collection not found'> => {
		if (!collectionName) {
			return new Err('getCollection expects name argument');
		}

		if (force || !this.collectionStore) {
			const fileExists = fs.existsSync(`${path.parse(this.databasePath)}/${collectionName}.json`);

			if (!fileExists) {
				return new Err(`Collection ${collectionName} was not found`);
			}

			const fileBuffer = fs.readFileSync(`${path.parse(this.databasePath)}/${collectionName}.json`);

			const collectionData: collectionStore = JSON.parse(fileBuffer.toString()).catch((error: SyntaxError) => {
				return new Err(`JSON parse failed: ${error.message}`);
			});

			this.collectionStore[collectionName] = collectionData;
		}

		return new Ok(this.collectionStore[collectionName]);
	};

	get = (collectionName: string, lookupValue: string | Record<string, any>): Option<Record<string, any>> => {
		const foundKey = this.lookupCollectionData(collectionName, lookupValue);

		if (foundKey.ok) {
			return Some(this.collectionStore[collectionName][foundKey.val]);
		}

		return None;
	};

	insert = (
		collectionName: string,
		key: string,
		storageObject: Record<string, any> | Record<string, any>[],
	): Result<boolean, 'Failed to insert' | string> => {
		if (Array.isArray(storageObject)) {
			storageObject.forEach((obj) => {
				Object.assign(this.collectionStore[collectionName][key], obj);
			});

			this.writeFileStore(collectionName);
			return;
		}

		if (this.collectionStore[collectionName][key]) {
			return new Err('Failed to insert, key already has data. Use the replace method instead.');
		}

		Object.assign(this.collectionStore[collectionName], storageObject);

		this.writeFileStore(collectionName);
		return new Ok(true);
	};

	update = (
		collectionName: string,
		lookupValue: string | Record<string, any>,
		storageObject: Record<string, any>,
	): Result<Record<string, any>, 'Failed to update' | string> => {
		const foundKey = this.lookupCollectionData(collectionName, lookupValue);

		if (!foundKey.ok) return new Err(foundKey.val);

		if (!foundKey.val) return new Err('Failed to update, key does not exist. Use the insert method instead.');

		Object.assign(this.collectionStore[collectionName][foundKey.val], storageObject);

		this.writeFileStore(collectionName);
		return new Ok(this.collectionStore[collectionName][foundKey.val]);
	};

	remove = (
		collectionName: string,
		lookupValue: string | Record<string, any>,
	): Result<boolean, 'Failed to remove, value does not exist' | string> => {
		const foundKey = this.lookupCollectionData(collectionName, lookupValue);

		if (!foundKey.ok) return new Err(foundKey.val);

		if (!foundKey.val) return new Ok(false);

		delete this.collectionStore[collectionName][foundKey.val];

		this.writeFileStore(collectionName);
		return new Ok(true);
	};

	replace = (
		collectionName: string,
		lookupValue: string | Record<string, any>,
		storageObject: Record<string, any>,
	): Result<Record<string, any>, 'Failed to update' | string> => {
		const foundKey = this.lookupCollectionData(collectionName, lookupValue);

		if (!foundKey.ok) return new Err(foundKey.val);

		if (!foundKey.val) return new Err('Failed to replace, key does not exist. Use the insert method instead.');

		this.collectionStore[collectionName][foundKey.val] = storageObject;

		this.writeFileStore(collectionName);
		return new Ok(this.collectionStore[collectionName][foundKey.val]);
	};
}
