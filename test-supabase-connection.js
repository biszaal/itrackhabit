// Quick Supabase Connection Test
// Run this with: node test-supabase-connection.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Connection...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseAnonKey ? '✅ Present' : '❌ Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('❌ Missing credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('🔄 Testing database connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      if (error.message.includes('relation "public.users" does not exist')) {
        console.log('⚠️  Database connected, but schema not yet installed');
        console.log('👉 Please run the SQL schema from supabase-schema.sql in your Supabase SQL Editor');
        console.log('📍 Go to: https://supabase.com/dashboard/project/ymfeahvfdxwcgwfplglo/sql');
        return;
      }
      
      console.log('❌ Connection error:', error.message);
      console.log('🔍 Check your Supabase project settings and credentials');
      return;
    }

    console.log('✅ Database connection successful!');
    console.log('✅ Schema appears to be installed');
    console.log('🎉 Your app is ready for cloud sync!');
    
  } catch (error) {
    console.log('❌ Connection test failed:', error.message);
    console.log('🔍 Please check your network connection and Supabase credentials');
  }
}

testConnection();