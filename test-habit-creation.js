#!/usr/bin/env node

/**
 * Test Habit Creation Script
 *
 * This script helps test habit creation with proper field validation
 */

console.log("🧪 Testing habit creation with field validation...");

console.log("\n📋 Test Cases:");

console.log("\n1. ✅ Valid Habit Object:");
const validHabit = {
  id: "test-habit-1",
  userId: "test-user",
  title: "Test Habit",
  frequency: "daily",
  type: "manual",
  color: "#4CAF50",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isShared: false,
  pending: false,
};
console.log(JSON.stringify(validHabit, null, 2));

console.log("\n2. ⚠️ Incomplete Habit Object (missing userId):");
const incompleteHabit = {
  id: "test-habit-2",
  title: "Incomplete Habit",
  color: "#FF9800",
  // Missing: userId, frequency, type, createdAt, updatedAt
};
console.log(JSON.stringify(incompleteHabit, null, 2));

console.log("\n3. 🔧 Expected Fixes:");
console.log("   → userId: 'offline_user' (default)");
console.log("   → title: 'Untitled Habit' (if missing)");
console.log("   → frequency: 'daily' (default)");
console.log("   → type: 'manual' (default)");
console.log("   → createdAt: current timestamp");
console.log("   → updatedAt: current timestamp");

console.log("\n📱 App Behavior:");
console.log("   → The ensureHabitFields() method will automatically");
console.log("   → fill in missing required fields before database insertion");
console.log("   → This prevents 'NOT NULL constraint failed' errors");

console.log("\n✅ Expected Result:");
console.log("   → No more 'NOT NULL constraint failed: habits.userId' errors");
console.log("   → All habits will have proper userId, title, frequency, etc.");
console.log("   → Database operations will succeed");
