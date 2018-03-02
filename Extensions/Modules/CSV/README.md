### CSV

v1.0

Introspective Systems

---

CSV provides an interface for saving data in a CSV file. The CSV module
provides the ability to read and write CSV files, and append and delete
records.


### Module Interface

#### Module Definition Parameters (`this.Par`)

Parameters are defined in the module definition and stored in `this.Par`.
Below, the Parameters that CSV expects are defined.

- **Par.File** (*required*): The file (or file path) to be accessed.
                                Defaults to `"NewFile.csv"`.
- **Par.Header** : An array of strings representing the header row of
                    the CSV file. The number of columns in the header
                    must match the number of columns in each CSV record.

---

#### Output Commands
The Output Commands are all the command that CSV can send.

(*CSV does not send any commands.*)


---

#### Input Commands
In addition to Start and Setup, CSV can receive four commands to
interact with the CSV file, and two commands to interact with CSV
objects. The commands CSV can receive are:
- Setup
- Start
- ReadFile
- WriteFile
- AppendRecords
- DeleteRecord
- ObjectsToCSV
- CSVToObjects

##### Setup(com, fun)
Setup is sent when the CSV module is first generated. Here, the connection
to the FileSystem (fs) is established and saved to `Vlt.Fs`.

###### Parameters
- **com** (*required*): The command object.
- **fun** (*required*): The callback function.


##### Start(com, fun)
The Start command checks to make sure the given file (Par.File) exists. If it
does not exist, the file is created.

###### Parameters
- **com** (*required*): The command object.
- **fun** (*required*): The callback function.


##### ReadFile(com, fun)
ReadFile reads all the records in the given file (`Par.File`) and returns
the records as an array of objects. If the file has a header (`Par.Header`),
the header is used as keys for the records. If the file does not have a header,
the records will be returned as arrays (objects with indexed keys).

###### Parameters
- **com** (*required*): The command object.
- **fun** (*required*): The callback function.

###### Returns
- **com.RecordObjects**: An array of records as objects read from the
                            given file (`Par.File`).


##### WriteFile(com, fun)
WriteFile takes an array of record objects and writes them to the given
file (`Par.File`). If the file has a header (`Par.Header`), the header row
will be written to the file before the given records.

###### Parameters
- **com** (*required*): The command object.
- **com.RecordObjects** (*required*): An array of records as objects to be written to the
                            given file (`Par.File`).
- **fun** (*required*): The callback function.


##### AppendRecords(com, fun)
AppendRecords takes an array of record objects and appends the records
to the end of the given file (`Par.File`). AppendRecords does not overwrite
the current contents of a file.

###### Parameters
- **com** (*required*): The command object.
- **com.RecordObjects** (*required*): An array of records as objects to be appended to the
                            given file (`Par.File`).
- **fun** (*required*): The callback function.


##### DeleteRecord(com, fun)
DeleteRecord takes a single record object and removes the first instance
of that record from the file. If the record cannot be found in the file,
`com.DeletedRecord` will return as `false`.

###### Parameters
- **com** (*required*): The command object.
- **com** (*required*): A record as an object that will be deleted from the file.
- **fun** (*required*): The callback function.

###### Returns
- **com.DeletedRecord**: True if the record was successfully deleted,
                            false if the record could not be found.


##### ObjectsToCSV(com, fun)
ObjectsToCSV takes an array of objects and returns the objects as a CSV
string.

###### Parameters
- **com** (*required*): The command object.
- **com.RecordObjects** (*required*): An array of records as objects to
                                        be converted to a CSV string.
- **fun** (*required*): The callback function.


##### CSVToObjects(com, fun)
CSVToObjects takes an array of records as strings and returns the records
as an array of record Objects. If the file has a header, the objects will
use the header strings as keys, and the record strings as values.

###### Parameters
- **com** (*required*):             The command object.
- **com.Records** (*required*):	    An array of records as CSV strings.
- **fun** (*required*):             The callback function.

###### Returns
- **com.RecordObjects**:    An array of records as objects, parsed from the
                            records from `com.Records`.
