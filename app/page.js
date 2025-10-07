'use client';

import { useState, useEffect, useRef } from 'react';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import QRCode from 'qrcode';
import { Html5Qrcode } from 'html5-qrcode';

const NAME_BOX_X = 33.84;
const NAME_BOX_WIDTH = 220.32;
const NAME_Y = 233;

const QR_X = 120;
const QR_Y = 160;
const QR_SIZE = 50;

export default function Home() {
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
  const [showScanner, setShowScanner] = useState(false);
  const [scannerLoading, setScannerLoading] = useState(false);
  const scannerRef = useRef(null);
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [passes, setPasses] = useState([]);
  const [filteredPasses, setFilteredPasses] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef(null);
  const [selectedBadge, setSelectedBadge] = useState(null);
  
  // Pickup tracking
  const [pickups, setPickups] = useState([]);
  const [pickupLoading, setPickupLoading] = useState(false);

  // Map badge names to template codes
  const getTemplateFromBadgeName = (badgeName) => {
    if (!badgeName) return 'TFFM';
    
    const badgeNameLower = badgeName.toLowerCase();
    
    if (badgeNameLower.includes('tff badge')) return 'TFF';
    if (badgeNameLower.includes('tfm badge')) return 'TFM';
    if (badgeNameLower.includes('tffm')) return 'TFFM';
    
    // Default to TFFM
    return 'TFFM';
  };

  // Map template codes to colors
  const getTemplateColor = (templateCode) => {
    const colorMap = {
      'TFFM': 'Yellow',
      'TFF': 'Pink',
      'TFM': 'Blue'
    };
    return colorMap[templateCode] || 'Yellow';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { name, id, template } = formData;

      let pdfDoc;

      if (useBlankBackground) {
        const templateUrl = `/template_${template}.pdf`;
        const templateResponse = await fetch(templateUrl);
        const templatePdfBytes = await templateResponse.arrayBuffer();
        const tempDoc = await PDFDocument.load(templatePdfBytes);
        const tempPage = tempDoc.getPages()[0];
        const { width, height } = tempPage.getSize();
        
        pdfDoc = await PDFDocument.create();
        pdfDoc.addPage([width, height]);
      } else {
        const templateUrl = `/template_${template}.pdf`;
        const templateResponse = await fetch(templateUrl);
        const templatePdfBytes = await templateResponse.arrayBuffer();
        pdfDoc = await PDFDocument.load(templatePdfBytes);
      }

      let font;
      try {
        const fontResponse = await fetch('/BebasNeue-Regular.ttf');
        if (!fontResponse.ok) throw new Error('Font not found');
        
        const fontBytes = await fontResponse.arrayBuffer();
        
        pdfDoc.registerFontkit(fontkit);
        
        font = await pdfDoc.embedFont(fontBytes, { subset: true });
      } catch (err) {
        font = await pdfDoc.embedFont('Helvetica-Bold');
      }

      const pages = pdfDoc.getPages();
      const firstPage = pages[0];

      const nameCenterX = NAME_BOX_X + (NAME_BOX_WIDTH / 2);
      const fontSize = 24;

      const textWidth = font.widthOfTextAtSize(name, fontSize);
      const textX = nameCenterX - (textWidth / 2);

      firstPage.drawText(name, {
        x: textX,
        y: NAME_Y,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0),
      });

      const qrCodeDataUrl = await QRCode.toDataURL(id.toString(), {
        width: QR_SIZE * 2,
        margin: 1,
      });

      const qrCodeBase64 = qrCodeDataUrl.split(',')[1];
      const qrCodeBytes = Uint8Array.from(atob(qrCodeBase64), c => c.charCodeAt(0));

      const qrImage = await pdfDoc.embedPng(qrCodeBytes);

      firstPage.drawImage(qrImage, {
        x: QR_X,
        y: QR_Y,
        width: QR_SIZE,
        height: QR_SIZE,
      });

      // Handle A4 printing if enabled
      if (useA4) {
        const templatePage = firstPage;
        const templateSize = templatePage.getSize();
        
        // A4 size in points: 595.28 x 841.89
        const A4_WIDTH = 595.28;
        const A4_HEIGHT = 841.89;
        
        // Create a new PDF document with A4 size
        const a4PdfDoc = await PDFDocument.create();
        const a4Page = a4PdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
        
        // Embed the current page as a form object
        const [embeddedPage] = await a4PdfDoc.embedPdf(await pdfDoc.save(), [0]);
        
        // Calculate position: center horizontally, align to top
        const xOffset = (A4_WIDTH - templateSize.width) / 2;
        const yOffset = A4_HEIGHT - templateSize.height;
        
        // Draw the embedded page on the A4 page
        a4Page.drawPage(embeddedPage, {
          x: xOffset,
          y: yOffset,
          width: templateSize.width,
          height: templateSize.height,
        });
        
        // Replace the original PDF doc with the A4 one
        pdfDoc = a4PdfDoc;
      }

      const pdfBytes = await pdfDoc.save();

      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      const printWindow = window.open(url, '_blank');
      
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
        
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 1000);
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = `badge_${name.replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      setFormData({
        name: '',
        id: '',
        template: formData.template
      });
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
  };

  useEffect(() => {
    if (showScanner && !scannerRef.current) {
      setScannerLoading(true);
      const scanner = new Html5Qrcode('qr-reader');

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      };

      scanner.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          setFormData((prev) => ({
            ...prev,
            id: decodedText
          }));
          setScannerLoading(false);
          scanner.stop()
            .then(() => {
              scanner.clear();
              scannerRef.current = null;
              setShowScanner(false);
            })
            .catch(() => {
              scannerRef.current = null;
              setShowScanner(false);
            });
        },
        () => {}
      ).then(() => {
        setScannerLoading(false);
      }).catch(() => {
        scanner.start(
          { facingMode: "user" },
          config,
          (decodedText) => {
            setFormData((prev) => ({
              ...prev,
              id: decodedText
            }));
            setScannerLoading(false);
            scanner.stop()
              .then(() => {
                scanner.clear();
                scannerRef.current = null;
                setShowScanner(false);
              })
              .catch(() => {
                scannerRef.current = null;
                setShowScanner(false);
              });
          },
          () => {}
        ).then(() => {
          setScannerLoading(false);
        }).catch(() => {
          setScannerLoading(false);
          setError('Unable to access camera. Please check permissions.');
        });
      });

      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop()
          .then(() => {
            if (scannerRef.current) {
              scannerRef.current.clear();
              scannerRef.current = null;
            }
            setScannerLoading(false);
          })
          .catch(() => {
            scannerRef.current = null;
            setScannerLoading(false);
          });
      }
    };
  }, [showScanner]);

  const handleScanClick = () => {
    setShowScanner(true);
  };

  const handleCloseScanner = async () => {
    setScannerLoading(false);
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (error) {
        // Ignore errors when stopping scanner
      } finally {
        scannerRef.current = null;
      }
    }
    setShowScanner(false);
    setError('');
  };

  // Fetch passes data from API
  const fetchPasses = async () => {
    setSearchLoading(true);
    try {
      const response = await fetch('/api/passes', {
        // Ensure we always get fresh data
        cache: 'no-store'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch passes');
      }
      
      const data = await response.json();
      setPasses(data.passes || []);
    } catch (err) {
      console.error('Error fetching passes:', err);
      setError('Failed to load passes data. Please try refreshing.');
    } finally {
      setSearchLoading(false);
    }
  };

  // Fetch pickups data
  const fetchPickups = async () => {
    try {
      const response = await fetch('/api/pickups', {
        cache: 'no-store'
      });
      if (response.ok) {
        const data = await response.json();
        setPickups(data.pickups || []);
      }
    } catch (err) {
      console.error('Error fetching pickups:', err);
    }
  };

  // Check if a badge is picked up
  const isPickedUp = (badgeId) => {
    return pickups.some(p => p.id === badgeId);
  };

  // Handle marking badge as picked up
  const handlePickup = async () => {
    if (!formData.id) {
      setError('Please enter or select a badge ID');
      return;
    }

    if (isPickedUp(formData.id)) {
      setError('This badge has already been picked up');
      return;
    }

    setPickupLoading(true);
    setError('');

    try {
      const response = await fetch('/api/pickups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: formData.id,
          name: formData.name,
          email: '' // We can add email field if needed
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark badge as picked up');
      }

      const data = await response.json();
      
      // Refresh pickups list
      await fetchPickups();
      
      // Show success message
      alert(`Badge picked up successfully!\n\nName: ${formData.name}\nID: ${formData.id}\nTime: ${new Date(data.pickup.pickedUpAt).toLocaleString()}`);
      
      // Clear form
      setFormData({
        name: '',
        id: '',
        template: 'TFFM'
      });
      setSearchQuery('');
      setSelectedBadge(null);
    } catch (err) {
      setError(err.message || 'Failed to mark badge as picked up');
    } finally {
      setPickupLoading(false);
    }
  };

  useEffect(() => {
    fetchPasses();
    fetchPickups();
  }, []);

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
    setFilteredPasses([]);
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
          <div className="relative" ref={searchRef}>
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                Search Person
              </label>
              <button
                type="button"
                onClick={fetchPasses}
                disabled={searchLoading}
                className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh data"
              >
                <svg
                  className={`w-4 h-4 ${searchLoading ? 'animate-spin' : ''}`}
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
              {searchLoading ? (
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
                      onClick={() => handleSelectPerson(pass)}
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

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              Name
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
              ID (for QR Code)
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
                onClick={handleScanClick}
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

          {/* Print On Section */}
          {selectedBadge && (
            <div className="bg-teal-50 border-2 border-teal-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Print On:</h3>
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <img
                    src={`/template_${selectedBadge.template}.png`}
                    alt={`${selectedBadge.name} template`}
                    className="w-20 h-auto border border-teal-300 rounded shadow-sm"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-teal-900">
    
                    Template: {selectedBadge.template} - <span className="font-semibold">{getTemplateColor(selectedBadge.template)}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-md text-sm">
              {error}
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
              onClick={handlePickup}
              disabled={pickupLoading || !formData.id}
              className="flex-1 bg-green-600 text-white py-2.5 sm:py-3 px-4 rounded-md hover:bg-green-700 active:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-base"
            >
              {pickupLoading ? 'Processing...' : 'Pick-Up Badge'}
            </button>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="p-2 text-teal-600 hover:text-teal-800 active:text-teal-900 hover:bg-teal-50 rounded-md transition-colors touch-manipulation"
              title="Advanced Settings"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            
            {showAdvanced && (
              <div className="mt-2 p-3 sm:p-4 border border-teal-200 rounded-md bg-teal-50 space-y-3 sm:space-y-4">
                <div>
                  <label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Template Dimensions
                  </label>
                  <select
                    id="template"
                    name="template"
                    value={formData.template}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-teal-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm bg-white font-sans"
                    required
                  >
                    <option value="TFFM">TFFM</option>
                    <option value="TFF">TFF</option>
                    <option value="TFM">TFM</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Determines the PDF size and element positions
                  </p>
                </div>

                <div className="flex items-start sm:items-center">
                  <input
                    type="checkbox"
                    id="useBlankBackground"
                    checked={useBlankBackground}
                    onChange={(e) => setUseBlankBackground(e.target.checked)}
                    className="w-4 h-4 mt-0.5 sm:mt-0 text-teal-600 border-teal-300 rounded focus:ring-teal-500 flex-shrink-0"
                  />
                  <label htmlFor="useBlankBackground" className="ml-2 text-sm text-gray-700 leading-tight sm:leading-normal">
                    Use blank background (uncheck to use template design)
                  </label>
                </div>

                <div className="pt-2 border-t border-teal-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Page Size</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <label className="text-sm text-gray-700">A4 Format</label>
                      <div className="relative group">
                        <svg 
                          className="w-4 h-4 text-gray-400 cursor-help"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-10 w-56">
                          <div className="bg-gray-900 text-white text-xs rounded-md py-2 px-3 shadow-lg">
                            Turn it off if you have custom sizes set up on your printer. 
                            <div className="absolute left-1/2 -translate-x-1/2 top-full -mt-1 border-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUseA4(!useA4)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
                        useA4 ? 'bg-teal-600' : 'bg-gray-300'
                      }`}
                      title="Toggle A4 Print Format"
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          useA4 ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        <div className="mt-4 sm:mt-6 text-center text-teal-600">
          <p className="text-xs leading-relaxed">Made for <a href="https://tasveer.org" target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-teal-800 active:text-teal-900">Tasveer</a> by <a href="https://www.sumedhsupe.com" target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-teal-800 active:text-teal-900">Sumedh</a></p>
        </div>
      </div>

      {showScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md relative">
            <button
              onClick={handleCloseScanner}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 p-2 z-10"
              aria-label="Close scanner"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-xl font-semibold mb-4 text-teal-700">Scan QR Code</h2>
            
            {scannerLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-4"></div>
                  <p className="text-gray-600">Starting camera...</p>
                </div>
              </div>
            )}
            
            <div id="qr-reader" className="w-full min-h-[300px] flex items-center justify-center bg-black rounded-lg overflow-hidden"></div>
            
            <p className="mt-4 text-sm text-gray-600 text-center">
              Position the QR code within the scanning frame
            </p>
          </div>
        </div>
      )}
    </main>
  );
}