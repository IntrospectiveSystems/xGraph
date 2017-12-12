# Menubar

Version 1.0.0

Marcus Gosselin, Introspective Systems LLC.

---

## Getting Started

Menubar takes only one Parameter, optionally: `Buttons`. Without the Parameter, nothing will break, however, nothing will be shown in the bar.

`Buttons` is an Array of objects with keys: `Command`, `To`, `Group`, and `Option`.

- `Group` The name of the top level menubar group. traditionally things like "File", "Edit", "view".
- `Option` The text displayed on the button inside the group.
- `Command` A command name to be sent when the button is pressed.
- `To` The PID to send the command to.

Example

``` json
{
    "Module": "xGraph.Widgets.Menubar",
    "Par": {
        "Buttons": [
            {
                "Group": "File",
                "Option": "Save",
                "Command": "SaveData",
                "To": "$TheDataPlace"
            }
            {
                "Group": "File",
                "Option": "Open",
                "Command": "LoadData",
                "To": "$TheDataPlace"
            }
        ]
    }
}
```

## Connecting a Menubar to other Views

Despite a Menubar just being a ribbon, as a view, its takes up the entire space of its parent. As a result of this, the area under the Menubar is considered its children. This is reflected in the Layout Pars.

For example, lets say we want a page with an Ace Text editor and a menu bar. To achieve this we would do the following

``` json
{
    "RootView": {
        "Module": "xGraph.Widgets.RootView",
        "Par": {
            "Layout": {
                "View": "$Menubar",
                "Children": [
                    "$Editor"
                ]
            }
        }
    },
    "Menubar": {
        "Module": "xGraph.Widgets.Menubar",
        "Par": {
            "Buttons": [
                {
                    "Group": "File",
                    "Option": "Save",
                    "Command": "SaveData",
                    "To": "$TheDataPlace"
                }
                {
                    "Group": "File",
                    "Option": "Open",
                    "Command": "LoadData",
                    "To": "$TheDataPlace"
                }
            ]
        }
    },
    "Editor": {
        "Module": "xGraph.Widgets.AceEditorView",
        "Par": {}
    }
}
```

## Adding Hotkeys

To add hotkeys to menu buttons, Simply Add `Hotkey` as a sting to the button in `Par`.

For non alphanumeric keys, use the table below

|Key|Symbol|
|-|-|
|Ctrl|`~`|
|alt|`/`|
|shift|`^`|
|meta|`#`|

Example

``` json
{
    "Module": "xGraph.Widgets.Menubar",
    "Par": {
        "Buttons": [
            {
                "Group": "File",
                "Option": "Save",
                "Command": "SaveData",
                "To": "$TheDataPlace",
                "Hotkey": "~s"
            }
            {
                "Group": "File",
                "Option": "Open",
                "Command": "LoadData",
                "To": "$TheDataPlace",
                "Hotkey": "~o"
            }
        ]
    }
}
```