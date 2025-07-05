# Strepsil

**Open-Source AI Usage Tracking & Receipt Dashboard**

Strepsil is a self-hosted dashboard for tracking AI API usage, generating detailed cost reports, and managing AI interactions. Perfect for developers, teams, and organizations who want to monitor their AI spending and optimize usage patterns.

## ✨ Features

- **🔍 Real-time Usage Tracking**: Automatically track AI API calls, tokens, costs, and latency
- **💬 Built-in AI Chat**: Chat with multiple AI providers directly in the dashboard
- **📊 Comprehensive Analytics**: Detailed cost breakdowns by provider, model, and time period
- **📑 Receipt Generation**: Generate detailed receipts for every AI API call
- **📈 Cost Explorer**: Analyze spending patterns and optimize usage
- **📋 Export Reports**: Export billing data as CSV, JSON, or PDF
- **🔐 Self-Hosted**: Your data stays on your server - no third-party dependencies
- **🎨 Modern UI**: Clean, responsive dashboard with Telegram-UI inspired design

## � Quick Start

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/strepsil.git
   cd strepsil
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   cd ..
   ```

3. **Set up environment variables**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   
   # Frontend
   cp frontend/.env.example frontend/.env
   ```

4. **Start the application**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Dashboard: http://localhost:3000
   - API: http://localhost:3001

## � Setup Guide

### First-Time Setup

1. **Access the Setup Page**: Visit http://localhost:3000 - you'll be redirected to the setup page
2. **Configure AI Providers**: Add your API keys for:
   - OpenAI (GPT-4, GPT-3.5-turbo, etc.)
   - Anthropic (Claude models)
   - More providers coming soon!
3. **Test Your Keys**: Use the built-in test feature to verify your API keys work
4. **Complete Setup**: Activate your preferred providers and complete the setup

### Adding AI Provider API Keys

#### OpenAI
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy the key and paste it in Strepsil setup

#### Anthropic
1. Go to https://console.anthropic.com/
2. Generate an API key
3. Copy the key and paste it in Strepsil setup

## 💬 Using the AI Chat

1. **Navigate to Chat**: Click "Chat" in the sidebar
2. **Select Provider & Model**: Choose your AI provider and model
3. **Adjust Settings**: Configure temperature, max tokens, etc.
4. **Start Chatting**: Every message is automatically tracked for billing
5. **View Costs**: See real-time cost and token usage for each message

## 📊 Tracking & Reports

### Automatic Tracking
- All AI API calls are automatically logged
- Costs calculated based on current pricing
- Latency and token usage tracked
- Success/failure status monitoring

### Analytics Dashboard
- Total spending overview
- Usage trends and patterns
- Model and provider breakdowns
- Daily/weekly/monthly summaries

### Export Options
- **CSV**: For spreadsheet analysis
- **JSON**: For programmatic processing
- **PDF**: For formal reports and receipts

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
PORT=3001
NODE_ENV=development
DATABASE_PATH=./data/strepsil.db
ENCRYPTION_KEY=your-encryption-key-for-api-keys
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:3001/api
```

### Database
- Uses SQLite for local data storage
- Database file created automatically at `backend/data/strepsil.db`
- No external database setup required

## 🐳 Docker Deployment

### Using Docker Compose
```bash
docker-compose up -d
```

### Manual Docker Build
```bash
# Build and run
docker build -t strepsil .
docker run -p 3000:3000 -v $(pwd)/data:/app/data strepsil
```

## 🔒 Security

- **API Keys**: Encrypted at rest using AES-256
- **Local Data**: All data stored locally on your server
- **No External Dependencies**: No third-party analytics or tracking
- **Self-Contained**: Complete offline operation capability

## 📁 Project Structure

```
strepsil/
├── backend/                 # Node.js API server
│   ├── routes/             # API routes
│   ├── utils/              # Database and utilities
│   ├── database/           # Database schema
│   └── data/               # SQLite database (auto-created)
├── frontend/               # React dashboard
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Dashboard pages
│   │   ├── context/        # React context
│   │   └── utils/          # Frontend utilities
│   └── public/
└── scripts/                # Setup and utility scripts
```

## 🌟 Use Cases

- **Development Teams**: Track AI costs across projects
- **Startups**: Monitor AI spending as you scale
- **Agencies**: Generate client reports with detailed AI usage
- **Researchers**: Analyze AI model performance and costs
- **Personal Projects**: Keep track of your AI experimentation costs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI and Anthropic for their amazing AI APIs
- The open-source community for inspiration and tools
- All contributors and users of Strepsil

## 📞 Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/your-username/strepsil/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/your-username/strepsil/discussions)
- 📧 **Email**: support@strepsil.com

---

**Built with ❤️ for the AI community**
