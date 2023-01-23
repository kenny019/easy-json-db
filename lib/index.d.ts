import { Result, Option } from './utils';
type document = Record<string, any>;
type collectionStore = Record<string, document>;
export declare class DBClient {
    private static _instance;
    databasePath: string;
    collectionStore: collectionStore;
    constructor(databasePath?: string);
    private populateAllCollections;
    private writeFileStore;
    private lookupCollectionData;
    getCollection: (collectionName: string, force?: boolean) => Result<collectionStore, string | 'Collection not found'>;
    get: (collectionName: string, lookupValue: string | document) => Option<document>;
    insert: (collectionName: string, key: string, data: document | document[]) => Result<boolean, 'Failed to insert' | string>;
    update: (collectionName: string, lookupValue: string | document, data: document) => Result<document, 'Failed to update' | string>;
    remove: (collectionName: string, lookupValue: string | document) => Result<boolean, 'Failed to remove, value does not exist' | string>;
    replace: (collectionName: string, lookupValue: string | document, data: document) => Result<document, 'Failed to update' | string>;
}
export {};
