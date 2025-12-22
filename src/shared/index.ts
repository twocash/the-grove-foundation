// src/shared/index.ts
// Barrel export for shared components

// Collection components
export { CollectionHeader } from './CollectionHeader';
export { SearchInput } from './SearchInput';
export { FilterButton, type FilterOption } from './FilterButton';
export { SortButton, type SortOption } from './SortButton';
export { ActiveIndicator } from './ActiveIndicator';

// Layout primitives
export { ThreeColumnLayout } from './layout';
export { InspectorPanel, InspectorSection, InspectorDivider } from './layout';
export { NavigationTree, type NavItem } from './layout';

// Form components
export { Toggle } from './forms';
export { Slider } from './forms';
export { Select } from './forms';
export { Checkbox } from './forms';
export { TextInput } from './forms';
export { TextArea } from './forms';

// Feedback components
export { EmptyState } from './feedback';
export { LoadingSpinner } from './feedback';
export { StatusBadge } from './feedback';
export { InfoCallout } from './feedback';
