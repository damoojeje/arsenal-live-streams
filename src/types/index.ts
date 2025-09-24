export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  time: string;
  date: string;
  competition: string;
  links: StreamLink[];
  source: string;
}

export interface StreamLink {
  url: string;
  quality: string;
  type: 'stream' | 'acestream' | 'sopcast';
  language?: string;
}

export interface Team {
  name: string;
  aliases: string[];
}

export interface FilteredMatch extends Match {
  isArsenalMatch: boolean;
}
