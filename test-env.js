// Script simples para testar variáveis de ambiente
// Execute com: node test-env.js

const fs = require('fs');
const path = require('path');

console.log('🔧 Verificando configuração das variáveis de ambiente...\n');

// Verificar se arquivo .env existe
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

console.log('1. Arquivo .env:', envExists ? '✅ Existe' : '❌ Não encontrado');

if (envExists) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    
    console.log('2. Variáveis encontradas:');
    lines.forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        console.log(`   - ${key}: ${value.length > 0 ? '✅' : '❌'} (${value.length} caracteres)`);
      }
    });
    
    // Verificar variáveis específicas
    const hasUrl = envContent.includes('VITE_SUPABASE_URL=');
    const hasKey = envContent.includes('VITE_SUPABASE_ANON_KEY=');
    
    console.log('\n3. Variáveis necessárias:');
    console.log(`   - VITE_SUPABASE_URL: ${hasUrl ? '✅' : '❌'}`);
    console.log(`   - VITE_SUPABASE_ANON_KEY: ${hasKey ? '✅' : '❌'}`);
    
    if (hasUrl && hasKey) {
      console.log('\n🎉 Configuração está correta!');
      console.log('📝 Se ainda houver erro, reinicie o servidor: npm run dev');
    } else {
      console.log('\n⚠️  Algumas variáveis estão faltando.');
      console.log('📝 Verifique o arquivo .env e adicione as variáveis necessárias.');
    }
  } catch (error) {
    console.log('❌ Erro ao ler arquivo .env:', error.message);
  }
} else {
  console.log('\n📝 Para criar o arquivo .env:');
  console.log('   1. cp .env.example .env');
  console.log('   2. Edite o .env com suas credenciais');
  console.log('   3. Reinicie o servidor: npm run dev');
}

console.log('\n🔒 Lembre-se: O app funcionará mesmo sem .env devido aos fallbacks seguros!');