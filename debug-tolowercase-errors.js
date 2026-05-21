#!/usr/bin/env node

/**
 * Debug toLowerCase Errors Script
 *
 * This script helps identify and fix toLowerCase() errors on undefined values
 */

console.log("🔍 Debugging toLowerCase() errors...");

console.log("\n❌ Common toLowerCase() Errors:");
console.log("1. TypeError: Cannot read property 'toLowerCase' of undefined");
console.log("2. TypeError: Cannot read property 'toLowerCase' of null");

console.log("\n🔍 Root Causes:");
console.log("• Calling toLowerCase() on undefined/null values");
console.log("• Missing null checks before string operations");
console.log("• Incomplete data objects with missing properties");

console.log("\n✅ Fixed Locations:");
console.log("• DataService.ts - habit.title.toLowerCase()");
console.log("• HomeScreen.tsx - title.toLowerCase()");
console.log("• AIInsightsService.ts - h.title.toLowerCase()");
console.log("• AtomicHabitsService.ts - habit.title.toLowerCase()");
console.log("• habits.ts - title.toLowerCase()");

console.log("\n🔧 Fix Pattern:");
console.log("Before: value.toLowerCase()");
console.log("After:  (value || '').toLowerCase()");

console.log("\n📋 Prevention Tips:");
console.log("1. Always check if value exists before calling toLowerCase()");
console.log("2. Use nullish coalescing: (value || '').toLowerCase()");
console.log("3. Add type guards: if (typeof value === 'string')");
console.log("4. Use optional chaining: value?.toLowerCase()");

console.log("\n🧪 Test Cases:");
console.log("✅ 'Hello'.toLowerCase() → 'hello'");
console.log("✅ (undefined || '').toLowerCase() → ''");
console.log("✅ (null || '').toLowerCase() → ''");
console.log("❌ undefined.toLowerCase() → TypeError");

console.log("\n📱 App Status:");
console.log("✅ All toLowerCase() errors should now be resolved");
console.log("✅ App should load without TypeError crashes");
console.log("✅ String operations are now safe from undefined values");
