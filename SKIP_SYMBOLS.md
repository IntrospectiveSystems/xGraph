# Skip Symbol Processing

This feature allows you to control symbol processing in xGraph configuration files using `!` and `!!` prefixes on configuration keys.

## Overview

By default, xGraph processes all symbols in your configuration:
- `{macro}` - Macro replacements
- `$Reference` - Module references
- `@directive:path` - File/config directives

Sometimes you want to pass configuration data **without** symbol processing. The skip symbol prefixes let you control this behavior.

## Usage

### `!!` - Skip ALL Processing

When a key starts with `!!`, the value is kept exactly as-is with **no symbol processing at all**. The key is saved without the `!!` prefix.

**Example:**
```json
{
  "Modules": {
    "MyModule": {
      "Module": "MyModule",
      "Source": "xGraph",
      "Par": {
        "!!rawConfig": "@config:/path/to/config.json"
      }
    }
  }
}
```

**Result:** `rawConfig` will contain the literal string `"@config:/path/to/config.json"` instead of loading the file.

### `!` - Skip Sub-Property Processing

When a key starts with `!`, the immediate value is processed normally, but any nested properties are **not processed**. The key is saved without the `!` prefix.

**Example:**
```json
{
  "Modules": {
    "MyModule": {
      "Module": "MyModule",
      "Source": "xGraph",
      "Par": {
        "!partialConfig": "@config:/path/to/config.json"
      }
    }
  }
}
```

If `/path/to/config.json` contains:
```json
{
  "value": "{someMacro}",
  "nested": {
    "deep": "@path:/another/path"
  }
}
```

**Result:**
- `partialConfig` will contain the loaded JSON object
- But `{someMacro}` and `@path:/another/path` will remain as literal strings (not processed)

## Use Cases

### 1. Passing Configuration Templates
```json
"!template": {
  "endpoint": "{API_ENDPOINT}",
  "key": "{API_KEY}"
}
```
The macros are preserved for later processing by your module.

### 2. Storing Raw Directive Strings
```json
"!!directives": [
  "@file:/path/one",
  "@path:/path/two"
]
```
The directives are stored as strings, not executed.

### 3. Complex Nested Configs
```json
"!userConfig": "@config:/user/settings.json"
```
Load a user's config file but don't process any symbols in it.

## Processing Phases

The skip logic is applied during symbol processing phases:

1. **Phase 0** (Macro `{...}` processing) - Respects `!` and `!!` prefixes
2. **Phase 1** (`$` references) - Respects skip flags
3. **Phase 2** (`@system` directives) - Respects skip flags
4. **Phase 3** (`@file`, `@config`, etc.) - Respects skip flags

When `!` is used, Phase 3 processes the immediate value but marks sub-properties to skip all subsequent processing.

## Examples

### Full Processing (Default)
```json
"config": {
  "path": "@path:/some/path",
  "macro": "{xGraph}",
  "ref": "$OtherModule"
}
```
All symbols processed normally.

### Skip All Processing (`!!`)
```json
"!!config": {
  "path": "@path:/some/path",
  "macro": "{xGraph}",
  "ref": "$OtherModule"
}
```
Result: Exact same structure, no processing.

### Skip Sub-Properties (`!`)
```json
"!config": "@config:/external.json"
```
If `/external.json` is:
```json
{
  "value": "{macro}",
  "path": "@path:/test"
}
```

Result: `config` contains:
```json
{
  "value": "{macro}",
  "path": "@path:/test"
}
```
(The file is loaded, but symbols inside are not processed)

## Notes

- The `!` or `!!` prefix is removed from the final key name
- Array elements are processed according to their parent's skip flag
- Skip flags only affect the key they're attached to and its descendants
- You can mix skip and non-skip keys in the same configuration object