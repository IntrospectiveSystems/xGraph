# PanelView

Version 1.0.0

Introspective Systems, LLC.

---

## Getting Started

The Most Basic Panel Require no Pars. by default it will fill the space proveided by its parent, split it in half veritcally (one panel on the left, one on the right), and place its first two children inside the panels.

Example

``` json
{
    "RootView": {
        "Module": "xGraph.RootView",
        "Par": {
            "Layout": {
                "View": "$Panel",
                "Children": [
                    "$EditorLeft",
                    "$EditorRight"
                ]
            }
        }
    },
    "Menubar": {
        "Module": "xGraph.PanelView",
        "Par": {}
    },
    "EditorLeft": {
        "Module": "xGraph.AceEditorView",
        "Par": {}
    },
    "EditorRight": {
        "Module": "xGraph.AceEditorView",
        "Par": {}
    }
}
```

## Panel Sizing

To change the sizes of the panels There is a parameter called Ratio. It is a Value from 0 to 1 and represents how much of the Width (Or Height depending on Flow Direction) the first panel takes up.

For example, if you wanted the left panel to be a third of the overall space, you would set `"Ratio": 0.33`

Example

``` json
{
    "Module": "xGraph.PanelView",
    "Par": {
      "Ratio": 0.33
    }
}
```

## Flow Direction

To change the flow from Left to Right to Top to Bottom, set `"Horizontal": true`. The Parameter references the direction of the dividing line between the panels. Vertical line: Left to right. Horizontal Line: Top to Bottom.

``` json
{
    "Module": "xGraph.PanelView",
    "Par": {
      "Horintal": true
    }
}
```