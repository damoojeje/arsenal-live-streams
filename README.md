# lolli - Live Football Streams

A professional Next.js application that provides instant live streaming links for top football clubs worldwide. Features Arsenal-themed branding and real-time match data from Mad Titan Sports backend.

## Features

- **Mad Titan Sports Integration**: Real-time match data from magnetic.website backend
- **DaddyLive Streaming**: High-quality iframe streams for all live matches
- **Smart Match Management**: Auto-removes matches 2h 3min after kickoff
- **Real-time Updates**: Auto-refreshes every 10 minutes
- **Professional UI**: Clean, Arsenal-branded interface with red (#DB0007) theme
- **Multi-Competition Support**: Premier League, Champions League, La Liga, Serie A, Bundesliga, Ligue 1, and more
- **Advanced Filtering**: Filter by team, competition, and country
- **Responsive Design**: Mobile-optimized with fullscreen streaming support
- **Arsenal Verification**: Fun landing page with slider verification

## Tech Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: TailwindCSS with custom Arsenal theme
- **Data Source**: Mad Titan Sports backend (magnetic.website)
- **Streaming**: DaddyLive iframe integration
- **State Management**: React Hooks with localStorage persistence
- **Icons & Assets**: Custom Arsenal branding (cannon, lollipop logo)
- **Deployment**: systemd service on Ubuntu server

## Project Structure

```
pages/
├── api/
│   └── magnetic-games.ts    # Fetches live games from magnetic.website
├── player/
│   └── [channelId].tsx     # DaddyLive stream player with fullscreen
├── _app.tsx
├── index.tsx               # Landing page with Arsenal verification
└── dashboard.tsx           # Main dashboard with match list

src/
├── components/
│   ├── Header.tsx          # Navigation with filters
│   ├── MatchCard.tsx       # Individual match display
│   └── MatchList.tsx       # Grid layout for matches
├── types/
│   └── index.ts            # TypeScript type definitions
├── utils/
│   └── linkQuality.ts      # Stream quality scoring
└── styles/
    └── globals.css         # TailwindCSS + Arsenal theme

public/
├── assets/
│   └── arsenal/            # Arsenal branding assets
├── icons/                  # PWA icons
└── manifest.json           # Progressive Web App config
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

## Architecture

### Mad Titan Sports Integration

This application integrates with the Mad Titan Sports backend (same source used by the Mad Titan Kodi addon):

- **Data Source**: `https://magnetic.website/todays_games2.txt`
- **Format**: Pipe-delimited text (TIME | SPORT | EVENT | CHANNELS)
- **Update Frequency**: Real-time, fetched every 10 minutes
- **Filtering**: Football/Soccer matches only

### Match Data Flow

1. **Backend API** (`/api/magnetic-games`) fetches live games from magnetic.website
2. **Parser** extracts team names, times, and competition info
3. **Dashboard** displays filtered matches with auto-refresh
4. **Match Cards** show stream links routing through `/player/[channelId]`
5. **Player Page** embeds DaddyLive iframe streams

### Smart Match Management

- **Live Matches**: Displayed with animated red indicator
- **Upcoming Matches**: Sorted by time (earliest first)
- **TBD Matches**: Shown at the end of the list
- **Auto-Removal**: Matches removed 2h 3min after kickoff
- **Time Conversion**: UTC times converted to user's local timezone

### Filtering System

The application provides three filter levels:

1. **Team Filter**: Filter by specific clubs (All Clubs, Arsenal, Chelsea, Man City, etc.)
2. **Competition Filter**: Filter by league/tournament (All, Premier League, Champions League, etc.)
3. **Country Filter**: Filter by country/region (All, England, Spain, Europe, etc.)

Filters are case-insensitive and support partial matching.

## API Endpoints

### GET /api/magnetic-games

Fetches live football matches from Mad Titan Sports backend.

**Response:**
```json
[
  {
    "id": "magnetic-1727716800000-0",
    "homeTeam": "Arsenal",
    "awayTeam": "Chelsea",
    "time": "15:00",
    "date": "2025-09-30T12:00:00.000Z",
    "competition": "England Premier League",
    "links": [],
    "source": "magnetic",
    "isArsenalMatch": true,
    "streamLinks": [
      {
        "source": "DaddyLive",
        "url": "#",
        "quality": "HD"
      }
    ]
  }
]
```

**Data Processing:**
- Parses `todays_games2.txt` from magnetic.website
- Filters for football/soccer matches only
- Extracts team names from "Team A vs Team B" format
- Identifies Arsenal matches automatically
- Returns JSON array of parsed matches

### Player Routes

**GET /player/[channelId]**

Dynamic route for DaddyLive stream player.

- **channelId**: DaddyLive channel identifier
- **Iframe URL**: `https://dlhd.dad/stream/stream-{channelId}.php`
- **Features**: Fullscreen support, back navigation, live indicator

## Deployment

### Production Server (systemd)

This application runs as a systemd service on Ubuntu:

1. **Build the application:**
```bash
npm run build
```

2. **Install systemd service:**
```bash
sudo systemctl enable arsenal-streams.service
sudo systemctl start arsenal-streams.service
```

3. **Check service status:**
```bash
sudo systemctl status arsenal-streams.service
```

4. **View logs:**
```bash
sudo journalctl -u arsenal-streams.service -f
```

### systemd Service Configuration

Location: `/etc/systemd/system/arsenal-streams.service`

```ini
[Unit]
Description=Arsenal Live Streams - lolli
After=network.target

[Service]
Type=simple
User=olabi
WorkingDirectory=/home/olabi/docker/watch_arsenal
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3002

[Install]
WantedBy=multi-user.target
```

### nginx Reverse Proxy

The application is served through nginx with SSL:

```nginx
server {
    listen 443 ssl http2;
    server_name lolli.eniolabi.com;

    ssl_certificate /etc/letsencrypt/live/lolli.eniolabi.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/lolli.eniolabi.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Environment Variables

- `NODE_ENV=production` - Production environment
- `PORT=3002` - Application port (proxied by nginx) - **RESERVED FOR lolli.eniolabi.com**

## Monitoring

- **systemd logs**: `journalctl -u arsenal-streams.service`
- **Service status**: `systemctl status arsenal-streams.service`
- **Auto-restart**: Enabled with 10-second delay on failure

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m 'feat: add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Version History

### v2.0 - Production Release (September 2025)
- Integrated Mad Titan Sports backend API
- Removed provider selection UI (single DaddyLive source)
- Removed mock/sample data completely
- Professional UI improvements (reduced header height)
- Smart match removal (2h 3min post-kickoff)
- Fixed visual issues (Arsenal red branding throughout)
- Updated documentation and production deployment

### v1.0 - Initial Release
- Multi-provider architecture (Streamed.pk, Sportsurge, TotalSportek)
- Basic filtering and match display
- Arsenal-themed UI

## Credits

Designed and developed by [damoojeje](https://github.com/damoojeje/arsenal-live-streams)

**Arsenal till I die!** 🔴

---

## Disclaimer

This application aggregates publicly available streaming links. All streams are provided by third-party sources. We do not host, upload, or control any of the content.

**Recommended**: Use an ad blocker like [uBlock Origin](https://ublockorigin.com) or [AdGuard](https://adguard.com) for the best viewing experience.
