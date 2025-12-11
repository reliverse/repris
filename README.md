# 🖨️ Repris

[💖 Sponsor Development](https://github.com/sponsors/blefnk) • [📦 NPM](https://npmjs.com/package/@reliverse/repris) • [🌌 GitHub](https://github.com/reliverse/repris)

> @reliverse/repris is a modern, fast, and lightweight alternative to printj for printf-style string formatting in JavaScript and TypeScript.

## Why Repris?

**Repris** brings C-style `printf`/`sprintf`/`vsprintf` formatting to JavaScript/TypeScript, with support for positional and named arguments, BigInt, and advanced format specifiers. It's designed for speed, correctness, and compatibility, making it ideal for CLI tools, logs, and any situation where you need precise, flexible string formatting.

- ⚡ **Blazing-fast & lightweight** — zero bloat, minimal dependencies, runtime-safe
- 🖨️ **C-style printf/vsprintf** — familiar format strings, including width, precision, flags, and more
- 🔢 **BigInt & number support** — safely formats large integers and floats
- 🧩 **Named & positional arguments** — flexible APIs for both array and object-based formatting
- 🛡️ **Cross-platform & runtime-ready** — works in Node.js, Bun, Deno, browsers, and more
- 🎯 **Drop-in alternative to printj** — but faster, safer, and more modern

## Installation

```bash
bun add @reliverse/repris
# bun • pnpm • yarn • npm
```

## API Overview

### `sprintf(fmt: string, ...args: any[]): string`

Classic C-style formatting. Returns the formatted string.

### `vsprintf(fmt: string, argv: any[]): string`

Like `sprintf`, but takes an array of arguments.

### `compileFormat(fmt: string, argMap?: FormatMap): string`

Compiles a format string with named or positional arguments to a standard format string.

### `formatString(fmt: string, args: any[] | Record<string, unknown>, argMap?: FormatMap): string`

Formats a string using either an array or an object of arguments, with optional named argument mapping.

## Usage Examples

```ts
import { sprintf, vsprintf, formatString, compileFormat } from "@reliverse/repris";

// Classic usage:
const fmt = "%-date$s %-type$s: %message$s";
const compiled = compileFormat(fmt); // "% -1$s %-2$s: %4$s"
const out = vsprintf(compiled, ["2025-04-26", "ERROR", "unused", "Disk full"]);
console.log(out); // "2025-04-26 ERROR: Disk full"

// Alternative usage with named arguments:
console.log(
  formatString(fmt, {
    date: "2025-04-26",
    type: "ERROR",
    message: "Disk full",
  }),
); // "2025-04-26 ERROR: Disk full"

// Exact 64-bit integer and alt-form binary:
console.log(sprintf("%#llx", 0x1_ffff_ffff_fffn)); // 0x1FFFFFFFFFFF
console.log(sprintf("%#B", 42)); // 0B101010
```

## Format Specifiers

- **Strings:** `%s`
- **Integers:** `%d`, `%i`, `%u`, `%o`, `%x`, `%X`, `%b`, `%B`
- **Floats:** `%f`, `%F`, `%e`, `%E`, `%g`, `%G`
- **Char:** `%c`
- **Boolean:** `%y`, `%Y` (true/false or yes/no)
- **JSON:** `%j`, `%J`
- **Width, precision, flags, and positional arguments** are supported (see below).

### Flags and Features

- Width, precision, left/right alignment, zero-padding, sign, alternate form (`#`), and more
- Supports both positional (`%2$s`) and named arguments (`%name$s` via `compileFormat`)
- Handles BigInt and large numbers safely

## Advanced Usage

### Named Arguments

You can use named arguments in your format strings by compiling them first:

```ts
const fmt = "%-date$s %-type$s: %message$s";
const compiled = compileFormat(fmt); // "% -1$s %-2$s: %4$s"
console.log(vsprintf(compiled, ["2025-04-26", "ERROR", "unused", "Disk full"]));

// Or use formatString for object-based formatting:
console.log(formatString(fmt, { date: "2025-04-26", type: "ERROR", message: "Disk full" }));
```

### BigInt and Large Numbers

```ts
console.log(sprintf("%#llx", 0x1_ffff_ffff_fffn)); // 0x1FFFFFFFFFFF
```

### Boolean and JSON

```ts
console.log(sprintf("%y", true)); // true
console.log(sprintf("%j", { foo: 42 })); // {"foo":42}
```

## Use Cases

- CLI log formatting
- Pretty-printing data for terminal or file output
- Generating reports or tabular data
- Any situation where you need robust, C-style string formatting in JS/TS

## Local Playground

```bash
git clone https://github.com/reliverse/repris
cd repris
bun i
bun dev
```

Check `examples/e-main.ts` for more examples.

## Related

- [`printj`](https://github.com/rlidwka/printj) — classic printf for JS
- [`sprintf-js`](https://github.com/alexei/sprintf.js) — another printf implementation

Repris draws inspiration from these, but is designed for modern runtimes, with better type safety and performance.

## 🛠 Contributing

We'd love your help! Bug? Feature? Example? PR it!  
Or hop into [Discord](https://discord.gg/Pb8uKbwpsJ) to discuss formatting, printf, and Reliverse tools 💜

```bash
git clone https://github.com/reliverse/repris
cd repris
bun i
```

## License

MIT © [blefnk Nazar Kornienko](https://github.com/blefnk)  
Part of the [Reliverse](https://github.com/reliverse) ecosystem
