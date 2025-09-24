import React from 'react';
import Image from 'next/image';

interface HeaderProps {
  selectedTeam: string;
  onTeamChange: (team: string) => void;
}

const Header: React.FC<HeaderProps> = ({ selectedTeam, onTeamChange }) => {
  const teams = [
    'All Clubs',
    'Arsenal',
    'Chelsea',
    'Manchester City',
    'Manchester United',
    'Liverpool',
    'Barcelona',
    'Real Madrid',
    'AC Milan',
    'Inter Milan',
    'Juventus',
    'Napoli',
    'PSG',
    'Bayern Munich'
  ];

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-arsenalRed to-red-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and title */}
          <div className="flex items-center space-x-4">
            <Image
              src="/assets/arsenal/lolli-logo.svg"
              alt="lolli logo"
              width={50}
              height={50}
              className="flex-shrink-0"
            />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-sf-pro">
                lolli
              </h1>
              <p className="text-sm text-red-100">
                Instant live-stream links for top Premier & Champions League clubs—no ads, no clutter.
              </p>
            </div>
          </div>

          {/* Team filter */}
          <div className="flex items-center space-x-4">
            <label htmlFor="team-filter" className="text-sm font-medium text-red-100">
              Filter by team:
            </label>
            <select
              id="team-filter"
              value={selectedTeam}
              onChange={(e) => onTeamChange(e.target.value)}
              className="bg-white text-gray-900 px-3 py-2 rounded-lg border-0 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-arsenalRed font-medium min-w-[150px]"
              aria-label="Filter matches by team"
            >
              {teams.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
