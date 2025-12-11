type Any = unknown[];
type Flags = string;

/* ---------------------------------------------------------------- *\
   Helpers
\* ---------------------------------------------------------------- */

/** cheap "is the argument a safe 53-bit int" test */
const isSafe = (n: number): boolean => Number.isSafeInteger(n);

/** ensure we always return a BigInt without throwing on garbage */
const toBig = (v: unknown): bigint => {
  try {
    return typeof v === "bigint" ? v : BigInt(v as any);
  } catch {
    return 0n;
  }
};

/** width / precision reader — handles "*", "*3$", "12" etc. */
const readStar = (
  argv: Any,
  next: () => unknown,
  tok?: string,
): number | undefined => {
  if (!tok) return undefined;
  if (tok === "*") return Number(next());
  if (tok.startsWith("*")) return Number(argv[Number(tok.slice(1, -1)) - 1]);
  return Number(tok);
};

/** sign helper for d / i / f / g conversions */
const signStr = (n: number, flags: Flags) =>
  n < 0 ? "-" : flags.includes("+") ? "+" : flags.includes(" ") ? " " : "";

/** string left/right pad */
const pad = (
  s: string,
  w: number | undefined,
  left: boolean,
  padZero: boolean,
): string => {
  if (w === undefined || s.length >= w) return s;
  const fill = (padZero ? "0" : " ").repeat(w - s.length);
  return left ? s + fill : fill + s;
};

