<p align="center">
  <img src="https://img.shields.io/npm/v/quickfuzz?color=blue&label=npm" alt="npm version" />
  <img src="https://img.shields.io/bundlephobia/minzip/quickfuzz?color=green&label=size" alt="bundle size" />
  <img src="https://img.shields.io/npm/l/quickfuzz" alt="license" />
  <img src="https://img.shields.io/badge/types-included-blue" alt="typescript" />
  <img src="https://img.shields.io/badge/dependencies-0-brightgreen" alt="zero deps" />
</p>

<h1 align="center">quickfuzz</h1>

<p align="center">
  A blazing-fast, zero-dependency fuzzy search library for JavaScript & TypeScript.<br/>
  Lightweight fuzzy matching for autocomplete, command palettes, and filter UIs.<br/>
  Optimized for small datasets. Built for speed.
</p>

---

## Why quickfuzz?

Looking for a **fast fuzzy search** library for **JavaScript** or **TypeScript**? Most fuzzy search libraries are built for large-scale, server-side search. They come with complex configs, heavy bundle sizes, and features you'll never use.

**quickfuzz** is different. It's built for the **90% use case** — client-side search over small-to-medium datasets where every millisecond matters:

- Autocomplete inputs
- Command palettes (Ctrl+K)
- Quick-find / filter UIs
- Search bars for lists & tables

| | quickfuzz | Traditional libraries |
|---|---|---|
| **1,000 items** | ~0.12ms | ~1.5ms |
| **Bundle size** | ~4KB | ~20KB+ |
| **Dependencies** | 0 | varies |
| **Setup** | 1 function | Class + config object |

---

## Installation

```bash
npm install quickfuzz
```

```bash
yarn add quickfuzz
```

---

## Quick Start

```ts
import { createFuzzySearch } from "quickfuzz";

const search = createFuzzySearch(["apple", "banana", "grape", "mango"]);

search("aple");   // ["apple"]
search("ban");    // ["banana"]
search("");       // []
```

That's it. One function. No config required.

---

## Features

- **Zero dependencies** — nothing to audit, nothing to break
- **Full TypeScript support** — generics, key inference, IntelliSense
- **Configurable threshold** (1–10) — from loose to strict matching
- **Case sensitivity control** — case-insensitive by default
- **Multi-key object search** — search across multiple fields
- **Result limiting** — `maxResults` for capped autocomplete results
- **Match metadata** — `.search()` returns scores + matched character indices

---

## Usage

### Search strings

```ts
const fruits = ["apple", "pineapple", "grape", "appletini", "banana"];

// Loose matching
const search = createFuzzySearch(fruits, { threshold: 2 });
search("aple"); // ["apple", "appletini", "pineapple"]

// Strict matching
const strict = createFuzzySearch(fruits, { threshold: 9 });
strict("aple"); // ["apple"]
```

### Search objects by key

```ts
interface Book {
  title: string;
  author: string;
}

const books: Book[] = [
  { title: "The Lord of the Rings", author: "J.R.R. Tolkien" },
  { title: "The Hobbit", author: "J.R.R. Tolkien" },
  { title: "Pride and Prejudice", author: "Jane Austen" },
];

const search = createFuzzySearch(books, { key: "title", threshold: 7 });
search("hobit"); // [{ title: "The Hobbit", ... }]
```

### Search multiple keys

```ts
const users = [
  { name: "Alice Johnson", email: "alice@example.com" },
  { name: "Bob Smith", email: "bob@example.com" },
];

const search = createFuzzySearch(users, { key: ["name", "email"], threshold: 4 });
search("bob"); // [{ name: "Bob Smith", email: "bob@example.com" }]
```

### Limit results

```ts
const search = createFuzzySearch(fruits, { threshold: 2, maxResults: 2 });
search("aple"); // ["apple", "appletini"]
```

### Case-sensitive mode

```ts
const search = createFuzzySearch(["Apple", "apple", "APPLE"], {
  caseSensitive: true,
});
search("Apple"); // ["Apple"]
```

### Get match details

Use `.search()` to get scores and matched character indices — useful for highlighting in UIs.

```ts
const search = createFuzzySearch(["apple", "pineapple"], { threshold: 5 });

search.search("aple");
// [
//   { item: "apple",     score: 0.7075, matches: [0, 1, 3, 4] },
//   { item: "pineapple", score: 0.5876, matches: [4, 5, 7, 8] }
// ]
```

**Highlight example:**

```ts
function highlight(text: string, indices: number[]): string {
  return text
    .split("")
    .map((char, i) => (indices.includes(i) ? `<b>${char}</b>` : char))
    .join("");
}

highlight("apple", [0, 1, 3, 4]);
// → "<b>a</b><b>p</b>p<b>l</b><b>e</b>"
```

---

## API

### `createFuzzySearch(data, options?)`

Creates a reusable search function.

**Options:**

| Option | Type | Default | Description |
|---|---|---|---|
| `key` | `keyof T \| (keyof T)[]` | — | Object key(s) to search |
| `threshold` | `1–10` | `5` | Match strictness (1 = loose, 10 = strict) |
| `caseSensitive` | `boolean` | `false` | Enable case-sensitive matching |
| `maxResults` | `number` | unlimited | Cap the number of returned results |

**Returns:**

A function with two calling modes:

```ts
// Simple — returns matched items
searchFn(query: string): T[]

// Detailed — returns items with score and match indices
searchFn.search(query: string): FuzzySearchResult<T>[]
```

### `FuzzySearchResult<T>`

```ts
interface FuzzySearchResult<T> {
  item: T;        // The matched item
  score: number;  // 0–1, higher = better match
  matches: number[]; // Indices of matched characters
}
```

---

## Benchmarks

Averaged over 100 runs per dataset size:

```
  1,000 strings         →  ~0.12ms
  5,000 strings         →  ~0.44ms
  10,000 strings        →  ~0.88ms
  5,000 objects (2 keys) →  ~1.0ms
```

---

## Tests

```
  ✅ Loose match (threshold 2)
  ✅ Tight match (threshold 9)
  ✅ Object search — single key
  ✅ Object search — multiple keys
  ✅ Case insensitive (default)
  ✅ Empty query returns []
  ✅ Default threshold
  ✅ Books example
  ✅ maxResults
  ✅ Case sensitive
  ✅ .search() with match indices
  ✅ .search() fuzzy match indices

  12/12 passing
```

---

## License

MIT
