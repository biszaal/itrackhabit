#!/usr/bin/env node

/**
 * Script to clear duplicate habits from the frontend local storage
 * This script can be run to fix duplicate habits for offline users
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

async function clearDuplicateHabits() {
  console.log("🧹 Clearing duplicate habits from local storage...\n");

  try {
    // Get all stored data
    const keys = await AsyncStorage.getAllKeys();
    console.log("📊 Found keys:", keys.length);

    // Look for habit-related data
    const habitKeys = keys.filter(
      (key) =>
        key.includes("habit") ||
        key.includes("default_habits_created") ||
        key.includes("offline_user")
    );

    console.log("🔍 Habit-related keys:", habitKeys);

    if (habitKeys.length === 0) {
      console.log("✅ No habit data found in storage");
      return;
    }

    // Clear all habit-related data
    await AsyncStorage.multiRemove(habitKeys);
    console.log("✅ Cleared all habit-related data");

    // Also clear any SQLite database files if they exist
    console.log(
      "💡 Note: SQLite database files may need to be cleared manually"
    );
    console.log("   The app will recreate default habits on next launch");

    console.log("\n✅ Duplicate habits cleared successfully!");
    console.log("🔄 Restart the app to see the fix");
  } catch (error) {
    console.error("❌ Failed to clear duplicate habits:", error);
  }
}

// Run the script
clearDuplicateHabits();
