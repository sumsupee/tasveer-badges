/**
 * VerificationResult component - Shows QR verification status
 */
export default function VerificationResult({ verifying, verificationResult }) {
  if (verifying) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <p className="text-blue-800 font-medium">Verifying QR code with Eventive API...</p>
        </div>
      </div>
    );
  }

  if (!verificationResult) return null;

  if (verificationResult.found) {
    return (
      <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 space-y-3">
        <div className="flex items-start gap-2">
          <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <h3 className="text-green-800 font-semibold text-lg">✓ Verified with Eventive API</h3>
            <p className="text-green-700 text-sm mt-1">{verificationResult.message}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-md p-3 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide">Main Record ID</p>
              <p className="font-mono text-sm font-semibold text-gray-900 break-all">{verificationResult.mainRecordId}</p>
            </div>
            {verificationResult.isUseRecord && (
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">Scanned Use Ticket ID</p>
                <p className="font-mono text-sm text-gray-700 break-all">{verificationResult.scannedId}</p>
              </div>
            )}
          </div>
          
          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Badge Details</p>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Name:</span> {verificationResult.pass.name}</p>
              {verificationResult.pass.email && (
                <p><span className="font-medium">Email:</span> {verificationResult.pass.email}</p>
              )}
              <p><span className="font-medium">Badge Type:</span> {verificationResult.pass.pass_bucket?.name || 'N/A'}</p>
              {verificationResult.pass.preview_available_ticket_uses && (
                <p><span className="font-medium">Uses:</span> {verificationResult.pass.preview_available_ticket_uses.used} / {verificationResult.pass.preview_available_ticket_uses.total}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
      <div className="flex items-start gap-2">
        <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <div>
          <h3 className="text-red-800 font-semibold">QR Code Not Found</h3>
          <p className="text-red-700 text-sm mt-1">This QR code is not registered in the Eventive API system. Please verify the code or contact support.</p>
        </div>
      </div>
    </div>
  );
}
