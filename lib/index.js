"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBClient = void 0;
const utils_1 = require("./utils");
class DBClient {
    constructor(databasePath) {
        this.populateAllCollections = () => {
            if (!this.collectionStore)
                this.collectionStore = {};
            const directoryExists = utils_1.fs.existsSync(this.databasePath);
            if (!directoryExists) {
                utils_1.fs.mkdirSync(this.databasePath);
            }
            const dbFiles = utils_1.fs.readdirSync(this.databasePath);
            dbFiles.forEach((fileName) => {
                if (fileName.slice(fileName.length - 4, fileName.length) !== 'json') {
                    return;
                }
                this.getCollection(fileName.slice(0, fileName.length - 5), true);
            });
        };
        this.writeFileStore = (collectionName) => {
            if (collectionName) {
                utils_1.fs.writeFileSync(`${this.databasePath}/${collectionName}.json`, JSON.stringify(this.collectionStore[collectionName]));
                return;
            }
            Object.keys(this.collectionStore).forEach((collectionName) => {
                if (!this.collectionStore[collectionName])
                    return;
                utils_1.fs.writeFileSync(`${this.databasePath}/${collectionName}.json`, JSON.stringify(this.collectionStore[collectionName], null));
            });
        };
        this.lookupCollectionData = (collectionName, lookupValue) => {
            if (typeof lookupValue === 'string') {
                return new utils_1.Ok(this.collectionStore[collectionName][lookupValue] ? lookupValue : '');
            }
            if (typeof lookupValue !== 'object')
                return new utils_1.Err('lookupValue should be a string or an object.');
            const lookupResult = Object.keys(this.collectionStore[collectionName]).reduce((acc, key) => {
                if (lookupValue[key] && lookupValue[key] === this.collectionStore[collectionName][key]) {
                    acc = key;
                }
                return acc;
            }, '');
            return new utils_1.Ok(lookupResult);
        };
        this.getCollection = (collectionName, force) => {
            if (!collectionName) {
                return new utils_1.Err('getCollection expects name argument');
            }
            if (force || !this.collectionStore) {
                const fileExists = utils_1.fs.existsSync(`${this.databasePath}/${collectionName}.json`);
                if (!fileExists) {
                    return new utils_1.Err(`Collection ${collectionName} was not found`);
                }
                const fileBuffer = utils_1.fs.readFileSync(`${this.databasePath}/${collectionName}.json`);
                const collectionData = JSON.parse(fileBuffer.toString());
                this.collectionStore[collectionName] = collectionData;
            }
            return new utils_1.Ok(this.collectionStore[collectionName]);
        };
        this.get = (collectionName, lookupValue) => {
            const foundKey = this.lookupCollectionData(collectionName, lookupValue);
            if (foundKey.ok) {
                return (0, utils_1.Some)(this.collectionStore[collectionName][foundKey.val]);
            }
            return utils_1.None;
        };
        this.insert = (collectionName, key, data) => {
            if (Array.isArray(data)) {
                data.forEach((obj) => {
                    Object.assign(this.collectionStore[collectionName][key], obj);
                });
                this.writeFileStore(collectionName);
                return new utils_1.Ok(true);
            }
            if (this.collectionStore[collectionName][key]) {
                return new utils_1.Err('Failed to insert, key already has data. Use the replace method instead.');
            }
            Object.assign(this.collectionStore[collectionName], { [key]: data });
            this.writeFileStore(collectionName);
            return new utils_1.Ok(true);
        };
        this.update = (collectionName, lookupValue, data) => {
            const foundKey = this.lookupCollectionData(collectionName, lookupValue);
            if (!foundKey.ok)
                return new utils_1.Err(foundKey.val);
            if (!foundKey.val)
                return new utils_1.Err('Failed to update, key does not exist. Use the insert method instead.');
            Object.assign(this.collectionStore[collectionName][foundKey.val], data);
            this.writeFileStore(collectionName);
            return new utils_1.Ok(this.collectionStore[collectionName][foundKey.val]);
        };
        this.remove = (collectionName, lookupValue) => {
            const foundKey = this.lookupCollectionData(collectionName, lookupValue);
            if (!foundKey.ok)
                return new utils_1.Err(foundKey.val);
            if (!foundKey.val)
                return new utils_1.Ok(false);
            delete this.collectionStore[collectionName][foundKey.val];
            this.writeFileStore(collectionName);
            return new utils_1.Ok(true);
        };
        this.replace = (collectionName, lookupValue, data) => {
            const foundKey = this.lookupCollectionData(collectionName, lookupValue);
            if (!foundKey.ok)
                return new utils_1.Err(foundKey.val);
            if (!foundKey.val)
                return new utils_1.Err('Failed to replace, key does not exist. Use the insert method instead.');
            this.collectionStore[collectionName][foundKey.val] = data;
            this.writeFileStore(collectionName);
            return new utils_1.Ok(this.collectionStore[collectionName][foundKey.val]);
        };
        this.databasePath = '';
        this.collectionStore = {};
        databasePath = databasePath ? utils_1.path.format(utils_1.path.parse(databasePath)) : './db';
        if (!DBClient._instance || (DBClient._instance && DBClient._instance.databasePath !== databasePath)) {
            this.databasePath = databasePath;
            this.populateAllCollections();
            DBClient._instance = this;
        }
        return DBClient._instance;
    }
}
exports.DBClient = DBClient;
//# sourceMappingURL=index.js.map