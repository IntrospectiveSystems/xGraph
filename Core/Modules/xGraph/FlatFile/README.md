# FlatFile v1.1.0

_Introspective Systems, LLC_

---

Creates a Flat File database using JSON format. By default data is saved in local working directory as Database.db.
Records are simply overwritten on new Put commands.


---

### Parameters

**Database**: _String_ - Full filename and path to load and store data. Defaults to 'Database.db'.

### Input Commands

**Get** -  Get a single record value by key, return in com.Info[key].
```json
{
  "Cmd": "Get", 
  "Key": "KeyName"
}
```

**Put** - Add a record to the database, stores all key value pairs contained in com.Data.
```json
{
  "Cmd": "Put", 
  "Data": {
    "Key1": "Value1",
    "Key2": "Value2",
    "Key3": "Value3"
  }
}
```

**Delete** - Deletes every record as defined in com.Data.
```json
{
  "Cmd": "Delete", 
  "Data": ["Key1", "Key2", "Key3"]
}
```

**List** - List all keys stored in the database, returns as array in com.Info. *Requires no additional parameters*



### Output Commands

*None*