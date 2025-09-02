// Debug Script - Test habit deletion and data preservation
// Usage: node debug-deletion.js

console.log('🔍 DEBUGGING HABIT DELETION');
console.log('==========================');

async function debugDeletion() {
  try {
    // Import services
    const { dataService } = require('./src/services/DataService');
    
    console.log('🚀 Initializing DataService...');
    await dataService.initialize();
    
    // 1. Check initial state
    console.log('\n📊 INITIAL STATE:');
    console.log('=================');
    
    const initialHabits = await dataService.getHabits();
    console.log('📱 Active habits count:', initialHabits.length);
    
    const initialAllHabits = await dataService.getAllHabitsIncludingDeleted();
    console.log('📱 All habits (including deleted):', initialAllHabits.length);
    
    if (initialHabits.length > 0) {
      console.log('\n📋 CURRENT ACTIVE HABITS:');
      initialHabits.forEach((habit, index) => {
        console.log(`  ${index + 1}. ${habit.title} (ID: ${habit.id.substring(0, 8)}...)`);
      });
      
      // Take the first habit and delete it
      const habitToDelete = initialHabits[0];
      console.log('\n🗑️ DELETING HABIT:', habitToDelete.title);
      console.log('===================================');
      
      // Create some progress for this habit first
      console.log('📊 Creating sample progress...');
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split('T')[0];
      
      await dataService.markHabitProgress(habitToDelete.id, today, 'done');
      await dataService.markHabitProgress(habitToDelete.id, yesterdayString, 'done');
      console.log('✅ Created progress for today and yesterday');
      
      // Check progress before deletion
      const progressBefore = await dataService.getHabitProgress(habitToDelete.id);
      console.log('📊 Progress entries before deletion:', progressBefore.length);
      
      // Delete the habit
      await dataService.deleteHabit(habitToDelete.id);
      
      // Check state after deletion
      console.log('\n📊 STATE AFTER DELETION:');
      console.log('========================');
      
      const activeAfter = await dataService.getHabits();
      console.log('📱 Active habits after deletion:', activeAfter.length);
      
      const allAfter = await dataService.getAllHabitsIncludingDeleted();
      console.log('📱 All habits (including deleted) after deletion:', allAfter.length);
      
      const progressAfter = await dataService.getHabitProgress(habitToDelete.id);
      console.log('📊 Progress entries after deletion:', progressAfter.length);
      
      // Check if we can get the deleted habit
      const deletedHabit = await dataService.getHabitById(habitToDelete.id);
      if (deletedHabit && deletedHabit.deletedAt) {
        console.log('✅ Deleted habit still exists with deletedAt:', deletedHabit.deletedAt);
      } else {
        console.log('❌ Deleted habit not found or missing deletedAt!');
      }
      
      // Test daily stats to see if historical data is preserved
      console.log('\n📊 TESTING DAILY STATS:');
      console.log('=======================');
      
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoString = weekAgo.toISOString().split('T')[0];
      
      const dailyStats = await dataService.getDailyStats(weekAgoString, today);
      console.log('📊 Daily stats for last week:', dailyStats.length, 'days');
      
      // Look for the days we created progress
      const todayStats = dailyStats.find(s => s.date === today);
      const yesterdayStats = dailyStats.find(s => s.date === yesterdayString);
      
      if (todayStats && todayStats.totalHabits > 0) {
        console.log('✅ Today stats show habits existed:', todayStats);
      } else {
        console.log('❌ Today stats missing or show no habits:', todayStats);
      }
      
      if (yesterdayStats && yesterdayStats.totalHabits > 0) {
        console.log('✅ Yesterday stats show habits existed:', yesterdayStats);
      } else {
        console.log('❌ Yesterday stats missing or show no habits:', yesterdayStats);
      }
      
    } else {
      console.log('⚠️ No habits found to test deletion');
    }

  } catch (error) {
    console.error('❌ Debug deletion failed:', error);
  }
}

debugDeletion();