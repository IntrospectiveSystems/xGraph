# NeDB

Version 1.0.0

Introspective Systems, LLC.

---

This module is a wrapper for the npm package [NeDB](https://github.com/louischatriot/nedb).

## Getting Started

### `Filename`

NeDB Takes only one Par, `Filename`, which is where the database will be stored or loaded from if it already exists.

Example

```json
{
  "NeDB": {
    "Module": "xGraph.Database.NeDB",
    "Par": {
      "Filename": "./database.nedb"
    }
  }
}
```

### `Reset`

Additionally, If you would like the database to reset on the system restarting, you can Provide it a Par of `Reset: true`.

Example

```json
{
  "NeDB": {
    "Module": "xGraph.Database.NeDB",
    "Par": {
      "Filename": "./database.nedb",
      "Reset": true
    }
  }
}
```

## Input Commands

### Add a Document

To insert a document into the database, you need to send and `Insert` command with a `com.Document` object. The object will be store in the database and be given an `_id` as a string.

in the callback of the `Insert` command, `com.Document._id` will exist so you can reference your document later by id.

Example

``` javascript
this.send({
  Cmd: 'Insert',
  Document: {
    Example: 'Document',
    Data: [
      1, 2, 3, 4, 5
    ]
  }
}, this.Par.Database, (err, cmd) => {
  log.d('the document\'s new id is ' + cmd.Document._id);
});
```

### Retrieving a document(s)

The only guaranteed way to retrieve a single document is by its `_id`. however, you can also return the set of all documents that fulfil a particular set of values.

The command to retrieve documents is `Find`. In the command should be a query object: `com.Where`. This query object should contain examples of what your query string is looking for. 

For example, Given a database of documents

``` json
[
  {"_id": 0, "name": "billy", "pet": "cat"},
  {"_id": 1, "name": "bob", "pet": "dog"},
  {"_id": 2, "name": "susie", "pet": "none"},
  {"_id": 3, "name": "alice", "pet": "none"},
  {"_id": 4, "name": "joe", "pet": "cat"},
  {"_id": 5, "name": "mary", "pet": "lizard"}
]
```

the code

``` javascript
this.send({
  Cmd: 'Find',
  Where: {
    pet: 'cat'
  }
}, this.Par.Database, (err, cmd) => {
  for(let doc of cmd.Documents) {
    log.d(JSON.stringify(doc));
  }
});
```

will print out

```
{"_id": 0, "name": "billy", "pet": "cat"}
{"_id": 4, "name": "joe", "pet": "cat"}
```

### Deleting a Document(s)

Deleting a document (or many at once) uses the command `Remove` and is similar to finding a document, except instead of the documents being returned back to you, they are removed from the database. Afterwards, you are returned the number of documents that were deleted in `com.DeletedCount`

given database

``` json
[
  {"_id": 0, "name": "billy", "pet": "cat"},
  {"_id": 1, "name": "bob", "pet": "dog"},
  {"_id": 2, "name": "susie", "pet": "none"},
  {"_id": 3, "name": "alice", "pet": "none"},
  {"_id": 4, "name": "joe", "pet": "cat"},
  {"_id": 5, "name": "mary", "pet": "lizard"}
]
```

the code

``` javascript
this.send({
  Cmd: 'Remove',
  Where: {
    pet: 'cat'
  }
}, this.Par.Database, (err, cmd) => {
  log.d(cmd.DeletedCount);
});
```

will print out

```
2
```

and leave you with the database:

``` json
[
  {"_id": 1, "name": "bob", "pet": "dog"},
  {"_id": 2, "name": "susie", "pet": "none"},
  {"_id": 3, "name": "alice", "pet": "none"},
  {"_id": 5, "name": "mary", "pet": "lizard"}
]
```