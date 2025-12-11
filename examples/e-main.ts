// 👉 `bun dev`

/*
EXPECTED OUTPUT:
2025-04-26 ERROR: Disk full
2025-04-26 ERROR: Disk full
0x1FFFFFFFFFFF
0B101010
*/

// async function main() {}
// await main();

import { sprintf, vsprintf, formatString, compileFormat } from "~/main.js";

// Classic usage:
const fmt = "%-date$s %-type$s: %message$s";
const compiled = compileFormat(fmt); // "%-1$s %-2$s: %4$s"
const out = vsprintf(compiled, ["2025-04-26", "ERROR", "unused", "Disk full"]);
console.log(out); // "2025-04-26 ERROR: Disk full"

// Alternative usage:
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
