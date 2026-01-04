// src/bedrock/utils/icon-mapping.ts
// Maps Lucide icon names to Material Symbols equivalents
// Sprint: lens-icon-fix

/**
 * Lucide → Material Symbols mapping
 * Used when legacy data stores Lucide names but UI uses Material Symbols
 */
const LUCIDE_TO_MATERIAL: Record<string, string> = {
  // Navigation & UI
  Compass: 'explore',
  Home: 'home',
  Settings: 'settings',
  Menu: 'menu',
  Search: 'search',
  Filter: 'filter_alt',
  
  // People & Business
  Building2: 'business',
  Briefcase: 'work',
  GraduationCap: 'school',
  Scale: 'balance',
  Network: 'hub',
  Globe: 'public',
  
  // Objects
  Boxes: 'inventory_2',
  Box: 'inventory',
  Package: 'package_2',
  
  // Nature
  Leaf: 'eco',
  TreePine: 'park',
  Flower: 'local_florist',
  
  // Communication
  MessageSquare: 'chat',
  Mail: 'mail',
  Bell: 'notifications',
  
  // Media
  Image: 'image',
  Camera: 'photo_camera',
  Video: 'videocam',
  Music: 'music_note',
  
  // Files
  File: 'description',
  FileText: 'article',
  Folder: 'folder',
  
  // Actions
  Plus: 'add',
  Minus: 'remove',
  X: 'close',
  Check: 'check',
  Edit: 'edit',
  Trash: 'delete',
  Copy: 'content_copy',
  
  // Arrows
  ArrowRight: 'arrow_forward',
  ArrowLeft: 'arrow_back',
  ArrowUp: 'arrow_upward',
  ArrowDown: 'arrow_downward',
  ChevronRight: 'chevron_right',
  ChevronLeft: 'chevron_left',
  ChevronUp: 'expand_less',
  ChevronDown: 'expand_more',
  
  // Status
  AlertCircle: 'error',
  AlertTriangle: 'warning',
  Info: 'info',
  HelpCircle: 'help',
  CheckCircle: 'check_circle',
  XCircle: 'cancel',
  
  // Misc
  Star: 'star',
  Heart: 'favorite',
  Bookmark: 'bookmark',
  Clock: 'schedule',
  Calendar: 'calendar_today',
  Map: 'map',
  MapPin: 'location_on',
  Link: 'link',
  ExternalLink: 'open_in_new',
  Download: 'download',
  Upload: 'upload',
  Share: 'share',
  Lock: 'lock',
  Unlock: 'lock_open',
  Eye: 'visibility',
  EyeOff: 'visibility_off',
  User: 'person',
  Users: 'group',
  Zap: 'bolt',
  Sparkles: 'auto_awesome',
};

/**
 * Convert a Lucide icon name to Material Symbols equivalent
 * Returns the original if already a Material Symbol or no mapping exists
 */
export function toMaterialIcon(icon: string | undefined): string | undefined {
  if (!icon) return undefined;
  
  // Check if it's a Lucide icon (PascalCase) vs Material Symbol (snake_case)
  const isPascalCase = /^[A-Z]/.test(icon);
  
  if (isPascalCase && LUCIDE_TO_MATERIAL[icon]) {
    return LUCIDE_TO_MATERIAL[icon];
  }
  
  // Already Material Symbols or unknown - return as-is
  return icon;
}

/**
 * Check if icon looks like Material Symbols format
 */
export function isMaterialIcon(icon: string): boolean {
  // Material Symbols use snake_case or single lowercase words
  return /^[a-z][a-z0-9_]*$/.test(icon);
}

export default toMaterialIcon;
