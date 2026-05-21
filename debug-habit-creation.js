#!/usr/bin/env node

/**
 * Debug Habit Creation Issue
 *
 * This script helps identify why new habits aren't showing up
 */

console.log("🔍 Debugging Habit Creation Issue...");

console.log("\n❌ Problem:");
console.log("• User creates new habit but it doesn't show on HomeScreen");
console.log("• Habit might not be created at all");
console.log("• Or habit is created but not being loaded/displayed");

console.log("\n🔍 Possible Root Causes:");
console.log("1. DataService.createHabit() failing silently");
console.log("2. Feature gating blocking habit creation");
console.log("3. OfflineStorage.saveHabit() not working");
console.log("4. HomeScreen not reloading after habit creation");
console.log("5. Authentication issues preventing habit creation");
console.log("6. Network issues with backend API");

console.log("\n✅ Applied Debugging:");
console.log("• Added comprehensive console logs to loadData()");
console.log("• Added logs to useFocusEffect for screen focus");
console.log("• Added green debug button to test habit creation");
console.log("• Added logs to show habit count and details");

console.log("\n🧪 Testing Steps:");
console.log("1. Check console for '🔄 HomeScreen focused, reloading data...'");
console.log("2. Look for '🔍 Loaded habits data:' logs");
console.log("3. Tap the green debug button (flask icon) to test creation");
console.log("4. Check console for '🧪 Testing habit creation...' logs");
console.log(
  "5. Look for '✅ Test habit created successfully!' or error messages"
);

console.log("\n📊 Debug Information to Check:");
console.log("• '🔄 Starting loadData...' - shows when data loading starts");
console.log("• '🔄 Initializing DataService...' - shows DataService init");
console.log("• '🔄 Getting habits from DataService...' - shows habit fetching");
console.log("• '🔍 Loaded habits data:' - shows what habits are returned");
console.log("• '🔄 Setting habits state with: X habits' - shows state update");
console.log("• '📊 Progress calculation:' - shows progress calculation");

console.log("\n🔧 Expected Flow:");
console.log("1. User creates habit → CreateEditHabitScreen");
console.log("2. handleSave() calls dataService.createHabit()");
console.log("3. createHabit() saves to OfflineStorage");
console.log("4. User returns to HomeScreen");
console.log("5. useFocusEffect triggers loadData()");
console.log("6. loadData() calls dataService.getHabits()");
console.log("7. New habit should appear in the list");

console.log("\n🚨 Common Issues:");
console.log("• Feature gating blocking creation (check for 'blocked: true')");
console.log("• OfflineStorage not saving (check for saveHabit errors)");
console.log("• HomeScreen not reloading (check useFocusEffect)");
console.log("• Authentication issues (check authService.isAuthenticated())");
console.log("• Network issues (check networkService.getConnectionStatus())");

console.log("\n📱 Next Steps:");
console.log("1. Try creating a habit through the normal flow");
console.log("2. Check console logs for any errors");
console.log("3. Try the green debug button to test direct creation");
console.log("4. Look for any 'blocked' or 'error' messages");
console.log("5. Check if habits are being saved but not loaded");
