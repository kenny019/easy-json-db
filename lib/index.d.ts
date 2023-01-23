import { Result, Option } from './utils';
type collectionStore = Partial<Record<string, object>>;
export declare class DBClient {
    private static _instance;
    databasePath: string;
    collectionStore: collectionStore;
    constructor(databasePath?: string);
    private populateAllCollections;
    private writeFileStore;
    private lookupCollectionData;
    getCollection: (collectionName: string, force?: boolean) => Result<collectionStore, string | 'Collection not found'>;
    get: (collectionName: string, lookupValue: string | Record<string, any>) => Option<Record<string, any>>;
    insert: (collectionName: string, key: string, storageObject: Record<string, any> | Record<string, any>[]) => Result<boolean, 'Failed to insert' | string>;
    update: (collectionName: string, lookupValue: string | Record<string, any>, storageObject: Record<string, any>) => Result<Record<string, any>, 'Failed to update' | string>;
    remove: (collectionName: string, lookupValue: string | Record<string, any>) => Result<boolean, 'Failed to remove, value does not exist' | string>;
    replace: (collectionName: string, lookupValue: string | Record<string, any>, storageObject: Record<string, any>) => Result<Record<string, any>, 'Failed to update' | string>;
}
export {};
