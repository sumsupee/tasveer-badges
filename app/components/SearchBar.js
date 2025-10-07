/**
 * SearchBar component for searching passes by name or email
 */
export default function SearchBar({ 
  searchQuery, 
  handleSearchChange, 
  searchRef,
  filteredPasses,
  showSearchResults,
  setShowSearchResults,
  onSelectPerson,
  isPickedUp,
  onRefresh,
  loading
}) {
  return (
    <div className="relative" ref={searchRef}>
      <div className="flex items-center justify-between mb-1.5 sm:mb-2">
        <label htmlFor="search" className="block text-sm font-medium text-gray-700">
          Search Person
        </label>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh data"
        >
          <svg
            className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>
      <div className="relative">
        <input
          type="text"
          id="search"
          value={searchQuery}
          onChange={handleSearchChange}
          onFocus={() => {
            if (filteredPasses.length > 0) {
              setShowSearchResults(true);
            }
          }}
          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 pr-10 border border-teal-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
          placeholder="Search by name or email..."
        />
        {loading ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-600"></div>
          </div>
        ) : (
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showSearchResults && filteredPasses.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-teal-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredPasses.map((pass) => {
            const pickedUp = isPickedUp(pass.id);
            return (
              <button
                key={pass.id}
                type="button"
                onClick={() => onSelectPerson(pass)}
                className={`w-full px-3 sm:px-4 py-2.5 text-left hover:bg-teal-50 border-b border-teal-100 last:border-b-0 transition-colors ${
                  pickedUp ? 'bg-green-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {pass.person?.name || pass.person?.email || 'Unknown'}
                    </div>
                    {pass.person?.name && (
                      <div className="text-sm text-gray-500">{pass.person?.email}</div>
                    )}
                    <div className="text-xs text-teal-600 mt-0.5">{pass.pass_bucket?.name}</div>
                  </div>
                  {pickedUp && (
                    <div className="flex-shrink-0 ml-2">
                      <svg
                        className="w-5 h-5 text-green-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                {pickedUp && (
                  <div className="text-xs text-green-600 font-medium mt-1">✓ Picked Up</div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {showSearchResults && filteredPasses.length === 0 && searchQuery.trim() !== '' && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-teal-300 rounded-md shadow-lg p-4 text-center text-gray-500 text-sm">
          No results found
        </div>
      )}
    </div>
  );
}
