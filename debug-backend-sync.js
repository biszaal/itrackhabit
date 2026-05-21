// Debug Script - Check backend sync status
// Usage: node debug-backend-sync.js

console.log('🔍 DEBUGGING BACKEND SYNC STATUS');
console.log('=================================');

async function debugSync() {
  try {
    // Import services
    const { dataService } = require('./src/services/DataService');
    const { authService } = require('./src/services/AuthService');

    console.log('🚀 Initializing services...');
    
    // Initialize services
    await dataService.initialize();

    console.log('\n📊 SERVICE STATUS:');
    console.log('==================');
    
    // Check authentication
    const currentUser = await authService.getCurrentUser();
    console.log('🔐 Current user:', currentUser ? currentUser.email : 'Not authenticated');
    console.log('🔐 Backend authenticated:', authService.isAuthenticated());
    
    // Get local habits
    const localHabits = await dataService.getHabits();
    console.log('📱 Local habits count:', localHabits.length);
    
    if (localHabits.length > 0) {
      console.log('\n📋 LOCAL HABITS:');
      localHabits.forEach((habit, index) => {
        console.log(`  ${index + 1}. ${habit.title} (Pending: ${habit.pending || false})`);
      });
    }

    if (authService.isAuthenticated()) {
      console.log('\n🔄 Testing sync...');
      const syncResult = await dataService.forcSync();
      console.log('📤 Sync result:', syncResult);
    } else {
      console.log('\n⚠️ Cannot test sync - user not authenticated');
      console.log('   - User needs to login to enable backend sync');
    }

  } catch (error) {
    console.error('❌ Debug script failed:', error);
  }
}

debugSync();