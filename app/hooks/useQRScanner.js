import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

/**
 * Custom hook for QR code scanning functionality
 */
export function useQRScanner(onScan) {
  const [showScanner, setShowScanner] = useState(false);
  const [scannerLoading, setScannerLoading] = useState(false);
  const [error, setError] = useState('');
  const scannerRef = useRef(null);
  const intervalRef = useRef(null);
  const onScanRef = useRef(onScan);

  // Keep the onScan ref up to date
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (showScanner && !scannerRef.current) {
      // Wait for DOM element to be ready
      intervalRef.current = setInterval(() => {
        const element = document.getElementById('qr-reader');
        if (element) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          
          setScannerLoading(true);
          const scanner = new Html5Qrcode('qr-reader');

          const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          };

          const handleSuccess = (decodedText) => {
            onScanRef.current(decodedText);
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
          };

          const handleError = () => {};

          scanner.start(
            { facingMode: "environment" },
            config,
            handleSuccess,
            handleError
          ).then(() => {
            setScannerLoading(false);
          }).catch(() => {
            scanner.start(
              { facingMode: "user" },
              config,
              handleSuccess,
              handleError
            ).then(() => {
              setScannerLoading(false);
            }).catch(() => {
              setScannerLoading(false);
              setError('Unable to access camera. Please check permissions.');
            });
          });

          scannerRef.current = scanner;
        }
      }, 100);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
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

  const handleOpen = () => {
    setShowScanner(true);
    setError('');
  };

  const handleClose = async () => {
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

  return {
    showScanner,
    scannerLoading,
    error,
    handleOpen,
    handleClose
  };
}
