#!/bin/bash

echo "🚀 Setting up Strepsil - AI Usage Tracking Dashboard"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install root dependencies
echo "📦 Installing workspace dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend && npm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend && npm install
cd ..

# Create environment files if they don't exist
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating backend environment file..."
    cp backend/.env.example backend/.env
    echo "⚠️  Please edit backend/.env with your Supabase credentials"
fi

if [ ! -f "frontend/.env" ]; then
    echo "📝 Creating frontend environment file..."
    cp frontend/.env.example frontend/.env
    echo "⚠️  Please edit frontend/.env with your Supabase credentials"
fi

echo ""
echo "🎉 Setup completed!"
echo ""
echo "Next steps:"
echo "1. Create a Supabase project at https://supabase.com"
echo "2. Run the database schema from database/schema.sql in your Supabase SQL editor"
echo "3. Update backend/.env with your Supabase credentials"
echo "4. Update frontend/.env with your Supabase credentials"
echo "5. Run 'npm run dev' to start the development servers"
echo ""
echo "📚 Check README.md for detailed setup instructions"
echo ""