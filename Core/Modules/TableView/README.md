# PanelView

Version 1.0.0

Introspective Systems, LLC.

---

## Getting Started

TableView is a module for creating a sortable HTML Table.

To show data, the TableView needs at least 2 Pars, `Source` and `Columns`.

`Source` is the module that TableView will send `GetData` to, to obtain the data that will go in the rows.

`Columns` is an array of objects of `Name` and `Key` values that tell the table what columns it should be pulling out of the response from `Source`. `Key` is the name of the Data in com, and `Name` is the name to be shown in the table headers.

Example

``` json
{
    "Module": "xGraph.Widgets.TableView",
    "Par": {
        "Source": "$Tickets",
        "Columns": [
            {
                "Name": "#",
                "Key": "Pid"
            },
            {
                "Name": "Summary",
                "Key": "Summary"
            },
            {
                "Name": "Priority",
                "Key": "Priority"
            },
            {
                "Name": "Severity",
                "Key": "Severity"
            }
        ]
    }
}
```

## Evoke

If your rows are references to modules in the system, you can use the `Evoke` Par. When set, it will add a column to the right, and each row will have its Value. So if the Evoke was to View that module, you would set `"Evoke": "View"`. 

Note: this will only work if the Data you are requesting from `Source` returns a `Pid` for each row.

Example

``` json
{
    "Module": "xGraph.Widgets.TableView",
    "Par": {
        "Source": "$Tickets",
        "Evoke": "View",
        "Columns": [
            {
                "Name": "#",
                "Key": "Pid"
            },
            {
                "Name": "Summary",
                "Key": "Summary"
            },
            {
                "Name": "Priority",
                "Key": "Priority"
            },
            {
                "Name": "Severity",
                "Key": "Severity"
            }
        ]
    }
}
```

