import { fs, Ok, Err, Result, path } from './utils';

type collectionStore = Partial<Record<string, object>>;

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

	get = (
		collectionName: string,
		lookupValue: string | Record<string, any>,
	): Result<object, string | 'Document not found'> => {
		if (typeof lookupValue === 'string') return new Ok(this.collectionStore[collectionName][lookupValue] || {});

		if (typeof lookupValue !== 'object') return new Err('lookupValue should be a string or an object.');

		const lookupData = Object.keys(this.collectionStore[collectionName]).reduce((acc, key) => {
			if (lookupValue[key] && lookupValue[key] === this.collectionStore[collectionName][key]) {
				acc = lookupValue[key];
			}
			return acc;
		}, {});

		return new Ok(lookupData);
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
}
