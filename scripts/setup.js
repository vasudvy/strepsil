#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Strepsil...\n');

// Create necessary directories
const directories = [
  'backend/data',
  'backend/logs'
];

directories.forEach(dir => {
  const fullPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  } else {
    console.log(`📁 Directory exists: ${dir}`);
  }
});

// Copy environment files if they don't exist
const envFiles = [
  { src: 'backend/.env.example', dest: 'backend/.env' },
  { src: 'frontend/.env.example', dest: 'frontend/.env' }
];

envFiles.forEach(({ src, dest }) => {
  const srcPath = path.join(__dirname, '..', src);
  const destPath = path.join(__dirname, '..', dest);
  
  if (!fs.existsSync(destPath) && fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`✅ Created environment file: ${dest}`);
  } else if (fs.existsSync(destPath)) {
    console.log(`🔧 Environment file exists: ${dest}`);
  } else {
    console.log(`⚠️  Template not found: ${src}`);
  }
});

// Generate encryption key if not set
const backendEnvPath = path.join(__dirname, '..', 'backend', '.env');
if (fs.existsSync(backendEnvPath)) {
  let envContent = fs.readFileSync(backendEnvPath, 'utf8');
  
  if (envContent.includes('your-encryption-key-for-api-keys-change-this-in-production')) {
    const crypto = require('crypto');
    const encryptionKey = crypto.randomBytes(32).toString('hex');
    
    envContent = envContent.replace(
      'your-encryption-key-for-api-keys-change-this-in-production',
      encryptionKey
    );
    
    fs.writeFileSync(backendEnvPath, envContent);
    console.log('🔐 Generated secure encryption key');
  }
}

console.log('\n✨ Setup complete!');
console.log('\nNext steps:');
console.log('1. npm run dev          # Start development servers');
console.log('2. Open http://localhost:3000');
console.log('3. Follow the setup wizard to configure your AI providers');
console.log('\nHappy coding! 🎉');