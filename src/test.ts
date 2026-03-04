import { createFuzzySearch } from "./index";

console.log("=== quickfuzz Test Suite ===\n");

// Test 1: Array of strings - loose match
const fruits = ["apple", "pineapple", "grape", "appletini", "banana", "mango"];
const searchLoose = createFuzzySearch(fruits, { threshold: 2 });
const looseResult = searchLoose("aple");
console.log("Test 1 - Loose match (threshold 2):");
console.log('  searchLoose("aple"):', looseResult);
console.log("  Expected: [apple, pineapple, appletini]");
console.log("  Pass:", looseResult.includes("apple") && looseResult.includes("pineapple") && looseResult.includes("appletini"));
console.log();

// Test 2: Array of strings - tight match
const searchTight = createFuzzySearch(fruits, { threshold: 9 });
const tightResult = searchTight("aple");
console.log("Test 2 - Tight match (threshold 9):");
console.log('  searchTight("aple"):', tightResult);
console.log("  Expected: [apple]");
console.log("  Pass:", tightResult.length === 1 && tightResult[0] === "apple");
console.log();

// Test 3: Array of objects - single key
interface User {
  name: string;
  email: string;
}
const users: User[] = [
  { name: "Alice Johnson", email: "alice@example.com" },
  { name: "Bob Smith", email: "bob@example.com" },
  { name: "Charlie Brown", email: "charlie@peanuts.com" },
];
const searchByName = createFuzzySearch(users, { key: "name", threshold: 5 });
const nameResult = searchByName("alice");
console.log("Test 3 - Object search (single key):");
console.log('  searchByName("alice"):', nameResult);
console.log("  Pass:", nameResult.length === 1 && nameResult[0].name === "Alice Johnson");
console.log();

// Test 4: Array of objects - multiple keys
const searchByNameOrEmail = createFuzzySearch(users, {
  key: ["name", "email"],
  threshold: 4,
});
const multiKeyResult = searchByNameOrEmail("bob");
console.log("Test 4 - Object search (multiple keys):");
console.log('  searchByNameOrEmail("bob"):', multiKeyResult);
console.log("  Pass:", multiKeyResult.length >= 1 && multiKeyResult[0].name === "Bob Smith");
console.log();

// Test 5: Case insensitive
const caseResult = searchByName("ALICE");
console.log("Test 5 - Case insensitive:");
console.log('  searchByName("ALICE"):', caseResult);
console.log("  Pass:", caseResult.length === 1 && caseResult[0].name === "Alice Johnson");
console.log();

// Test 6: Empty query returns empty array
const emptyResult = searchByName("");
console.log("Test 6 - Empty query:");
console.log('  searchByName(""):', emptyResult);
console.log("  Pass:", emptyResult.length === 0);
console.log();

// Test 7: Default threshold
const searchDefault = createFuzzySearch(fruits);
const defaultResult = searchDefault("apple");
console.log("Test 7 - Default threshold:");
console.log('  searchDefault("apple"):', defaultResult);
console.log("  Pass:", defaultResult[0] === "apple");
console.log();

// Test 8: Books example from README
interface Book {
  title: string;
  author: string;
}
const books: Book[] = [
  { title: "The Lord of the Rings", author: "J.R.R. Tolkien" },
  { title: "The Hobbit", author: "J.R.R. Tolkien" },
  { title: "Pride and Prejudice", author: "Jane Austen" },
];
const searchBooks = createFuzzySearch(books, { key: "title", threshold: 7 });
const bookResult = searchBooks("hobit");
console.log("Test 8 - Books example:");
console.log('  searchBooks("hobit"):', bookResult);
console.log("  Pass:", bookResult.length >= 1 && bookResult[0].title === "The Hobbit");
console.log();

// Test 9: maxResults option
const searchLimited = createFuzzySearch(fruits, { threshold: 2, maxResults: 2 });
const limitedResult = searchLimited("aple");
console.log("Test 9 - maxResults:");
console.log('  searchLimited("aple"):', limitedResult);
console.log("  Pass:", limitedResult.length === 2);
console.log();

// Test 10: caseSensitive option
const searchCaseSensitive = createFuzzySearch(["Apple", "apple", "APPLE"], { caseSensitive: true });
const csResult = searchCaseSensitive("Apple");
console.log("Test 10 - Case sensitive:");
console.log('  searchCaseSensitive("Apple"):', csResult);
console.log("  Pass:", csResult.length === 1 && csResult[0] === "Apple");
console.log();

// Test 11: .search() with match indices
const searchDetailed = createFuzzySearch(fruits, { threshold: 5 });
const detailedResult = searchDetailed.search("apple");
console.log("Test 11 - .search() with match indices:");
console.log("  detailedResult[0]:", detailedResult[0]);
console.log("  Pass:", detailedResult[0].item === "apple" && detailedResult[0].score === 1 && detailedResult[0].matches.length === 5);
console.log();

// Test 12: .search() fuzzy match indices
const fuzzyDetailedResult = searchDetailed.search("aple");
console.log("Test 12 - .search() fuzzy match indices:");
console.log("  fuzzyDetailedResult[0]:", fuzzyDetailedResult[0]);
console.log("  Pass:", fuzzyDetailedResult[0].item === "apple" && fuzzyDetailedResult[0].matches.length === 4 && fuzzyDetailedResult[0].score > 0);
console.log();

// === Benchmarks ===
console.log("=== Benchmarks ===\n");

const sizes = [1000, 5000, 10000];
for (const size of sizes) {
  const data = Array.from({ length: size }, (_, i) => `item-${i}-${Math.random().toString(36).slice(2, 8)}`);
  const search = createFuzzySearch(data);

  // Warm up
  search("item-99");

  const runs = 100;
  const start = performance.now();
  for (let i = 0; i < runs; i++) {
    search("item-99");
  }
  const elapsed = performance.now() - start;
  const avg = (elapsed / runs).toFixed(3);
  console.log(`  ${size} items: ${avg}ms avg (${runs} runs)`);
}

// Object benchmark
const objData = Array.from({ length: 5000 }, (_, i) => ({
  name: `User ${i} ${Math.random().toString(36).slice(2, 8)}`,
  email: `user${i}@example.com`,
}));
const objSearch = createFuzzySearch(objData, { key: ["name", "email"] });
objSearch("user123"); // warm up

const objRuns = 100;
const objStart = performance.now();
for (let i = 0; i < objRuns; i++) {
  objSearch("user 42");
}
const objElapsed = performance.now() - objStart;
console.log(`  5000 objects (2 keys): ${(objElapsed / objRuns).toFixed(3)}ms avg (${objRuns} runs)`);

console.log("\n=== All tests completed ===");
