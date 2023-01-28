"use strict";
const utils_1 = require("./utils");
class DBClient {
    constructor(databasePath, interval) {
        this.initialiseDBWatch = () => {
            const unixTimeNow = Math.floor(Date.now() / 1000);
            this.collectionMetadata = Object.keys(this.collectionStore).reduce((acc, key) => {
                Object.assign(acc, {
                    [key]: {
                        last_updated: unixTimeNow,
                    },
                });
                return acc;
            }, {});
            const dbWatcher = (0, utils_1.watch)(this.databasePath, {
                awaitWriteFinish: {
                    stabilityThreshold: 2000,
                    pollInterval: 100,
                },
            });
            dbWatcher.on('change', (filePath, stats) => {
                const fileChanged = utils_1.path.parse(filePath).base;
                const [fileName, fileExtension] = fileChanged.split('.');
                const currentUnixTime = Math.floor(Date.now() / 1000);
                if (fileExtension !== 'json' || !stats) {
                    return;
                }
                if (!this.collectionMetadata[fileName]) {
                    if (!this.collectionStore[fileName]) {
                        return;
                    }
                    Object.assign(this.collectionMetadata[fileName], {
                        last_updated: currentUnixTime,
                    });
                    this.getCollection(fileName, true);
                    return;
                }
                // means the file was likely manually edited
                if (Math.floor(stats.mtimeMs / 1000) > this.collectionMetadata[fileName].last_updated) {
                    this.collectionMetadata[fileName].last_updated = currentUnixTime;
                    this.getCollection(fileName, true);
                    return;
                }
            });
        };
        this.updateCollectionMetadata = (collectionName) => {
            Object.assign(this.collectionMetadata[collectionName], {
                last_updated: Math.floor(Date.now() / 1000),
            });
        };
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
            return new Promise((res, rej) => {
                const filePath = `${this.databasePath}/${collectionName}.json`;
                if (!collectionName)
                    return res([false, Error('Missing collectionName')]);
                if (collectionName) {
                    utils_1.fs.writeFile(filePath, JSON.stringify(this.collectionStore[collectionName] || {}), (err) => {
                        this.updateCollectionMetadata(collectionName);
                        return res([true, {}]);
                    });
                }
            });
        };
        this.writeAllFileStore = () => {
            Object.keys(this.collectionStore).forEach((collectionName) => {
                if (!this.collectionStore[collectionName])
                    return;
                utils_1.fs.writeFileSync(`${this.databasePath}/${collectionName}.json`, JSON.stringify(this.collectionStore[collectionName], null));
                this.updateCollectionMetadata(collectionName);
            });
        };
        this.initialiseCollection = (collectionName) => {
            if (!collectionName || collectionName.length < 1) {
                collectionName = 'db';
            }
            if (this.collectionStore[collectionName])
                return;
            const pathName = `${this.databasePath}/${collectionName}.json`;
            const collectionExists = utils_1.fs.existsSync(pathName);
            if (!collectionExists) {
                this.collectionStore[collectionName] = {};
                utils_1.fs.writeFileSync(pathName, '{}');
                return;
            }
            const stats = utils_1.fs.statSync(pathName);
            if (stats.size < 1) {
                this.collectionStore[collectionName] = {};
                utils_1.fs.writeFileSync(pathName, '{}');
                return;
            }
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
        this.writeThread = (interval = 2000) => {
            const writeQueue = [];
            this.writeQueue.forEach((collectionName) => {
                writeQueue.push(this.writeFileStore(collectionName));
            });
            Promise.all(writeQueue).then(() => {
                this.writeQueue.forEach((collectionName) => { });
                this.writeQueue.clear();
                setTimeout(() => this.writeThread(interval), interval);
            });
        };
        this.getCollection = (collectionName, force) => {
            if (!collectionName) {
                return new utils_1.Err('getCollection expects name argument');
            }
            this.initialiseCollection(collectionName);
            const pathName = `${this.databasePath}/${collectionName}.json`;
            if (force || !this.collectionStore) {
                const fileExists = utils_1.fs.existsSync(pathName);
                if (!fileExists) {
                    return new utils_1.Err(`Collection ${collectionName} was not found`);
                }
                const fileBuffer = utils_1.fs.readFileSync(pathName);
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
            if (this.collectionStore[collectionName][key]) {
                return new utils_1.Err('Failed to insert, key already has data. Use the replace method instead.');
            }
            Object.assign(this.collectionStore[collectionName], { [key]: data });
            this.writeQueue.add(collectionName);
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
            this.writeQueue.add(collectionName);
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
            this.writeQueue.add(collectionName);
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
            this.writeQueue.add(collectionName);
            return new utils_1.Ok(output);
        };
        this.databasePath = '';
        this.collectionStore = {};
        this.collectionMetadata = {};
        this.writeQueue = new Set();
        databasePath = databasePath ? utils_1.path.format(utils_1.path.parse(databasePath)) : './db';
        if (!DBClient._instance || (DBClient._instance && DBClient._instance.databasePath !== databasePath)) {
            this.databasePath = databasePath;
            this.populateAllCollections();
            this.initialiseDBWatch();
            DBClient._instance = this;
        }
        setTimeout(() => this.writeThread(interval), interval);
        return DBClient._instance;
    }
}
module.exports = DBClient;
//# sourceMappingURL=index.js.map