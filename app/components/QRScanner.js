/**
 * QRScanner component - Modal for scanning QR codes
 */
export default function QRScanner({ showScanner, scannerLoading, onClose }) {
  if (!showScanner) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
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
  );
}
