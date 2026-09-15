import Svg, { Path, Circle, Polyline } from 'react-native-svg';
import type { ColorValue } from 'react-native';

type Props = { color: ColorValue; size: number };

export function DevicesIcon({ color, size }: Props) {
  // Wi-Fi signal arcs + dot
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12.55a11 11 0 0 1 14.08 0"
        stroke={color} strokeWidth={1.8} strokeLinecap="round"
      />
      <Path
        d="M1.42 9a16 16 0 0 1 21.16 0"
        stroke={color} strokeWidth={1.8} strokeLinecap="round"
      />
      <Path
        d="M8.53 16.11a6 6 0 0 1 6.95 0"
        stroke={color} strokeWidth={1.8} strokeLinecap="round"
      />
      <Circle cx={12} cy={20} r={1.2} fill={color} />
    </Svg>
  );
}

export function AccessIcon({ color, size }: Props) {
  // Shield with checkmark
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z"
        stroke={color} strokeWidth={1.8} strokeLinejoin="round"
      />
      <Path
        d="M9 12l2 2 4-4"
        stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

export function WifiIcon({ color, size }: Props) {
  // Router / wireless box
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6.18 15.64a6 6 0 0 1 11.64 0"
        stroke={color} strokeWidth={1.8} strokeLinecap="round"
      />
      <Path
        d="M3 11.98a10 10 0 0 1 18 0"
        stroke={color} strokeWidth={1.8} strokeLinecap="round"
      />
      <Circle cx={12} cy={20} r={1.2} fill={color} />
      <Path
        d="M2 20h20"
        stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeOpacity={0.3}
      />
    </Svg>
  );
}

export function SettingsIcon({ color, size }: Props) {
  // Gear / cog
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={1.8} />
      <Path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke={color} strokeWidth={1.8}
      />
    </Svg>
  );
}
