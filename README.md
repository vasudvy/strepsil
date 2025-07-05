# Strepsil - AI Usage Tracking and Billing Dashboard

Strepsil is a comprehensive API and dashboard for tracking AI model usage, costs, and generating detailed billing reports. It provides real-time monitoring, cost analysis, and exportable reports for AI applications.

## Features

### 🎯 Core Functionality
- **AI Call Tracking**: Track prompts, responses, tokens, costs, and latency
- **Cost Analysis**: Detailed cost breakdowns by model, endpoint, user, and time
- **Receipt Generation**: Structured receipts for each AI call with metadata
- **Team Management**: Per-user and per-team usage breakdowns
- **Export Reports**: Generate CSV, JSON, and PDF reports
- **Real-time Dashboard**: Telegram-UI inspired clean interface

### 📊 Dashboard Features
- **Timeline View**: Stripe-style events timeline for AI calls
- **Cost Explorer**: Interactive cost analysis with charts and trends
- **Filters**: Filter by models, users, endpoints, latency, cost, status
- **Receipt Details**: View inputs, outputs, model info, and token costs
- **Analytics**: Usage trends, success rates, and performance metrics

### 🔐 Security & Management
- **Authentication**: Supabase-powered user registration and login
- **API Keys**: Generate and manage API keys for integrations
- **Row-Level Security**: Database-level access controls
- **Team Permissions**: Role-based access for team members

## Tech Stack

### Backend
- **Node.js** with Express.js
- **Supabase** for authentication and database
- **JWT** for session management
- **PDF/CSV generation** for reports

### Frontend
- **React 18** with modern hooks
- **Tailwind CSS** for styling
- **Chart.js** for analytics visualization
- **React Router** for navigation
- **Axios** for API calls

### Database
- **PostgreSQL** (via Supabase)
- **Row-Level Security** policies
- **Optimized indexes** for performance

## Quick Start

### Prerequisites
- Node.js 16+ and npm
- Supabase account
- Git

### 1. Clone and Setup

```bash
git clone <repository-url>
cd strepsil
npm install
```

### 2. Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the database schema:
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `database/schema.sql`
   - Execute the script

### 3. Environment Configuration

**Backend** (create `backend/.env`):
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```env
PORT=3001
NODE_ENV=development
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key
JWT_SECRET=your-strong-jwt-secret
FRONTEND_URL=http://localhost:3000
```

**Frontend** (create `frontend/.env`):
```bash
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_SUPABASE_URL=your-supabase-project-url
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Install Dependencies

```bash
# Install all dependencies (backend + frontend)
npm install

# Or install separately
cd backend && npm install
cd ../frontend && npm install
```

### 5. Start Development

```bash
# Start both backend and frontend
npm run dev

# Or start separately
npm run dev:backend  # Starts on http://localhost:3001
npm run dev:frontend # Starts on http://localhost:3000
```

## API Usage

### Authentication

Register a new user:
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "full_name": "John Doe",
    "organization": "Acme Corp"
  }'
```

Login:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Track AI Usage

Record an AI call:
```bash
curl -X POST http://localhost:3001/api/ai-calls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "model_type": "gpt-4",
    "endpoint": "/v1/chat/completions",
    "prompt": "What is machine learning?",
    "response": "Machine learning is...",
    "tokens_in": 100,
    "tokens_out": 150,
    "cost_per_token_in": 0.00003,
    "cost_per_token_out": 0.00006,
    "latency_ms": 1200,
    "status": "success"
  }'
```

### Generate Reports

Get billing report:
```bash
curl "http://localhost:3001/api/reports/billing?format=json&start_date=2024-01-01&end_date=2024-01-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Export as CSV:
```bash
curl "http://localhost:3001/api/reports/billing?format=csv&start_date=2024-01-01&end_date=2024-01-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  --output billing-report.csv
```

## Project Structure

```
strepsil/
├── backend/                 # Express.js API server
│   ├── routes/             # API route handlers
│   ├── middleware/         # Authentication middleware
│   ├── utils/             # Database utilities
│   └── index.js           # Server entry point
├── frontend/               # React dashboard
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Dashboard pages
│   │   ├── context/       # React context providers
│   │   ├── utils/         # API utilities
│   │   └── App.js         # Main React component
│   └── public/            # Static assets
├── database/              # Database schema
│   └── schema.sql         # Supabase setup script
└── package.json           # Workspace configuration
```

## API Documentation

### Endpoints

**Authentication**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

**AI Calls**
- `POST /api/ai-calls` - Record AI usage
- `GET /api/ai-calls` - List AI calls (with filters)
- `GET /api/ai-calls/:id` - Get specific AI call
- `GET /api/ai-calls/analytics/summary` - Usage analytics
- `PATCH /api/ai-calls/:id/status` - Update call status

**Reports**
- `GET /api/reports/billing` - Generate billing report
- `GET /api/reports/cost-breakdown` - Cost analysis
- `GET /api/reports/trends` - Usage trends

**Team Management**
- `GET /api/teams` - List user teams
- `POST /api/teams` - Create team
- `GET /api/teams/:id/analytics` - Team analytics
- `POST /api/teams/:id/invite` - Invite team member

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.

---

Built with ❤️ for the AI community
