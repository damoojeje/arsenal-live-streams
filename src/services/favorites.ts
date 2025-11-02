/**
 * Favorites Service
 * Manages user's favorite teams with localStorage persistence
 */

const FAVORITES_STORAGE_KEY = 'lolli_favorite_teams';

/**
 * Get all favorite teams
 */
export function getFavoriteTeams(): Set<string> {
  if (typeof window === 'undefined') return new Set();

  try {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!stored) return new Set();

    const favorites = JSON.parse(stored);
    return new Set(favorites);
  } catch (error) {
    console.error('Error loading favorites:', error);
    return new Set();
  }
}

/**
 * Save favorite teams to localStorage
 */
function saveFavoriteTeams(favorites: Set<string>): void {
  if (typeof window === 'undefined') return;

  try {
    const array = Array.from(favorites);
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(array));
  } catch (error) {
    console.error('Error saving favorites:', error);
  }
}

/**
 * Add a team to favorites
 */
export function addFavoriteTeam(teamName: string): void {
  const favorites = getFavoriteTeams();
  const normalized = teamName.toLowerCase().trim();
  favorites.add(normalized);
  saveFavoriteTeams(favorites);
}

/**
 * Remove a team from favorites
 */
export function removeFavoriteTeam(teamName: string): void {
  const favorites = getFavoriteTeams();
  const normalized = teamName.toLowerCase().trim();
  favorites.delete(normalized);
  saveFavoriteTeams(favorites);
}

/**
 * Toggle favorite status for a team
 */
export function toggleFavoriteTeam(teamName: string): boolean {
  const favorites = getFavoriteTeams();
  const normalized = teamName.toLowerCase().trim();

  if (favorites.has(normalized)) {
    favorites.delete(normalized);
    saveFavoriteTeams(favorites);
    return false; // Now not favorite
  } else {
    favorites.add(normalized);
    saveFavoriteTeams(favorites);
    return true; // Now favorite
  }
}

/**
 * Check if a team is in favorites
 */
export function isFavoriteTeam(teamName: string): boolean {
  const favorites = getFavoriteTeams();
  const normalized = teamName.toLowerCase().trim();
  return favorites.has(normalized);
}

/**
 * Check if a match involves any favorite teams
 */
export function isMatchFavorited(homeTeam: string, awayTeam: string): boolean {
  return isFavoriteTeam(homeTeam) || isFavoriteTeam(awayTeam);
}

/**
 * Clear all favorites
 */
export function clearAllFavorites(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(FAVORITES_STORAGE_KEY);
}

/**
 * Get count of favorite teams
 */
export function getFavoritesCount(): number {
  return getFavoriteTeams().size;
}
