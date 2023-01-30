# easy-json-db

![tests workflow](https://github.com/kenny019/easy-json-db/actions/workflows/tests.yml/badge.svg)

Simple to use JSON file system meant for discord bots. It was designed and built for small and prototype applications.

# Breakdown

### Features

-   Small and lightweight.
-   Typescript typings.
-   Easy to edit raw data.

### Drawbacks

-   Not very performant
-   Minimal features
-   You pledge alliance to the JSON overlords.

# Usage guide

Installation

```
npm install easy-json-db
```

Create a database, insert and read an object

```js
const DBClient = require('easy-json-db');

const db = new DBClient();

const insertResult = db.insert('users', 'Klein', {
	admin: false,
});

if (!insertResult.ok) {
	console.error(insertResult.err);
}

if (insertResult.ok) {
	const getResult = db.get('users', 'Klein');

	const userData = getResult.some ? getResult.val : {};

	console.log(userData);
}
```
