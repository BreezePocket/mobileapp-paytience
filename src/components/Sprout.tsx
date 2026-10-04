import { useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, Path, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { colors } from '@/theme';

export const MASCOT_NAME = 'Sprout';

export type SproutMood =
  | 'happy' // open smile (default)
  | 'excited' // heart eyes
  | 'laugh' // ^^ closed eyes, big smile
  | 'worried' // small "o" mouth
  | 'determined' // brows + confident smile
  | 'sleepy' // closed eyes, zzz
  | 'wink'
  | 'thinking';

export type SproutPose = 'idle' | 'wave' | 'cheer' | 'point' | 'hold';
export type SproutProp = 'none' | 'coin' | 'sign' | 'wand' | 'sweat' | 'zzz' | 'sparkles' | 'can';

type Props = {
  size?: number;
  mood?: SproutMood;
  pose?: SproutPose;
  prop?: SproutProp;
  signText?: string;
  animate?: boolean;
  style?: StyleProp<ViewStyle>;
};

const INK = colors.navy;
const BODY = '#1E62F0';
const BODY_LIGHT = '#4C8DFF';
const FEET = '#1747C7';

/** The PAYtience mascot, drawn from the promo video. */
export function Sprout({
  size = 160,
  mood = 'happy',
  pose = 'idle',
  prop = 'none',
  signText = 'Soon!',
  animate = true,
  style,
}: Props) {
  const reduce = useReducedMotion();
  const bob = useSharedValue(0);
  const leaf = useSharedValue(0);

  useEffect(() => {
    if (!animate || reduce) return;
    bob.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
    leaf.value = withRepeat(
      withSequence(withTiming(1, { duration: 1400 }), withTiming(-1, { duration: 1400 })),
      -1,
      true,
    );
  }, [animate, reduce, bob, leaf]);

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -bob.value * size * 0.03 },
      { scaleY: 1 + bob.value * 0.015 },
      { rotate: `${leaf.value * 1.2}deg` },
    ],
  }));

  return (
    <Animated.View style={[{ width: size, height: size * 1.2 }, bodyStyle, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 200 240">
        <Defs>
          <RadialGradient id="gloss" cx="38%" cy="30%" r="75%">
            <Stop offset="0" stopColor={BODY_LIGHT} />
            <Stop offset="0.55" stopColor={BODY} />
            <Stop offset="1" stopColor="#1650D6" />
          </RadialGradient>
          <RadialGradient id="coinG" cx="40%" cy="35%" r="70%">
            <Stop offset="0" stopColor="#FFE17A" />
            <Stop offset="1" stopColor={colors.coin} />
          </RadialGradient>
        </Defs>

        {/* shadow on the floor */}
        <Ellipse cx="100" cy="226" rx="52" ry="7" fill={INK} opacity={0.12} />

        {/* back arm (left side of image) */}
        <Arm side="left" pose={pose} />

        {/* feet */}
        <Ellipse cx="76" cy="212" rx="21" ry="12" fill={FEET} stroke={INK} strokeWidth={4} />
        <Ellipse cx="124" cy="212" rx="21" ry="12" fill={FEET} stroke={INK} strokeWidth={4} />

        {/* stem + leaves */}
        <Path d="M100 58 C 100 46, 100 38, 100 30" stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
        <Path d="M99 32 C 90 14, 70 14, 64 24 C 72 36, 90 38, 99 32 Z" fill={colors.sprout} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
        <Path d="M101 32 C 110 14, 130 14, 136 24 C 128 36, 110 38, 101 32 Z" fill={colors.sprout} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />

        {/* body */}
        <Path
          d="M100 54 C 142 54, 166 98, 166 142 C 166 186, 138 206, 100 206 C 62 206, 34 186, 34 142 C 34 98, 58 54, 100 54 Z"
          fill="url(#gloss)"
          stroke={INK}
          strokeWidth={4.5}
        />
        {/* gloss highlight */}
        <Ellipse cx="68" cy="94" rx="10" ry="19" fill="#FFFFFF" opacity={0.42} transform="rotate(28 68 94)" />
        <Circle cx="80" cy="74" r="3.5" fill="#FFFFFF" opacity={0.55} />

        {/* cheeks */}
        <Ellipse cx="62" cy="146" rx="12" ry="7" fill={colors.blush} opacity={0.9} />
        <Ellipse cx="138" cy="146" rx="12" ry="7" fill={colors.blush} opacity={0.9} />

        <Face mood={mood} />

        {/* front arm */}
        <Arm side="right" pose={pose} />

        <PropLayer prop={prop} signText={signText} />
      </Svg>
    </Animated.View>
  );
}

function Arm({ side, pose }: { side: 'left' | 'right'; pose: SproutPose }) {
  // shoulder points on the body edge
  const sx = side === 'left' ? 40 : 160;
  const sy = 150;
  let hx: number;
  let hy: number;
  const dir = side === 'left' ? -1 : 1;
  switch (pose) {
    case 'cheer':
      hx = sx + dir * 18;
      hy = 96;
      break;
    case 'wave':
      if (side === 'right') {
        hx = sx + 26;
        hy = 100;
      } else {
        hx = sx - 12;
        hy = 188;
      }
      break;
    case 'point':
      if (side === 'right') {
        hx = sx + 36;
        hy = 132;
      } else {
        hx = sx - 12;
        hy = 188;
      }
      break;
    case 'hold':
      hx = sx + dir * 14;
      hy = 60;
      break;
    default:
      hx = sx + dir * 12;
      hy = 190;
  }
  return (
    <G>
      <Path d={`M${sx} ${sy} L${hx} ${hy}`} stroke={INK} strokeWidth={4.5} strokeLinecap="round" />
      <Circle cx={hx} cy={hy} r={8.5} fill="#FFFFFF" stroke={INK} strokeWidth={3.5} />
    </G>
  );
}

function Eye({ cx, cy }: { cx: number; cy: number }) {
  return (
    <G>
      <Ellipse cx={cx} cy={cy} rx={7.5} ry={10} fill={INK} />
      <Circle cx={cx + 2.2} cy={cy - 3.5} r={3} fill="#FFFFFF" />
      <Circle cx={cx - 2.4} cy={cy + 3.5} r={1.4} fill="#FFFFFF" />
    </G>
  );
}

function Heart({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  return (
    <Path
      transform={`translate(${cx} ${cy}) scale(${s})`}
      d="M0 6 C -10 -2, -8 -12, 0 -7 C 8 -12, 10 -2, 0 6 Z"
      fill={colors.swap}
      stroke={INK}
      strokeWidth={2}
    />
  );
}

function Face({ mood }: { mood: SproutMood }) {
  const L = 82;
  const R = 118;
  const EY = 128;
  const smile = (
    <G>
      <Path d="M86 148 Q 100 146 114 148 Q 112 166 100 166 Q 88 166 86 148 Z" fill="#B7284A" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M92 159 Q 100 154 108 159 Q 104 165 100 165 Q 96 165 92 159 Z" fill={colors.blush} />
    </G>
  );
  switch (mood) {
    case 'excited':
      return (
        <G>
          <Heart cx={L} cy={EY} s={1.25} />
          <Heart cx={R} cy={EY} s={1.25} />
          {smile}
        </G>
      );
    case 'laugh':
      return (
        <G>
          <Path d={`M${L - 8} ${EY + 3} Q ${L} ${EY - 8} ${L + 8} ${EY + 3}`} stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
          <Path d={`M${R - 8} ${EY + 3} Q ${R} ${EY - 8} ${R + 8} ${EY + 3}`} stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
          <Path d="M84 146 Q 100 144 116 146 Q 114 170 100 170 Q 86 170 84 146 Z" fill="#B7284A" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <Path d="M91 161 Q 100 155 109 161 Q 105 169 100 169 Q 95 169 91 161 Z" fill={colors.blush} />
        </G>
      );
    case 'worried':
      return (
        <G>
          <Eye cx={L} cy={EY} />
          <Eye cx={R} cy={EY} />
          <Path d={`M${L - 9} ${EY - 17} L${L + 6} ${EY - 14}`} stroke={INK} strokeWidth={3} strokeLinecap="round" />
          <Path d={`M${R + 9} ${EY - 17} L${R - 6} ${EY - 14}`} stroke={INK} strokeWidth={3} strokeLinecap="round" />
          <Ellipse cx="100" cy="156" rx="6" ry="7" fill="#B7284A" stroke={INK} strokeWidth={3} />
        </G>
      );
    case 'determined':
      return (
        <G>
          <Eye cx={L} cy={EY} />
          <Eye cx={R} cy={EY} />
          <Path d={`M${L - 10} ${EY - 18} L${L + 7} ${EY - 12}`} stroke={INK} strokeWidth={4} strokeLinecap="round" />
          <Path d={`M${R + 10} ${EY - 18} L${R - 7} ${EY - 12}`} stroke={INK} strokeWidth={4} strokeLinecap="round" />
          <Path d="M88 150 Q 100 162 112 150" stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
        </G>
      );
    case 'sleepy':
      return (
        <G>
          <Path d={`M${L - 8} ${EY} Q ${L} ${EY + 6} ${L + 8} ${EY}`} stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
          <Path d={`M${R - 8} ${EY} Q ${R} ${EY + 6} ${R + 8} ${EY}`} stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
          <Ellipse cx="100" cy="156" rx="5" ry="4" fill="#B7284A" stroke={INK} strokeWidth={2.5} />
        </G>
      );
    case 'wink':
      return (
        <G>
          <Eye cx={L} cy={EY} />
          <Path d={`M${R - 8} ${EY + 2} Q ${R} ${EY - 7} ${R + 8} ${EY + 2}`} stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
          {smile}
        </G>
      );
    case 'thinking':
      return (
        <G>
          <G transform="translate(3 -4)">
            <Eye cx={L} cy={EY} />
            <Eye cx={R} cy={EY} />
          </G>
          <Path d="M92 156 Q 102 152 110 156" stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
        </G>
      );
    default:
      return (
        <G>
          <Eye cx={L} cy={EY} />
          <Eye cx={R} cy={EY} />
          {smile}
        </G>
      );
  }
}

function PropLayer({ prop, signText }: { prop: SproutProp; signText: string }) {
  switch (prop) {
    case 'coin':
      return (
        <G transform="translate(100 12)">
          <Circle r={17} fill="url(#coinG)" stroke={INK} strokeWidth={3.5} />
          <Circle cx={-5} cy={-3} r={2.2} fill={INK} />
          <Circle cx={5} cy={-3} r={2.2} fill={INK} />
          <Path d="M-6 4 Q 0 10 6 4" stroke={INK} strokeWidth={2.5} fill="none" strokeLinecap="round" />
        </G>
      );
    case 'sign':
      return (
        <G>
          <Path d="M174 132 L174 70" stroke={INK} strokeWidth={4} strokeLinecap="round" />
          <Rect x={132} y={30} width={66} height={42} rx={8} fill={colors.coin} stroke={INK} strokeWidth={3.5} />
          <SvgText x={165} y={57} fontSize={15} fontWeight="bold" fill={INK} textAnchor="middle">
            {signText}
          </SvgText>
        </G>
      );
    case 'wand':
      return (
        <G>
          <Path d="M186 100 L200 70" stroke={INK} strokeWidth={4} strokeLinecap="round" />
          <Path
            transform="translate(200 62)"
            d="M0 -12 L3.5 -4 L12 -3 L5.5 3 L7.5 12 L0 7.5 L-7.5 12 L-5.5 3 L-12 -3 L-3.5 -4 Z"
            fill={colors.coin}
            stroke={INK}
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
        </G>
      );
    case 'sweat':
      return <Path d="M150 92 C 144 104, 146 112, 152 112 C 158 112, 160 104, 150 92 Z" fill="#9FD8FF" stroke={INK} strokeWidth={2.5} />;
    case 'zzz':
      return (
        <G>
          <SvgText x={150} y={62} fontSize={22} fontWeight="bold" fill={colors.blueDeep}>Z</SvgText>
          <SvgText x={168} y={42} fontSize={16} fontWeight="bold" fill={colors.blueDeep}>z</SvgText>
        </G>
      );
    case 'sparkles':
      return (
        <G fill={colors.coin} stroke={INK} strokeWidth={2}>
          <Path transform="translate(28 70)" d="M0 -9 L2.5 -2.5 L9 0 L2.5 2.5 L0 9 L-2.5 2.5 L-9 0 L-2.5 -2.5 Z" />
          <Path transform="translate(176 58) scale(0.8)" d="M0 -9 L2.5 -2.5 L9 0 L2.5 2.5 L0 9 L-2.5 2.5 L-9 0 L-2.5 -2.5 Z" />
          <Path transform="translate(182 176) scale(0.6)" d="M0 -9 L2.5 -2.5 L9 0 L2.5 2.5 L0 9 L-2.5 2.5 L-9 0 L-2.5 -2.5 Z" />
        </G>
      );
    case 'can':
      return (
        <G transform="translate(176 118)">
          <Path d="M8 4 L26 -10" stroke={INK} strokeWidth={4} strokeLinecap="round" />
          <Rect x={-14} y={0} width={26} height={22} rx={5} fill="#7FD3A0" stroke={INK} strokeWidth={3} />
          <Circle cx={30} cy={-4} r={2} fill="#9FD8FF" />
          <Circle cx={34} cy={4} r={2} fill="#9FD8FF" />
        </G>
      );
    default:
      return null;
  }
}
