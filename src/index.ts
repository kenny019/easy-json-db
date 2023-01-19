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

		DBClient._instance = this;
	}

	getCollection = (name, force?: boolean): Result<collectionStore, string | 'Collection not found'> => {
		if (force || !this.collectionStore) {
			const fileExists = fs.existsSync(`${path.parse(this.databasePath)}/${name}.json`);

			if (!fileExists) {
				return new Err(`Collection ${name} was not found`);
			}

			const fileBuffer = fs.readFileSync(`${path.parse(this.databasePath)}/${name}.json`);

			const collectionData: collectionStore = JSON.parse(fileBuffer.toString()).catch((error: SyntaxError) => {
				return new Err(`JSON parse failed: ${error.message}`);
			});

			this.collectionStore = collectionData;
		}

		return new Ok(this.collectionStore);
	};
}
