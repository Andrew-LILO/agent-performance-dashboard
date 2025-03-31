# Agent Performance Dashboard

A real-time dashboard for monitoring agent call performance and lead management. Built with React and Node.js.

## Features

- Real-time agent performance monitoring
- Call log visualization with detailed metrics
- Lead management and tracking
- Customizable date range filtering
- Disposition-based filtering
- Interactive data visualization
- Detailed lead information modal

## Tech Stack

- Frontend:
  - React
  - Recharts for data visualization
  - Shadcn UI components
  - Tailwind CSS for styling
  
- Backend:
  - Node.js
  - Express
  - Convoso API integration
  - Supabase for data storage

## Setup

1. Clone the repository:
```bash
git clone [your-repo-url]
cd leaderboard-app
```

2. Install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Set up environment variables:
Create `.env` files in both frontend and backend directories with the necessary configuration.

4. Start the development servers:
```bash
# Start backend server
cd backend
npm run dev

# Start frontend development server
cd frontend
npm run dev
```

## Environment Variables

### Backend
```env
CONVOSO_AUTH_TOKEN=your_convoso_token
CONVOSO_API_BASE_URL=your_convoso_api_url
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
PORT=3001
```

### Frontend
```env
VITE_API_BASE_URL=http://localhost:3001
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 