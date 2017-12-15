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