import { Result, Option } from './utils';
type document = Record<string, any>;
type collectionStore = Record<string, document>;
declare class DBClient {
    private static _instance;
    databasePath: string;
    collectionStore: collectionStore;
    writeQueue: Set<string>;
    constructor(databasePath?: string, interval?: number);
    private populateAllCollections;
    private writeFileStore;
    private writeAllFileStore;
    private initialiseCollection;
    private lookupCollectionData;
    private writeThread;
    getCollection: (collectionName: string, force?: boolean) => Result<collectionStore, string | 'Collection not found'>;
    get: (collectionName: string, lookupValue: string | document) => Option<document | document[]>;
    insert: (collectionName: string, key: string, data: document) => Result<boolean, 'Failed to insert' | string>;
    update: (collectionName: string, lookupValue: string | document, data: document) => Result<document | document[], 'Failed to update' | string>;
    remove: (collectionName: string, lookupValue: string | document) => Result<boolean, 'Failed to remove, value does not exist' | string>;
    replace: (collectionName: string, lookupValue: string | document, data: document | document[]) => Result<document, 'Failed to update' | string>;
}
export = DBClient;
