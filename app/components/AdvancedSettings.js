/**
 * AdvancedSettings component - Collapsible advanced printing options
 */
export default function AdvancedSettings({ 
  showAdvanced, 
  setShowAdvanced,
  template,
  useBlankBackground,
  useA4,
  onTemplateChange,
  onBlankBackgroundChange,
  onA4Change
}) {
  return (
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
              value={template}
              onChange={onTemplateChange}
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
              onChange={onBlankBackgroundChange}
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
                onClick={onA4Change}
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
  );
}
