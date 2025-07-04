#!/usr/bin/env node

/**
 * Script para verificar se a correção das variáveis de ambiente foi bem-sucedida
 * Execute com: node verify-env-fix.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando correção das variáveis de ambiente...\n');

// Arquivos para verificar
const filesToCheck = [
  'lib/supabase.ts',
  'utils/secureLogging.ts',
  'utils/environment.ts',
  'App.tsx',
  'hooks/useTodoApp.ts'
];

// Padrões problemáticos a evitar
const problematicPatterns = [
  /import\.meta\.env\.DEV(?!\S)/g,  // import.meta.env.DEV (mas não DEVELOPMENT)
  /process\.env\.DEV(?!\S)/g,       // process.env.DEV (mas não DEVELOPMENT)
  /\.env\.DEV(?!\S)/g,              // qualquer .env.DEV
];

// Padrões corretos esperados
const expectedPatterns = [
  /import.*environment.*from/g,      // import from environment module
  /isDevelopment\(\)/g,              // calls to isDevelopment()
  /getEnvVar\(/g,                    // calls to getEnvVar()
];

let hasErrors = false;
let hasCorrectPatterns = false;

console.log('📂 Verificando arquivos...\n');

for (const filePath of filesToCheck) {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Arquivo não encontrado: ${filePath}`);
    continue;
  }
  
  console.log(`📄 Verificando: ${filePath}`);
  
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Verificar padrões problemáticos
    let fileHasErrors = false;
    for (const pattern of problematicPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        console.log(`   ❌ Encontrado padrão problemático: ${matches[0]}`);
        fileHasErrors = true;
        hasErrors = true;
      }
    }
    
    // Verificar padrões corretos
    let fileHasCorrectPatterns = false;
    for (const pattern of expectedPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        console.log(`   ✅ Padrão correto encontrado: ${matches[0]}`);
        fileHasCorrectPatterns = true;
        hasCorrectPatterns = true;
      }
    }
    
    if (!fileHasErrors && !fileHasCorrectPatterns) {
      console.log(`   ⚪ Nenhum padrão relacionado encontrado`);
    } else if (!fileHasErrors) {
      console.log(`   ✅ Arquivo limpo de padrões problemáticos`);
    }
    
  } catch (error) {
    console.log(`   ❌ Erro ao ler arquivo: ${error.message}`);
    hasErrors = true;
  }
  
  console.log('');
}

// Verificar se arquivos específicos existem
console.log('📋 Verificando arquivos de correção...\n');

const correctionFiles = [
  'utils/environment.ts',
  'PRODUCTION-ENV-FIX.md'
];

for (const filePath of correctionFiles) {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${filePath} - Arquivo de correção presente`);
  } else {
    console.log(`❌ ${filePath} - Arquivo de correção ausente`);
    hasErrors = true;
  }
}

console.log('\n' + '='.repeat(60));

// Resultado final
if (hasErrors) {
  console.log('❌ VERIFICAÇÃO FALHOU');
  console.log('   Ainda existem padrões problemáticos no código.');
  console.log('   Revise os arquivos listados acima.');
  process.exit(1);
} else if (hasCorrectPatterns) {
  console.log('✅ VERIFICAÇÃO PASSOU COM SUCESSO');
  console.log('   - Nenhum padrão problemático encontrado');
  console.log('   - Padrões corretos implementados');
  console.log('   - Arquivos de correção presentes');
  console.log('\n🎉 A correção foi implementada corretamente!');
} else {
  console.log('⚪ VERIFICAÇÃO NEUTRA');
  console.log('   - Nenhum padrão problemático encontrado');
  console.log('   - Nenhum padrão de correção detectado');
  console.log('   - Código parece estar limpo');
}

console.log('\n🚀 Para testar a aplicação:');
console.log('   npm run build');
console.log('   npm run preview');
console.log('\n💡 Para deploy em produção:');
console.log('   Configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
console.log('   na plataforma de deploy (Vercel, Netlify, etc.)');