/* ---------------------------------------------------------------- *\
   The one and only printf-token regex  (captures are numbered!)
\* ---------------------------------------------------------------- */
const FMT =
  /* %      [pos]    [flags]   [width]      [.prec]         [len]             [verb] */
  /%(?:%|(\d+\$)?([-+ 0#']*)(\*|\*?\d+\$|\d+)?(?:\.(\*|\*?\d+\$|\d+))?(hh?|ll?|[hlL])?([bcdefgiosuxXyYjJB]))/g;

/* ---------------------------------------------------------------- *\
   Core formatter
\* ---------------------------------------------------------------- */

export function vsprintf(fmt: string, argv: Any): string {
  /* ultra-fast bailout when format has no "%" at all */
  if (!fmt.includes("%")) return fmt;

  let ap = 0; // implicit arg pointer

  const next = (pos?: string): unknown =>
    pos ? argv[Number(pos.slice(0, -1)) - 1] : argv[ap++];

  return fmt.replace(
    FMT,
    (_m, pos, flags, widthRaw, precRaw, _len, conv: string) => {
      flags = flags === undefined ? "" : flags;
      /* "%%" → literal % (don't touch) */
      if (conv === "%" || _m === "%%") return "%";

      const width = readStar(argv, () => next(pos), widthRaw);
      const prec = readStar(argv, () => next(pos), precRaw);
      const arg = next(pos);

      switch (conv) {
        /* --------------------------- STRING --------------------------- */
        case "s": {
          let str = arg == null ? "<undef>" : String(arg);
          if (prec !== undefined) str = str.slice(0, prec);
          return pad(str, width, flags.includes("-"), flags.includes("0"));
        }

        /* --------------------------- INTS ----------------------------- */
        case "d":
        case "i":
        case "u":
        case "o":
        case "x":
        case "X":
        case "b":
        case "B": {
          const upper = conv === "X" || conv === "B";
          const radix =
            conv === "o"
              ? 8
              : conv === "x" || conv === "X"
                ? 16
                : conv === "b" || conv === "B"
                  ? 2
                  : 10;

          let numStr: string;
          let prefix = "";

          /* BigInt path, or unsafe Number path */
          if (typeof arg === "bigint" || !isSafe(Number(arg))) {
            const bi = toBig(arg);
            numStr = (bi < 0n ? -bi : bi).toString(radix);
            if (prec !== undefined) numStr = numStr.padStart(prec, "0");
            if (upper) numStr = numStr.toUpperCase();
            if (
              (conv === "d" || conv === "i") &&
              (bi < 0n || flags.match(/[ +]/))
            ) {
              prefix = bi < 0n ? "-" : flags.includes("+") ? "+" : " ";
            }
          } else {
            const n = Math.trunc(Math.abs(Number(arg)));
            numStr = n.toString(radix);
            if (prec !== undefined) numStr = numStr.padStart(prec, "0");
            if (upper) numStr = numStr.toUpperCase();
            if ((conv === "d" || conv === "i") && flags.match(/[ +]/))
              prefix = signStr(Number(arg), flags);
          }

          /* alternate-form prefixes */
          if (
            flags.includes("#") &&
            arg !== 0 &&
            conv !== "d" &&
            conv !== "i" &&
            conv !== "u"
          ) {
            if (conv === "o") prefix = "0";
            if (conv === "x") prefix = "0x";
            if (conv === "X") prefix = "0X";
            if (conv === "b") prefix = "0b";
            if (conv === "B") prefix = "0B";
          }

          return pad(
            prefix + numStr,
            width,
            flags.includes("-"),
            flags.includes("0") && !flags.includes("-"),
          );
        }

        /* --------------------------- FLOATS --------------------------- */
        case "f":
        case "F":
        case "e":
        case "E":
        case "g":
        case "G": {
          const n = Number(arg);
          if (!Number.isFinite(n))
            return pad(String(n), width, flags.includes("-"), false);

          const p = prec ?? 6;
          let s =
            conv === "f" || conv === "F"
              ? n.toFixed(p)
              : conv === "e" || conv === "E"
                ? n.toExponential(p)
                : n.toPrecision(p);

          if (conv === "E" || conv === "G") s = s.toUpperCase();

          if (!s.startsWith("-") && flags.match(/[ +]/))
            s = signStr(n, flags) + s;

          if (flags.includes("#") && !s.includes(".")) {
            const eIdx = s.indexOf("E");
            s = eIdx > -1 ? `${s.slice(0, eIdx)}.${s.slice(eIdx)}` : `${s}.`;
          }

          return pad(
            s,
            width,
            flags.includes("-"),
            flags.includes("0") && !flags.includes("-"),
          );
        }

        /* --------------------------- CHAR ----------------------------- */
        case "c": {
          const code =
            typeof arg === "string" ? arg.charCodeAt(0) : Number(arg) || 0;
          return pad(
            String.fromCharCode(code),
            width,
            flags.includes("-"),
            false,
          );
        }

        /* ------------------------- BOOLEAN --------------------------- */
        case "y":
        case "Y": {
          const truthy = !!arg;
          let base = flags.includes("#")
            ? truthy
              ? "yes"
              : "no"
            : truthy
              ? "true"
              : "false";
          if (conv === "Y") base = base.toUpperCase();
          return pad(
            base,
            width,
            flags.includes("-"),
            flags.includes("0") && !flags.includes("-"),
          );
        }

        /* --------------------------- JSON ---------------------------- */
        case "J":
        case "j": {
          const json = JSON.stringify(arg);
          return pad(json, width, flags.includes("-"), false);
        }

        /* fall through – unknown verb, keep literal text */
        default:
          return _m;
      }
    },
  );
}

/** classic wrapper — identical signature to C `sprintf` */
export const sprintf = (fmt: string, ...args: Any) => vsprintf(fmt, args);

/* ---------------------------------------------------------------- *\
   Named-argument helpers
\* ---------------------------------------------------------------- */

/** default 1-based mapping used by compileFormat / formatString */
const FORMAT_ARGS = [
  "date", // 1
  "type", // 2
  "level", // 3
  "message", // 4
] as const;

/* cache for compiled format strings */
const _compileCache: Record<string, string> = {};

/**
 * Accepts either:
 *   • an array of *names*   → ["date","type",...]
 *   • an array of *tuples*  → [["date",1],["type",2],...]
 *
 * In the tuple form the numeric index is honoured verbatim; otherwise
 * names are mapped to 1...N in the array order.
 */
type FormatMap = readonly string[] | readonly (readonly [string, number])[];

/** test whether the map is in tuple form */
const isTupleMap = (m: FormatMap): m is readonly [string, number][] =>
  Array.isArray(m[0]) && Array.isArray((m[0] as any)[1]);

export function compileFormat(
  fmt: string,
  argMap: FormatMap = FORMAT_ARGS,
): string {
  if (_compileCache[fmt]) return _compileCache[fmt];

  /* fast tuple-map path (simple regex replaces) */
  if (isTupleMap(argMap)) {
    let out = fmt;
    for (const [name, idx] of argMap)
      out = out.replace(
        new RegExp(`([%-+ 0#'.*0-9]*)${name}`, "g"),
        `$1${idx}`,
      );
    _compileCache[fmt] = out;
    return out;
  }

  /* name-array path – generic, POSIX-style compiler */
  const NAMED = /%([-+ 0#'*0-9.]*)([A-Za-z_]\w*)\$([bcdefgiosuxXyYjJB])/g;

  const out = fmt.replace(
    NAMED,
    (_m, pre: string, name: string, conv: string) => {
      const idx = (argMap as readonly string[]).indexOf(name);
      if (idx === -1) throw new Error(`compileFormat: unknown "${name}"`);
      return `%${pre}${idx + 1}$${conv}`; // 1-based!
    },
  );
  _compileCache[fmt] = out;
  return out;
}

/**
 * One-shot convenience formatter from an *object* or *array*.
 *
 *   • When `args` is an array, it is passed straight to `vsprintf`.
 *   • When `args` is an object, keys are mapped using `argMap`.
 */
export function formatString(
  fmt: string,
  args: Any | Record<string, unknown>,
  argMap: FormatMap = FORMAT_ARGS,
): string {
  if (Array.isArray(args)) return vsprintf(compileFormat(fmt, argMap), args);

  /* object form → build argv in declared order */
  const argv = isTupleMap(argMap)
    ? Array.from(argMap)
        .sort((a, b) => a[1] - b[1])
        .map(([k]) => (args as any)[k])
    : argMap.map((k) => (args as any)[k]);
  return vsprintf(compileFormat(fmt, argMap), argv);
}

/* ---------------------------------------------------------------- *\
   default export for drop-in compatibility
\* ---------------------------------------------------------------- */
export default { sprintf, vsprintf, compileFormat, formatString };
