import {
  Apple,
  Milk,
  Croissant,
  Beef,
  Fish,
  Snowflake,
  CupSoda,
  Cookie,
  FlaskRound,
  Droplets,
  Wheat,
  Bean,
  SprayCan,
  ShowerHead,
  Home,
  Package,
  CircleHelp,
  type LucideIcon,
} from 'lucide-react';

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  Apple,
  Milk,
  Croissant,
  Beef,
  Fish,
  Snowflake,
  CupSoda,
  Cookie,
  FlaskRound,
  Droplets,
  Wheat,
  Bean,
  SprayConical: SprayCan, // fallback: SprayConical not available
  SprayCan,
  ShowerHead,
  Home,
  Package,
  CircleHelp,
};

export function getCategoryIcon(iconName: string): LucideIcon {
  return CATEGORY_ICON_MAP[iconName] ?? Package;
}
