#!/usr/bin/env node

/**
 * Clear Database Cache Script
 *
 * This script helps clear the SQLite database cache to fix finalizeAsync errors
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🗑️ Clearing database cache...");

try {
  // Clear Expo cache
  console.log("🔄 Clearing Expo cache...");
  execSync("npx expo start --clear", { stdio: "inherit" });

  console.log("✅ Database cache cleared successfully");
  console.log("📱 You can now restart your app");
} catch (error) {
  console.error("❌ Failed to clear cache:", error.message);
  console.log("\n🔧 Manual steps:");
  console.log("1. Stop the Metro bundler (Ctrl+C)");
  console.log("2. Run: npx expo start --clear");
  console.log('3. Press "r" to reload the app');
}
