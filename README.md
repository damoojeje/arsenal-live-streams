# Arsenal Live Streams

A Next.js application that aggregates live streaming links for top European football clubs including Arsenal, Chelsea, Manchester City, Manchester United, Liverpool, Barcelona, Real Madrid, and more.

## Features

- **Multi-source aggregation**: Collects live streams from Streamed.pk, Sportsurge.bz, and TotalSportek007.com
- **Smart filtering**: Only shows matches involving target European clubs
- **Real-time updates**: Auto-refreshes every 5 minutes
- **Responsive design**: Apple-inspired UI with Arsenal red (#DB0007) accents
- **Accessibility**: WCAG AA compliant with proper focus management
- **Error handling**: Graceful fallbacks and user-friendly error messages

## Tech Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: TailwindCSS with custom Arsenal theme
- **Data Sources**: Streamed.pk, Sportsurge.bz, TotalSportek007.com
- **Parsing**: Cheerio for HTML scraping, Puppeteer for dynamic content
- **Testing**: Jest + React Testing Library + Supertest
- **Logging**: Winston for structured logging
- **Deployment**: Vercel with GitHub Actions CI/CD

## Project Structure

```
src/
├── components/          # React components
│   ├── Header.tsx
│   ├── MatchCard.tsx
│   └── MatchList.tsx
├── data/               # Data source modules
│   ├── streamed.ts
│   ├── sportsurge.ts
│   ├── totalsportek.ts
│   └── filter.ts
├── config/             # Configuration files
│   └── teams.json
├── types/              # TypeScript type definitions
│   └── index.ts
├── utils/              # Utility functions
│   └── logger.ts
└── styles/             # Global styles
    └── globals.css

pages/
├── api/                # API routes
│   └── matches.ts
├── _app.tsx
└── index.tsx

test/                   # Test files
├── data/
└── api/
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd arsenal-live-streams
```

2. Install dependencies:
```bash
npm install
```

3. Create logs directory:
```bash
mkdir -p src/logs
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type` - Run TypeScript type checking
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage

## Data Sources

### Streamed.pk
- **API**: `/api/events?sport=football&date=YYYY-MM-DD`
- **Fallback**: HTML scraping of `/category/football`
- **Format**: JSON API with HTML fallback

### Sportsurge.bz
- **Method**: Puppeteer for dynamic content rendering
- **Target**: `/leagues/premier-league`
- **Format**: Client-side rendered content

### TotalSportek007.com
- **Method**: HTML scraping with Cheerio
- **Target**: Homepage live stream links
- **Format**: Static HTML with data attributes

## Filtering Logic

The application filters matches based on a predefined list of target clubs:

- Arsenal, Chelsea, Manchester City, Manchester United
- Newcastle United, Liverpool
- Barcelona, Real Madrid
- AC Milan, Inter Milan, Juventus, Napoli
- PSG, Bayern Munich

Filtering is case-insensitive and supports team aliases (e.g., "Man City" for "Manchester City").

## API Endpoints

### GET /api/matches

Returns filtered live streaming matches.

**Response:**
```json
[
  {
    "id": "streamed-1",
    "homeTeam": "Arsenal",
    "awayTeam": "Chelsea",
    "time": "15:00",
    "date": "2024-01-15",
    "competition": "Premier League",
    "links": [
      {
        "url": "https://streamed.pk/watch/123",
        "quality": "HD",
        "type": "stream",
        "language": "English"
      }
    ],
    "source": "streamed-api",
    "isArsenalMatch": true
  }
]
```

**Cache Headers:**
- `Cache-Control: s-maxage=60, stale-while-revalidate=300`

## Testing

The project includes comprehensive tests:

- **Unit tests**: Data modules and utility functions
- **Integration tests**: API endpoints
- **Component tests**: React components

Run tests:
```bash
npm test
```

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## Environment Variables

- `NODE_ENV` - Environment (development/production)
- `VERCEL_TOKEN` - Vercel deployment token (for CI/CD)
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID

## Monitoring

- **Logging**: Winston logs to `src/logs/fetch.log`
- **Error Tracking**: Sentry integration (optional)
- **Health Checks**: API endpoint monitoring

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m 'feat: add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Credits

Designed and developed by [damoojeje](https://github.com/damoojeje)

---

**Note**: This application is for educational purposes. Please respect the terms of service of the streaming platforms and ensure you have proper rights to access the content.
