import React from 'react';
import Svg, { Path, Circle, Rect, G, Line } from 'react-native-svg';

type IconProps = { size?: number; color?: string };

export function HomeIcon({ size = 24, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SparklesIcon({ size = 24, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18.5 16l.7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7.7-2.3z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5.5 16l.7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7.7-2.3z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ShieldIcon({ size = 24, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3l7 3v5c0 4.5-3.5 8.5-7 10-3.5-1.5-7-5.5-7-10V6l7-3z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 12l2 2 4-4"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SwordsIcon({ size = 24, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 3L3 6l2 2 3-3-2-2z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18 3l3 3-2 2-3-3 2-2z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 8l2 12 3-2 2 3 2-3 3 2 2-12"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function UserIcon({ size = 24, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={1.8} />
      <Path
        d="M4 21c0-3.5 3.5-6 8-6s8 2.5 8 6"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function HeartIcon({ size = 22, color = '#A0A0B0' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21c0 0-8-6-8-12 0-3 2-5 4-5 2 0 4 2 4 2s2-2 4-2c2 0 4 2 4 5 0 6-8 12-8 12z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CommentIcon({ size = 22, color = '#A0A0B0' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 11c0 4.5-3.5 8-9 8-1.5 0-3-.3-4.5-.9L3 20l1.9-4.1C3.5 14.5 3 12.8 3 11c0-4.5 3.5-8 9-8s9 3.5 9 8z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ShareIcon({ size = 22, color = '#A0A0B0' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="18" cy="5" r="3" stroke={color} strokeWidth={1.8} />
      <Circle cx="6" cy="12" r="3" stroke={color} strokeWidth={1.8} />
      <Circle cx="18" cy="19" r="3" stroke={color} strokeWidth={1.8} />
      <Path
        d="M8.5 13.5l7 3M15.5 7.5l-7 3"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function BookmarkIcon({ size = 22, color = '#A0A0B0' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 4h12v16l-6-4-6 4V4z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function StarIcon({ size = 18, color = '#6B6B78' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path
        d="M9 2l2.5 5.5 6 1-4.5 4 1.5 6.5L9 15.5 3.5 19 5 12.5.5 8.5l6-1L9 2z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ArrowLeftIcon({ size = 24, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12l7 7M5 12l7-7"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PlusIcon({ size = 24, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function SendIcon({ size = 22, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 11.5L21 3l-8.5 18-4-8.5z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function MoreIcon({ size = 20, color = '#A0A0B0' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill={color}>
      <Circle cx="10" cy="4" r="1.5" />
      <Circle cx="10" cy="10" r="1.5" />
      <Circle cx="10" cy="16" r="1.5" />
    </Svg>
  );
}

export function AiIcon({ size = 16, color = '#7C3AFF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
      <Path d="M8 1l1.5 4.5L14 7l-4.5 1.5L8 13 6.5 8.5 2 7l4.5-1.5L8 1z" />
    </Svg>
  );
}

export function CrownIcon({ size = 20, color = '#FFD700' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M2 18l2-11 4 4 2-8 2 8 4-4 2 11H2z"
        fill={color}
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ChevronDownIcon({ size = 20, color = '#5E6468' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M5 7.5l5 5 5-5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function EyeIcon({ size = 16, color = '#5E6468' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

export function EditIcon({ size = 22, color = '#A0A0B0' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20h9"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16.5 3.5a2.12 2.12 0 113 3L7 19l-4 1 1-4 12.5-12.5z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SearchIcon({ size = 20, color = '#5E6468' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth={1.8} />
      <Path d="M16.5 16.5L21 21" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function CloseIcon({ size = 24, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function CheckIcon({ size = 24, color = '#10B981' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 13l4 4 10-10"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function RefreshIcon({ size = 22, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 3v6h-6M3 21v-6h6"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M21 9c-1.5-3.5-5-6-9-6s-9 4-9 9m0 6c1.5 3.5 5 6 9 6s9-4 9-9"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function LiveDotIcon({ size = 8, color = '#FF4444' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 8 8" fill={color}>
      <Circle cx="4" cy="4" r="4" />
    </Svg>
  );
}

const BRAND_ACTIVE = '#F7B84B';
const BRAND_INACTIVE = '#5E6468';

export function BellIcon({ size = 24, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
        fill={color}
      />
    </Svg>
  );
}

export function TabFeedIcon({
  focused,
  size = 24,
}: {
  focused?: boolean;
  color?: string;
  size?: number;
}) {
  return <HomeIcon color={focused ? BRAND_ACTIVE : BRAND_INACTIVE} size={size} />;
}
export function TabCreateIcon({
  focused,
  size = 24,
}: {
  focused?: boolean;
  color?: string;
  size?: number;
}) {
  return <SparklesIcon color={focused ? BRAND_ACTIVE : BRAND_INACTIVE} size={size} />;
}
export function TabLegionIcon({
  focused,
  size = 24,
}: {
  focused?: boolean;
  color?: string;
  size?: number;
}) {
  return <ShieldIcon color={focused ? BRAND_ACTIVE : BRAND_INACTIVE} size={size} />;
}
export function TabPkIcon({
  focused,
  size = 24,
}: {
  focused?: boolean;
  color?: string;
  size?: number;
}) {
  return <SwordsIcon color={focused ? BRAND_ACTIVE : BRAND_INACTIVE} size={size} />;
}
export function TabProfileIcon({
  focused,
  size = 24,
}: {
  focused?: boolean;
  color?: string;
  size?: number;
}) {
  return <UserIcon color={focused ? BRAND_ACTIVE : BRAND_INACTIVE} size={size} />;
}

export function PlayIcon({ size = 48, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.5} />
      <Path d="M10 8l6 4-6 4V8z" fill={color} />
    </Svg>
  );
}

/* NOTE: Rect/G/Line imported but intentionally not used in current icon set. */
void Rect;
void G;
void Line;
