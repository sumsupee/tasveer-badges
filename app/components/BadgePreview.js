import { getTemplateColor } from '../lib/templateUtils';

/**
 * BadgePreview component - Shows the template badge will be printed on
 */
export default function BadgePreview({ selectedBadge }) {
  if (!selectedBadge) return null;

  return (
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
  );
}
