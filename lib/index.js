"use strict";
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
            Object.keys(this.collectionStore).forEach((collectionKey) => {
                if (!this.collectionStore[collectionKey])
                    return;
                utils_1.fs.writeFileSync(`${this.databasePath}/${collectionName}.json`, JSON.stringify(this.collectionStore[collectionKey], null));
            });
        };
        this.initialiseCollection = (collectionName) => {
            if (!collectionName || collectionName.length < 1) {
                collectionName = 'db';
            }
            if (this.collectionStore[collectionName])
                return;
            const collectionExists = utils_1.fs.existsSync(`${this.databasePath}/${collectionName}.json`);
            if (collectionExists)
                return;
            this.collectionStore[collectionName] = {};
            utils_1.fs.writeFileSync(`${this.databasePath}/${collectionName}.json`, '{}');
        };
        this.lookupCollectionData = (collectionName, lookupValue) => {
            if (!collectionName) {
                return new utils_1.Err('collectionName should be a string with more than one character.');
            }
            if (typeof lookupValue === 'string') {
                return new utils_1.Ok(this.collectionStore[collectionName][lookupValue] ? lookupValue : '');
            }
            if (typeof lookupValue !== 'object')
                return new utils_1.Err('lookupValue should be a string or an object.');
            const output = Object.keys(this.collectionStore[collectionName]).reduce((acc, key) => {
                if ((0, utils_1.isDeepStrictEqual)(lookupValue, this.collectionStore[collectionName][key])) {
                    acc.push(key);
                }
                return acc;
            }, []);
            return new utils_1.Ok(output);
        };
        this.getCollection = (collectionName, force) => {
            if (!collectionName) {
                return new utils_1.Err('getCollection expects name argument');
            }
            this.initialiseCollection(collectionName);
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
            this.initialiseCollection(collectionName);
            const foundKey = this.lookupCollectionData(collectionName, lookupValue);
            if (foundKey.ok) {
                if (Array.isArray(foundKey.val)) {
                    return (0, utils_1.Some)(foundKey.val.map((key) => {
                        return this.collectionStore[collectionName][key];
                    }));
                }
                return (0, utils_1.Some)(this.collectionStore[collectionName][foundKey.val]);
            }
            return utils_1.None;
        };
        this.insert = (collectionName, key, data) => {
            this.initialiseCollection(collectionName);
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
            this.initialiseCollection(collectionName);
            const foundKey = this.lookupCollectionData(collectionName, lookupValue);
            if (!foundKey.ok)
                return new utils_1.Err(foundKey.val);
            if (!foundKey.val)
                return new utils_1.Err('Failed to update, key does not exist. Use the insert method instead.');
            let output;
            if (Array.isArray(foundKey.val)) {
                output = foundKey.val.map((key) => {
                    return Object.assign(this.collectionStore[collectionName][key], data);
                });
            }
            else {
                output = Object.assign(this.collectionStore[collectionName][foundKey.val], data);
            }
            this.writeFileStore(collectionName);
            return new utils_1.Ok(output);
        };
        this.remove = (collectionName, lookupValue) => {
            this.initialiseCollection(collectionName);
            const foundKey = this.lookupCollectionData(collectionName, lookupValue);
            if (!foundKey.ok)
                return new utils_1.Err(foundKey.val);
            if (!foundKey.val)
                return new utils_1.Ok(false);
            if (Array.isArray(foundKey.val)) {
                foundKey.val.forEach((key) => {
                    delete this.collectionStore[collectionName][key];
                });
            }
            else {
                delete this.collectionStore[collectionName][foundKey.val];
            }
            this.writeFileStore(collectionName);
            return new utils_1.Ok(true);
        };
        this.replace = (collectionName, lookupValue, data) => {
            this.initialiseCollection(collectionName);
            const foundKey = this.lookupCollectionData(collectionName, lookupValue);
            if (!foundKey.ok)
                return new utils_1.Err(foundKey.val);
            if (!foundKey.val)
                return new utils_1.Err('Failed to replace, key does not exist. Use the insert method instead.');
            let output;
            if (Array.isArray(foundKey.val)) {
                output = foundKey.val.map((key) => {
                    return (this.collectionStore[collectionName][key] = data);
                });
            }
            else {
                this.collectionStore[collectionName][foundKey.val] = data;
                output = data;
            }
            this.writeFileStore(collectionName);
            return new utils_1.Ok(output);
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
module.exports = DBClient;
//# sourceMappingURL=index.js.map