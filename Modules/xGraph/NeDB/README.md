### NeDB

Version 1.0.0

Introspective Systems, LLC.

---

This module is a wrapper for the npm package [NeDB](https://github.com/louischatriot/nedb).

#### Module Definition Parameters

##### `Filename`

NeDB only requires one parameter in its module definition, `"Filename"`,
which is the name of the database file. The database will be loaded from
the file if it already exists, or the file will be created if it is a new
database.

Example

```json
{
  "NeDB": {
    "Module": "xGraph.NeDB",
    "Par": {
      "Filename": "./database.nedb"
    }
  }
}
```

##### `Reset`

Optionally, if you would like the database to reset when the system is
restarted, you can Provide it a parameter of `"Reset": true`.

Example

```json
{
  "NeDB": {
    "Module": "xGraph.NeDB",
    "Par": {
      "Filename": "./database.nedb",
      "Reset": true
    }
  }
}
```

#### Input Commands

##### Insert

To insert a document into the database, send an `'Insert'` command with
a `com.Document` object.

The object will be stored in the database and will have a string ID
referenced at `_id`. `'Insert'` returns an object with the key
`com.Document._id` so you can reference your document later by ID.

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
  log.i('the document\'s new id is ' + cmd.Document._id);
});
```

##### Find

The `'Find'` command is used to retrieve documents. The command object
must include a query object, `com.Where`.

The only guaranteed way to retrieve a single document is by its `_id`.
However, you can also return the set of all documents that meet a set
of conditions.

The `'Find'` command requires a query object, `com.Where`. This
query object specifies what your query string is looking for.

For example, given a database of documents,

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
let cmd = {
            Cmd: 'Find',
            Where: {
                pet: 'cat'
            }
          };

this.send(cmd, this.Par.Database, callback);

function callback(err, cmd){
  for(let doc of cmd.Documents) {
    log.i(JSON.stringify(doc));
  }
}
```

will print out

```
{"_id": 0, "name": "billy", "pet": "cat"}
{"_id": 4, "name": "joe", "pet": "cat"}
```

##### Remove

The `'Remove'` command deletes a document (or many at once). The command
object must include a query object, `com.Where`.

The only guaranteed way to retrieve a single document is by its `_id`.
However, you can also return the set of all documents that meet a set
of conditions.

The `'Remove'` command requires a query object, `com.Where`. This
query object specifies what your query string is looking for.

`'Remove'` returns the number of documents that were deleted in `com.DeletedCount`.

For example, given a database of documents,

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
let cmd = {
            Cmd: 'Remove',
            Where: {
              pet: 'cat'
            }
          };

this.send(cmd, this.Par.Database, callback);

function callback(err, cmd){
  log.i(cmd.DeletedCount);
}
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