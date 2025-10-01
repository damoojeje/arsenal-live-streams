import React from 'react';

interface HeaderProps {
  selectedTeam: string;
  onTeamChange: (team: string) => void;
  selectedCompetition?: string;
  onCompetitionChange?: (competition: string) => void;
  selectedCountry?: string;
  onCountryChange?: (country: string) => void;
}

const Header: React.FC<HeaderProps> = ({
  selectedTeam,
  onTeamChange,
  selectedCompetition = 'All Competitions',
  onCompetitionChange,
  selectedCountry = 'All Countries',
  onCountryChange
}) => {
  const teams = [
    'All Clubs',
    'Arsenal',
    'Chelsea',
    'Manchester City',
    'Manchester United',
    'Liverpool',
    'Tottenham',
    'Newcastle',
    'Barcelona',
    'Real Madrid',
    'Atletico Madrid',
    'AC Milan',
    'Inter Milan',
    'Juventus',
    'Napoli',
    'PSG',
    'Bayern Munich',
    'Borussia Dortmund'
  ];

  const competitions = [
    'All Competitions',
    'UEFA Champions League',
    'UEFA Europa League',
    'England - Premier League',
    'England - Championship',
    'England - EFL Trophy',
    'Spain - La Liga',
    'Italy - Serie A',
    'Italy - Serie B',
    'Germany - Bundesliga',
    'France - Ligue 1',
    'Major League Soccer',
    'Brazil - Brasileirão'
  ];

  const countries = [
    'All Countries',
    'England',
    'Spain',
    'Italy',
    'Germany',
    'France',
    'Brazil',
    'USA',
    'Europe',
    'Asia'
  ];

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-arsenalRed to-red-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col space-y-4">
          {/* Filters row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Team filter */}
            <div className="flex flex-col space-y-1">
              <label htmlFor="team-filter" className="text-xs font-medium text-red-100">
                Team
              </label>
              <select
                id="team-filter"
                value={selectedTeam}
                onChange={(e) => onTeamChange(e.target.value)}
                className="bg-white text-gray-900 px-3 py-2 rounded-lg border-0 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-arsenalRed font-medium shadow-sm text-sm"
                aria-label="Filter matches by team"
              >
                {teams.map((team) => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>
            </div>

            {/* Competition filter */}
            {onCompetitionChange && (
              <div className="flex flex-col space-y-1">
                <label htmlFor="competition-filter" className="text-xs font-medium text-red-100">
                  Competition
                </label>
                <select
                  id="competition-filter"
                  value={selectedCompetition}
                  onChange={(e) => onCompetitionChange(e.target.value)}
                  className="bg-white text-gray-900 px-3 py-2 rounded-lg border-0 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-arsenalRed font-medium shadow-sm text-sm"
                  aria-label="Filter matches by competition"
                >
                  {competitions.map((comp) => (
                    <option key={comp} value={comp}>
                      {comp}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Country filter */}
            {onCountryChange && (
              <div className="flex flex-col space-y-1">
                <label htmlFor="country-filter" className="text-xs font-medium text-red-100">
                  Country/Region
                </label>
                <select
                  id="country-filter"
                  value={selectedCountry}
                  onChange={(e) => onCountryChange(e.target.value)}
                  className="bg-white text-gray-900 px-3 py-2 rounded-lg border-0 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-arsenalRed font-medium shadow-sm text-sm"
                  aria-label="Filter matches by country"
                >
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;