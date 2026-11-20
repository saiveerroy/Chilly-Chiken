import React, { createContext, useContext, useState, useCallback } from 'react';

const SearchContext = createContext(null);

export function SearchProvider({ children }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
    setSearchQuery('');
  }, []);

  return (
    <SearchContext.Provider value={{
      isSearchOpen,
      searchQuery,
      setSearchQuery,
      openSearch,
      closeSearch,
    }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) throw new Error('useSearch must be used inside SearchProvider');
  return context;
}
