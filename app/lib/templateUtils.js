import { TEMPLATES } from './constants';

/**
 * Map badge name to template code
 */
export function getTemplateFromBadgeName(badgeName) {
  if (!badgeName) return 'TFFM';
  
  const badgeNameLower = badgeName.toLowerCase();
  
  if (badgeNameLower.includes('tff badge')) return 'TFF';
  if (badgeNameLower.includes('tfm badge')) return 'TFM';
  if (badgeNameLower.includes('tffm')) return 'TFFM';
  
  // Default to TFFM
  return 'TFFM';
}

/**
 * Get template color from template code
 */
export function getTemplateColor(templateCode) {
  return TEMPLATES[templateCode]?.color || 'Yellow';
}
