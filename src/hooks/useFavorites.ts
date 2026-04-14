import { useState, useEffect, useCallback } from 'react';

export type FavoriteType = 'movie' | 'live' | 'series';

export interface FavoriteItem {
  id: string;
  type: FavoriteType;
  data: any; 
}

export function useFavorites(typeFilter?: FavoriteType) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar inicial y escuchar cambios de otras pestañas o componentes
  useEffect(() => {
    const loadFavorites = () => {
      try {
        const stored = localStorage.getItem('rider_favorites');
        if (stored) {
          setFavorites(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Error loading favorites', e);
      }
      setIsLoaded(true);
    };

    loadFavorites();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'rider_favorites') loadFavorites();
    };

    // Para sincronizar en la misma pestaña
    const handleLocalSync = () => loadFavorites();

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('rider_favorites_synced', handleLocalSync);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('rider_favorites_synced', handleLocalSync);
    };
  }, []);

  const addFavorite = useCallback((item: FavoriteItem) => {
    setFavorites(prev => {
      if (prev.some(f => String(f.id) === String(item.id) && f.type === item.type)) return prev;
      const updated = [item, ...prev];
      localStorage.setItem('rider_favorites', JSON.stringify(updated));
      window.dispatchEvent(new Event('rider_favorites_synced'));
      return updated;
    });
  }, []);

  const removeFavorite = useCallback((id: string, type: FavoriteType) => {
    setFavorites(prev => {
      const updated = prev.filter(f => !(String(f.id) === String(id) && f.type === type));
      localStorage.setItem('rider_favorites', JSON.stringify(updated));
      window.dispatchEvent(new Event('rider_favorites_synced'));
      return updated;
    });
  }, []);

  const isFavorite = useCallback((id: string, type: FavoriteType) => {
    return favorites.some(f => String(f.id) === String(id) && f.type === type);
  }, [favorites]);

  const toggleFavorite = useCallback((item: FavoriteItem) => {
    if (isFavorite(item.id, item.type)) {
      removeFavorite(item.id, item.type);
    } else {
      addFavorite(item);
    }
  }, [isFavorite, addFavorite, removeFavorite]);

  const filteredFavorites = typeFilter ? favorites.filter(f => f.type === typeFilter) : favorites;

  return {
    favorites: filteredFavorites,
    isLoaded,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite
  };
}
