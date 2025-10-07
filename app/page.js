'use client';

import { useState, useCallback } from 'react';
import { generateBadge } from './lib/badgeGenerator';
import { verifyQRCode as apiVerifyQRCode } from './lib/apiService';
import { getTemplateFromBadgeName } from './lib/templateUtils';
import { useQRScanner } from './hooks/useQRScanner';
import { usePassSearch } from './hooks/usePassSearch';
import { usePickups } from './hooks/usePickups';
import { usePasses } from './hooks/usePasses';
import SearchBar from './components/SearchBar';
import QRScanner from './components/QRScanner';
import VerificationResult from './components/VerificationResult';
import BadgePreview from './components/BadgePreview';
import AdvancedSettings from './components/AdvancedSettings';

export default function Home() {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    id: '',
    template: 'TFFM'
  });
  const [useBlankBackground, setUseBlankBackground] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [useA4, setUseA4] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Selected badge info
  const [selectedBadge, setSelectedBadge] = useState(null);
  
  // QR verification state
  const [verificationResult, setVerificationResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  // Custom hooks
  const { passes, loading: passesLoading, fetchPasses } = usePasses();
  const { pickups, pickupLoading, isPickedUp, handlePickup: doPickup, fetchPickups } = usePickups();
  
  const {
    searchQuery,
    setSearchQuery,
    filteredPasses,
    showSearchResults,
    setShowSearchResults,
    searchRef,
    handleSearchChange,
    clearSearch
  } = usePassSearch(passes);

  // Verify QR code against Eventive API
  const verifyQRCode = useCallback(async (qrCode) => {
    setVerifying(true);
    setError('');
    setVerificationResult(null);
    
    try {
      const data = await apiVerifyQRCode(qrCode);

      if (!data.found) {
          setError(data.message || 'QR code not found in the system');
          setVerificationResult({ found: false });
          // Clear form fields when QR code is not found
          setFormData({
            name: '',
            id: '',
            template: 'TFFM'
          });
          setSearchQuery('');
          setSelectedBadge(null);
          return null;
      }

      setVerificationResult(data);
      
      // Auto-populate form with verified data
      if (data.found && data.pass) {
        const template = getTemplateFromBadgeName(data.pass.pass_bucket?.name);
        setFormData({
          name: data.pass.name,
          id: data.mainRecordId,
          template: template
        });
        
        // Set selected badge to show the "Print On" box
        setSelectedBadge({
          name: data.pass.pass_bucket?.name || '',
          template: template
        });
        
        // Clear any previous errors
        if (data.isUseRecord) {
          setError('');
        }
      }

      return data;
    } catch (err) {
      console.error('Error verifying QR code:', err);
      setError(err.message || 'Failed to verify QR code');
      setVerificationResult({ found: false, error: true });
      // Clear form fields on error
      setFormData({
        name: '',
        id: '',
        template: 'TFFM'
      });
      clearSearch();
      setSelectedBadge(null);
      return null;
    } finally {
      setVerifying(false);
    }
  }, [setSearchQuery, clearSearch]);

  const {
    showScanner,
    scannerLoading,
    error: scannerError,
    handleOpen: handleScanClick,
    handleClose: handleCloseScanner
  } = useQRScanner(verifyQRCode);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await generateBadge({
        name: formData.name,
          id: formData.id,
        template: formData.template,
        useBlankBackground,
        useA4
      });

      setFormData({
        name: '',
        id: '',
        template: formData.template
      });
      // Clear verification result after printing
      setVerificationResult(null);
      setSelectedBadge(null);
    } catch (err) {
      setError(err.message || 'Failed to generate badge');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
    // Clear verification result when manually editing ID field
    if (e.target.name === 'id') {
      setVerificationResult(null);
      setError('');
    }
  };

  // Handle selecting a person from search results
  const handleSelectPerson = (pass) => {
    const displayName = pass.person?.name || pass.person?.email || '';
    const badgeName = pass.pass_bucket?.name || '';
    const template = getTemplateFromBadgeName(badgeName);
    
    setFormData({
      ...formData,
      name: displayName,
      id: pass.id || '',
      template: template
    });
    setSearchQuery(displayName);
    setSelectedBadge({
      name: badgeName,
      template: template
    });
    setShowSearchResults(false);
    setVerificationResult(null);
    setError('');
  };

  // Handle marking badge as picked up
  const handlePickupClick = async () => {
    if (!formData.id) {
      setError('Please enter or select a badge ID');
      return;
    }

    setError('');

    try {
      const pickup = await doPickup({
        id: formData.id,
        name: formData.name,
        email: ''
      });
      
      // Show success message
      alert(`Badge picked up successfully!\n\nName: ${formData.name}\nID: ${formData.id}\nTime: ${new Date(pickup.pickedUpAt).toLocaleString()}`);
      
      // Clear form and verification result
      setFormData({
        name: '',
        id: '',
        template: 'TFFM'
      });
      clearSearch();
      setSelectedBadge(null);
      setVerificationResult(null);
    } catch (err) {
      setError(err.message || 'Failed to mark badge as picked up');
    }
  };

  // Handle refresh button
  const handleRefresh = () => {
    fetchPasses();
    fetchPickups();
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div className="bg-white rounded-lg sm:rounded-xl shadow-2xl p-4 sm:p-6 md:p-8 w-full max-w-md border border-teal-100">
        <div className="flex justify-center mb-4 sm:mb-6">
          <img 
            src="/tasveer-20yrs.webp" 
            alt="Tasveer 20 Years" 
            className="h-12 sm:h-14 md:h-16 w-auto"
          />
        </div>
        
        <h1 className="font-[family-name:var(--font-bebas-neue)] text-3xl sm:text-4xl md:text-5xl text-center mb-6 sm:mb-8 text-teal-700 tracking-wider">
          Tasveer Badge Printer
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Search Bar */}
          <SearchBar
            searchQuery={searchQuery}
            handleSearchChange={handleSearchChange}
            searchRef={searchRef}
            filteredPasses={filteredPasses}
            showSearchResults={showSearchResults}
            setShowSearchResults={setShowSearchResults}
            onSelectPerson={handleSelectPerson}
            isPickedUp={isPickedUp}
            onRefresh={handleRefresh}
            loading={passesLoading}
          />

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              Print Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-teal-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
              placeholder="Enter person's name"
              required
            />
          </div>

          <div>
            <label htmlFor="id" className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              Scan ID (for QR Code)
            </label>
            <div className="relative">
              <input
                type="text"
                id="id"
                name="id"
                value={formData.id}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 pr-10 sm:pr-12 border border-teal-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
                placeholder="Enter ID number"
                required
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleScanClick();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-teal-600 hover:text-teal-800 hover:bg-teal-50 rounded transition-colors"
                title="Scan QR Code"
              >
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </button>
            </div>
          </div>

          {/* QR Verification Result */}
          <VerificationResult 
            verifying={verifying}
            verificationResult={verificationResult}
          />

          {/* Badge Preview */}
          {verificationResult && verificationResult.found && selectedBadge && (
            <BadgePreview selectedBadge={selectedBadge} />
          )}

          {!verificationResult && selectedBadge && (
            <BadgePreview selectedBadge={selectedBadge} />
          )}

          {(error || scannerError) && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-md text-sm">
              {error || scannerError}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-teal-600 text-white py-2.5 sm:py-3 px-4 rounded-md hover:bg-teal-700 active:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-base"
            >
              {loading ? 'Preparing...' : 'Print Badge'}
            </button>
            
            <button
              type="button"
              onClick={handlePickupClick}
              disabled={pickupLoading || !formData.id}
              className="flex-1 bg-green-600 text-white py-2.5 sm:py-3 px-4 rounded-md hover:bg-green-700 active:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-base"
            >
              {pickupLoading ? 'Processing...' : 'Pick-Up Badge'}
            </button>
          </div>

          <AdvancedSettings
            showAdvanced={showAdvanced}
            setShowAdvanced={setShowAdvanced}
            template={formData.template}
            useBlankBackground={useBlankBackground}
            useA4={useA4}
            onTemplateChange={handleChange}
            onBlankBackgroundChange={(e) => setUseBlankBackground(e.target.checked)}
            onA4Change={() => setUseA4(!useA4)}
          />
        </form>

        <div className="mt-4 sm:mt-6 text-center text-teal-600">
          <p className="text-xs leading-relaxed">Made for <a href="https://tasveer.org" target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-teal-800 active:text-teal-900">Tasveer</a> by <a href="https://www.sumedhsupe.com" target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-teal-800 active:text-teal-900">Sumedh</a></p>
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QRScanner 
        showScanner={showScanner}
        scannerLoading={scannerLoading}
        onClose={handleCloseScanner}
      />
    </main>
  );
}