import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '@/theme';

export type IconName =
  | 'home'
  | 'earn'
  | 'deals'
  | 'rewards'
  | 'me'
  | 'back'
  | 'close'
  | 'info'
  | 'check'
  | 'lock'
  | 'up'
  | 'down'
  | 'chevron'
  | 'search'
  | 'bell'
  | 'book'
  | 'gift'
  | 'shield'
  | 'clock'
  | 'share'
  | 'wallet'
  | 'sparkle';

export function Icon({ name, size = 22, color = colors.navy, strokeWidth = 2.4 }: { name: IconName; size?: number; color?: string; strokeWidth?: number }) {
  const p = { stroke: color, strokeWidth, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {(() => {
        switch (name) {
          case 'home':
            return <Path {...p} d="M4 11 L12 4 L20 11 V20 H14.5 V14.5 H9.5 V20 H4 Z" />;
          case 'earn':
            return (
              <>
                <Circle {...p} cx={12} cy={12} r={8} />
                <Path {...p} d="M12 7.5 V16.5 M9.5 10 C9.5 8.5 14.5 8.5 14.5 10 C14.5 12 9.5 12 9.5 14 C9.5 15.5 14.5 15.5 14.5 14" />
              </>
            );
          case 'deals':
            return (
              <>
                <Path {...p} d="M6 13 H18 L16.5 20 H7.5 Z" />
                <Path {...p} d="M12 13 V8 M12 9 C 10 5, 6.5 6, 7 8.5 C 8 10, 11 10, 12 9 M12 9 C 14 5, 17.5 6, 17 8.5 C 16 10, 13 10, 12 9" />
              </>
            );
          case 'rewards':
            return <Path {...p} d="M12 3.5 L14.6 8.8 L20.4 9.6 L16.2 13.7 L17.2 19.5 L12 16.8 L6.8 19.5 L7.8 13.7 L3.6 9.6 L9.4 8.8 Z" />;
          case 'me':
            return (
              <>
                <Circle {...p} cx={12} cy={8.5} r={3.8} />
                <Path {...p} d="M4.5 20 C 5.5 15.5, 18.5 15.5, 19.5 20" />
              </>
            );
          case 'back':
            return <Path {...p} d="M15 5 L8 12 L15 19" />;
          case 'chevron':
            return <Path {...p} d="M9 5 L16 12 L9 19" />;
          case 'close':
            return <Path {...p} d="M6 6 L18 18 M18 6 L6 18" />;
          case 'info':
            return (
              <>
                <Circle {...p} cx={12} cy={12} r={9} />
                <Path {...p} d="M12 11 V16.5" />
                <Circle cx={12} cy={7.8} r={1.3} fill={color} />
              </>
            );
          case 'check':
            return <Path {...p} d="M5 12.5 L10 17.5 L19 7" />;
          case 'lock':
            return (
              <>
                <Rect {...p} x={5} y={10.5} width={14} height={10} rx={2.5} />
                <Path {...p} d="M8 10.5 V8 C8 3.5 16 3.5 16 8 V10.5" />
              </>
            );
          case 'up':
            return <Path {...p} d="M12 19 V5 M6 11 L12 5 L18 11" />;
          case 'down':
            return <Path {...p} d="M12 5 V19 M6 13 L12 19 L18 13" />;
          case 'search':
            return (
              <>
                <Circle {...p} cx={10.5} cy={10.5} r={6} />
                <Path {...p} d="M15 15 L20 20" />
              </>
            );
          case 'bell':
            return <Path {...p} d="M6 16 V11 C6 5 18 5 18 11 V16 L19.5 18 H4.5 Z M10 20.5 C10.5 21.5 13.5 21.5 14 20.5" />;
          case 'book':
            return <Path {...p} d="M4 5.5 C7 4.5 10 4.5 12 6.5 C14 4.5 17 4.5 20 5.5 V19 C17 18 14 18 12 19.5 C10 18 7 18 4 19 Z M12 6.5 V19.5" />;
          case 'gift':
            return (
              <>
                <Rect {...p} x={4} y={9} width={16} height={11} rx={2} />
                <Path {...p} d="M3.5 9 H20.5 M12 9 V20 M12 9 C 9 3, 5 7, 8.5 9 M12 9 C 15 3, 19 7, 15.5 9" />
              </>
            );
          case 'shield':
            return <Path {...p} d="M12 3.5 L19 6.5 V11.5 C19 16 15.5 19 12 20.5 C8.5 19 5 16 5 11.5 V6.5 Z M9 12 L11.2 14.2 L15.2 9.8" />;
          case 'clock':
            return (
              <>
                <Circle {...p} cx={12} cy={12} r={8.5} />
                <Path {...p} d="M12 7.5 V12 L15 14" />
              </>
            );
          case 'share':
            return <Path {...p} d="M12 15 V4 M7.5 8.5 L12 4 L16.5 8.5 M5 12 V19.5 H19 V12" />;
          case 'wallet':
            return (
              <>
                <Rect {...p} x={3.5} y={6.5} width={17} height={12.5} rx={3} />
                <Path {...p} d="M16 12.5 H20.5 M6 6.5 L15 3.5 L16.5 6.5" />
              </>
            );
          case 'sparkle':
            return <Path {...p} d="M12 3 L13.8 10.2 L21 12 L13.8 13.8 L12 21 L10.2 13.8 L3 12 L10.2 10.2 Z" />;
        }
      })()}
    </Svg>
  );
}
