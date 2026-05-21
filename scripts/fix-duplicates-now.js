#!/usr/bin/env node

/**
 * Quick fix script for duplicate habits
 * This script will clear all data and reset the app
 */

const AsyncStorage = require("@react-native-async-storage/async-storage");

async function fixDuplicatesNow() {
  console.log("🚨 FIXING DUPLICATE HABITS NOW...\n");

  try {
    // Step 1: Get all keys
    const keys = await AsyncStorage.getAllKeys();
    console.log(`📊 Found ${keys.length} keys in storage`);

    // Step 2: Clear everything
    if (keys.length > 0) {
      await AsyncStorage.multiRemove(keys);
      console.log("✅ Cleared all AsyncStorage data");
    }

    // Step 3: Clear specific habit-related keys (in case some weren't caught)
    const habitKeys = [
      "default_habits_created",
      "offline_user",
      "habits",
      "habit_progress",
      "user_data",
      "auth_token",
      "refresh_token",
      "last_sync_timestamp",
    ];

    for (const key of habitKeys) {
      try {
        await AsyncStorage.removeItem(key);
        console.log(`🗑️  Removed: ${key}`);
      } catch (error) {
        // Key might not exist, that's fine
      }
    }

    console.log("\n✅ DUPLICATE HABITS FIXED!");
    console.log("\n📋 What was done:");
    console.log("   ✅ Cleared all AsyncStorage data");
    console.log("   ✅ Removed all habit-related keys");
    console.log("   ✅ Reset all metadata flags");

    console.log("\n🔄 NEXT STEPS:");
    console.log("   1. Close the app completely");
    console.log("   2. Restart the app");
    console.log("   3. You should see exactly 2 default habits:");
    console.log("      - Exercise 30 min");
    console.log("      - Meditate 30 min");
    console.log("   4. No duplicates should appear");
  } catch (error) {
    console.error("❌ Failed to fix duplicates:", error);
    console.log("\n🔄 MANUAL FIX:");
    console.log("   1. Uninstall the app");
    console.log("   2. Reinstall the app");
    console.log("   3. This will give you a fresh start");
  }
}

// Run the script
fixDuplicatesNow();
