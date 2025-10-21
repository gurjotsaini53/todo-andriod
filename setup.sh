#!/bin/bash

# Todo Backend Setup Script
echo "🚀 Setting up Todo Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB first."
    echo "   You can start it with: mongod"
    echo "   Or install MongoDB as a service."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p logs

# Copy environment file if it doesn't exist
if [ ! -f "config.env" ]; then
    echo "📋 Creating environment configuration..."
    cp config.env.example config.env
    echo "✅ Environment file created. Please edit config.env with your settings."
else
    echo "✅ Environment file already exists."
fi

# Generate a random JWT secret if not set
if grep -q "your-super-secret-jwt-key-change-this-in-production" config.env; then
    echo "🔐 Generating random JWT secret..."
    JWT_SECRET=$(openssl rand -base64 32)
    sed -i.bak "s/your-super-secret-jwt-key-change-this-in-production/$JWT_SECRET/" config.env
    rm config.env.bak
    echo "✅ JWT secret generated and updated."
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit config.env with your MongoDB URI and other settings"
echo "2. Start MongoDB if not already running"
echo "3. Run the application:"
echo "   Development: npm run dev"
echo "   Production:  npm start"
echo ""
echo "API will be available at: http://localhost:3000"
echo "Health check: http://localhost:3000/api/health"
echo ""
echo "📚 See README.md for detailed API documentation"
