import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for searching passes
 */
export function usePassSearch(passes) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPasses, setFilteredPasses] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef(null);

  // Handle search input
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === '') {
      setFilteredPasses([]);
      setShowSearchResults(false);
      return;
    }

    // Filter passes by person.name or person.email
    const filtered = passes.filter((pass) => {
      const name = pass.person?.name?.toLowerCase() || '';
      const email = pass.person?.email?.toLowerCase() || '';
      const searchTerm = query.toLowerCase();
      
      return name.includes(searchTerm) || email.includes(searchTerm);
    });

    setFilteredPasses(filtered);
    setShowSearchResults(true);
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const clearSearch = () => {
    setSearchQuery('');
    setFilteredPasses([]);
    setShowSearchResults(false);
  };

  return {
    searchQuery,
    setSearchQuery,
    filteredPasses,
    showSearchResults,
    setShowSearchResults,
    searchRef,
    handleSearchChange,
    clearSearch
  };
}
