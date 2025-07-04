/**
 * Browser Environment Debug Script
 * Copy and paste this into your browser console (F12) when the app is running
 */

(function() {
  console.log('🔍 Browser Environment Debug\n');
  
  // Check if import.meta is available
  console.log('Environment Support:');
  console.log('  import.meta available:', typeof import !== 'undefined');
  console.log('  import.meta.env available:', typeof import !== 'undefined' && import.meta && !!import.meta.env);
  
  // Try to access environment variables
  try {
    if (typeof import !== 'undefined' && import.meta && import.meta.env) {
      const env = import.meta.env;
      
      console.log('\nEnvironment Variables:');
      console.log('  MODE:', env.MODE);
      console.log('  DEV:', env.DEV);
      console.log('  PROD:', env.PROD);
      console.log('  BASE_URL:', env.BASE_URL);
      
      console.log('\nSupabase Configuration:');
      console.log('  VITE_SUPABASE_URL present:', !!env.VITE_SUPABASE_URL);
      console.log('  VITE_SUPABASE_ANON_KEY present:', !!env.VITE_SUPABASE_ANON_KEY);
      
      if (env.VITE_SUPABASE_URL) {
        console.log('  URL format check:', env.VITE_SUPABASE_URL.startsWith('https://') ? '✅' : '❌');
        console.log('  URL length:', env.VITE_SUPABASE_URL.length);
        console.log('  URL preview:', env.VITE_SUPABASE_URL.substring(0, 30) + '...');
      }
      
      if (env.VITE_SUPABASE_ANON_KEY) {
        console.log('  Key format check:', env.VITE_SUPABASE_ANON_KEY.startsWith('eyJ') ? '✅' : '❌');
        console.log('  Key length:', env.VITE_SUPABASE_ANON_KEY.length);
        console.log('  Key preview:', env.VITE_SUPABASE_ANON_KEY.substring(0, 30) + '...');
      }
      
      console.log('\nAll Available Environment Variables:');
      const envKeys = Object.keys(env).sort();
      envKeys.forEach(key => {
        console.log(`  ${key}:`, typeof env[key], env[key] ? '✅' : '❌');
      });
      
    } else {
      console.log('❌ import.meta.env is not available in this environment');
    }
  } catch (error) {
    console.log('❌ Error accessing environment variables:', error);
  }
  
  // Check if Supabase client is properly initialized
  try {
    // Try to access the Supabase client if it's globally available
    if (window.supabase || (window as any).supabase) {
      console.log('\n✅ Supabase client found on window object');
    } else {
      console.log('\n⚠️ Supabase client not found on window object (this is normal)');
    }
  } catch (error) {
    console.log('\n❌ Error checking Supabase client:', error);
  }
  
  // Network environment check
  console.log('\nNetwork Environment:');
  console.log('  Location:', window.location.href);
  console.log('  Hostname:', window.location.hostname);
  console.log('  Port:', window.location.port);
  console.log('  Protocol:', window.location.protocol);
  console.log('  Online status:', navigator.onLine ? '✅' : '❌');
  
  console.log('\n📋 Recommendations:');
  
  if (typeof import === 'undefined' || !import.meta || !import.meta.env) {
    console.log('❌ Environment variables not accessible - this might be a build or bundler issue');
  } else if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.log('❌ Supabase environment variables missing:');
    console.log('  1. Check your .env file exists');
    console.log('  2. Ensure variables are named VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    console.log('  3. Restart your development server');
  } else {
    console.log('✅ Environment variables appear to be properly configured');
  }
  
  console.log('\n🔧 If you see "Using fallback configuration" warning:');
  console.log('  1. The app is working but using hardcoded values');
  console.log('  2. This is safe for development but should be fixed for production');
  console.log('  3. Run: node verify-environment.js for detailed diagnostics');
  
})();