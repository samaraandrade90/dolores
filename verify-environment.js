#!/usr/bin/env node

/**
 * Comprehensive Environment Variables Verification Script
 * Run with: node verify-environment.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Environment Variables Verification\n');

// Function to safely read a file
const readFileContents = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    }
    return null;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return null;
  }
};

// Parse .env file content
const parseEnvFile = (content) => {
  if (!content) return {};
  
  const env = {};
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  }
  
  return env;
};

// Check .env files
console.log('📂 Checking environment files...\n');

const envFiles = [
  { name: '.env', path: '.env' },
  { name: '.env.example', path: '.env.example' },
  { name: '.env.production', path: '.env.production' }
];

const envData = {};

for (const envFile of envFiles) {
  const content = readFileContents(envFile.path);
  
  if (content) {
    envData[envFile.name] = parseEnvFile(content);
    console.log(`✅ ${envFile.name} - Found`);
    
    const vars = envData[envFile.name];
    if (vars.VITE_SUPABASE_URL) {
      console.log(`   🔗 URL: ${vars.VITE_SUPABASE_URL.substring(0, 30)}...`);
    } else {
      console.log(`   ❌ Missing VITE_SUPABASE_URL`);
    }
    
    if (vars.VITE_SUPABASE_ANON_KEY) {
      console.log(`   🔑 Key: ${vars.VITE_SUPABASE_ANON_KEY.substring(0, 30)}...`);
    } else {
      console.log(`   ❌ Missing VITE_SUPABASE_ANON_KEY`);
    }
  } else {
    console.log(`❌ ${envFile.name} - Not found`);
  }
  
  console.log('');
}

// Validate Supabase configuration
console.log('🔧 Validating Supabase configuration...\n');

const mainEnv = envData['.env'] || {};
const requiredVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
const missingVars = [];
const invalidVars = [];

for (const varName of requiredVars) {
  const value = mainEnv[varName];
  
  if (!value) {
    missingVars.push(varName);
    console.log(`❌ ${varName}: Missing`);
  } else {
    // Validate format
    if (varName === 'VITE_SUPABASE_URL') {
      if (!value.startsWith('https://') || !value.includes('.supabase.co')) {
        invalidVars.push(varName);
        console.log(`⚠️  ${varName}: Invalid format (should start with https:// and include .supabase.co)`);
      } else {
        console.log(`✅ ${varName}: Valid format`);
      }
    } else if (varName === 'VITE_SUPABASE_ANON_KEY') {
      if (!value.startsWith('eyJ') || value.length < 100) {
        invalidVars.push(varName);
        console.log(`⚠️  ${varName}: Invalid format (should be a JWT token starting with eyJ)`);
      } else {
        console.log(`✅ ${varName}: Valid format`);
      }
    }
  }
}

console.log('');

// Check for common issues
console.log('🔍 Checking for common issues...\n');

// Check if variables have quotes
for (const varName of requiredVars) {
  const value = mainEnv[varName];
  if (value && (value.startsWith('"') || value.startsWith("'"))) {
    console.log(`⚠️  ${varName}: Contains quotes (remove them)`);
  }
}

// Check .gitignore
const gitignoreContent = readFileContents('.gitignore');
if (gitignoreContent) {
  if (gitignoreContent.includes('.env')) {
    console.log('✅ .gitignore: .env file is properly excluded');
  } else {
    console.log('⚠️  .gitignore: Consider adding .env to .gitignore');
  }
} else {
  console.log('⚠️  .gitignore: File not found');
}

// Check package.json scripts
const packageJsonContent = readFileContents('package.json');
if (packageJsonContent) {
  try {
    const packageJson = JSON.parse(packageJsonContent);
    if (packageJson.scripts) {
      console.log('✅ package.json: Scripts section found');
      
      if (packageJson.scripts.dev) {
        console.log('   ✅ dev script: Available');
      }
      
      if (packageJson.scripts.build) {
        console.log('   ✅ build script: Available');
      }
    }
  } catch (error) {
    console.log('❌ package.json: Invalid JSON format');
  }
}

console.log('');

// Environment simulation test
console.log('🧪 Simulating environment loading...\n');

try {
  // Simulate how Vite would load the variables
  const simulatedEnv = {
    MODE: 'development',
    DEV: true,
    PROD: false,
    ...mainEnv
  };
  
  const hasUrl = !!simulatedEnv.VITE_SUPABASE_URL;
  const hasKey = !!simulatedEnv.VITE_SUPABASE_ANON_KEY;
  
  console.log('Simulated import.meta.env:', {
    hasSupabaseUrl: hasUrl,
    hasSupabaseKey: hasKey,
    mode: simulatedEnv.MODE,
    dev: simulatedEnv.DEV,
    prod: simulatedEnv.PROD
  });
  
  if (hasUrl && hasKey) {
    console.log('✅ Environment simulation: Would load successfully');
  } else {
    console.log('❌ Environment simulation: Would fall back to defaults');
  }
} catch (error) {
  console.log('❌ Environment simulation failed:', error.message);
}

console.log('');

// Summary and recommendations
console.log('📋 Summary and Recommendations\n');

if (missingVars.length === 0 && invalidVars.length === 0) {
  console.log('🎉 All environment variables are properly configured!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Run: npm run dev');
  console.log('2. Check browser console for "✅ Supabase client initialized successfully"');
  console.log('3. No warning about fallback configuration should appear');
} else {
  console.log('❌ Issues found with environment configuration:');
  console.log('');
  
  if (missingVars.length > 0) {
    console.log('Missing variables:');
    missingVars.forEach(v => console.log(`  - ${v}`));
    console.log('');
  }
  
  if (invalidVars.length > 0) {
    console.log('Invalid variables:');
    invalidVars.forEach(v => console.log(`  - ${v}`));
    console.log('');
  }
  
  console.log('🔧 To fix:');
  console.log('1. Copy the correct values from your Supabase project dashboard');
  console.log('2. Ensure .env file exists in the project root');
  console.log('3. Add the variables without quotes:');
  console.log('   VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.log('   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...');
  console.log('4. Restart your development server');
}

console.log('');

// Deployment reminder
console.log('🚀 For Production Deployment:');
console.log('- Vercel: Add environment variables in Dashboard → Settings → Environment Variables');
console.log('- Netlify: Add in Site Settings → Environment Variables');
console.log('- GitHub Pages: Add as repository secrets');
console.log('- Railway: Add in Settings → Variables');

console.log('\n✅ Verification complete!');