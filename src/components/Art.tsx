import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, Path, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '@/theme';

/** Smiley gold coin from the promo video. */
export function Coin({ size = 28, face = true, label }: { size?: number; face?: boolean; label?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Defs>
        <RadialGradient id="cg" cx="38%" cy="32%" r="75%">
          <Stop offset="0" stopColor="#FFE58F" />
          <Stop offset="1" stopColor={colors.coin} />
        </RadialGradient>
      </Defs>
      <Circle cx={20} cy={20} r={17} fill="url(#cg)" stroke={colors.navy} strokeWidth={3} />
      <Circle cx={20} cy={20} r={12.5} fill="none" stroke={colors.coinDark} strokeWidth={1.5} opacity={0.6} />
      {label ? (
        <SvgText x={20} y={25} fontSize={14} fontWeight="bold" fill={colors.navy} textAnchor="middle">
          {label}
        </SvgText>
      ) : face ? (
        <G>
          <Circle cx={15} cy={17} r={2} fill={colors.navy} />
          <Circle cx={25} cy={17} r={2} fill={colors.navy} />
          <Path d="M14 23 Q 20 29 26 23" stroke={colors.navy} strokeWidth={2.4} fill="none" strokeLinecap="round" />
        </G>
      ) : null}
    </Svg>
  );
}

export function CloudShape({ width = 120, opacity = 1 }: { width?: number; opacity?: number }) {
  return (
    <Svg width={width} height={width * 0.52} viewBox="0 0 120 62" opacity={opacity}>
      <Path
        d="M18 56 C 4 56, 3 38, 16 36 C 14 22, 32 16, 40 26 C 44 8, 72 6, 76 24 C 84 14, 102 20, 98 34 C 114 34, 116 56, 100 56 Z"
        fill="#FFFFFF"
        stroke={colors.navy}
        strokeWidth={3}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Sky gradient with outlined clouds, optional cream grid floor. */
export function SkyBackground({ floor = false, clouds = true }: { floor?: boolean; clouds?: boolean }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={[colors.skyTop, colors.skyBottom]} style={StyleSheet.absoluteFill} />
      {clouds && (
        <>
          <View style={{ position: 'absolute', top: 60, left: -30 }}>
            <CloudShape width={110} opacity={0.9} />
          </View>
          <View style={{ position: 'absolute', top: 150, right: -24 }}>
            <CloudShape width={130} opacity={0.9} />
          </View>
        </>
      )}
      {floor && <Floor />}
    </View>
  );
}

export function Floor({ height = 120 }: { height?: number }) {
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height }}>
      <Svg width="100%" height="100%" viewBox="0 0 400 120" preserveAspectRatio="none">
        <Path d="M0 0 H400 V120 H0 Z" fill={colors.floor} />
        <Line x1={0} y1={1.5} x2={400} y2={1.5} stroke={colors.navy} strokeWidth={3} />
        {[30, 65, 105].map((y) => (
          <Line key={y} x1={0} y1={y} x2={400} y2={y} stroke="#fff" strokeWidth={2} />
        ))}
        {[-200, -100, 0, 100, 200, 300, 400, 500, 600].map((x) => (
          <Line key={x} x1={200 + (x - 200) * 0.35} y1={2} x2={x} y2={120} stroke="#fff" strokeWidth={2} />
        ))}
      </Svg>
    </View>
  );
}

/** A deal's pot in the Cloud Garden: plant height follows time elapsed, blooms when ended. */
export function Pot({ stage, size = 72, color = colors.blue, glyph = '' }: { stage: number; size?: number; color?: string; glyph?: string }) {
  const stemTop = [54, 46, 38, 32, 30][stage] ?? 30;
  const leaf = [0.6, 0.8, 1, 1, 1][stage] ?? 1;
  return (
    <Svg width={size} height={size * 1.15} viewBox="0 0 80 92">
      {/* stem */}
      <Path d={`M40 82 L40 ${stemTop}`} stroke={colors.navy} strokeWidth={3} strokeLinecap="round" />
      <G transform={`translate(40 ${stemTop + 6}) scale(${leaf}) translate(-40 ${-(stemTop + 6)})`}>
        <Path d={`M40 ${stemTop + 6} C 30 ${stemTop - 6}, 18 ${stemTop}, 22 ${stemTop + 8} C 28 ${stemTop + 14}, 36 ${stemTop + 10}, 40 ${stemTop + 6} Z`} fill={colors.sprout} stroke={colors.navy} strokeWidth={2.5} />
        <Path d={`M40 ${stemTop + 6} C 50 ${stemTop - 6}, 62 ${stemTop}, 58 ${stemTop + 8} C 52 ${stemTop + 14}, 44 ${stemTop + 10}, 40 ${stemTop + 6} Z`} fill={colors.sprout} stroke={colors.navy} strokeWidth={2.5} />
      </G>
      {stage >= 3 && stage < 4 && <Circle cx={40} cy={stemTop - 2} r={5} fill={colors.blush} stroke={colors.navy} strokeWidth={2.5} />}
      {stage >= 4 && (
        <G>
          {[0, 72, 144, 216, 288].map((r) => (
            <Circle key={r} cx={40 + 8 * Math.cos((r * Math.PI) / 180)} cy={stemTop - 4 + 8 * Math.sin((r * Math.PI) / 180)} r={6} fill={colors.pink} stroke={colors.navy} strokeWidth={2.2} />
          ))}
          <Circle cx={40} cy={stemTop - 4} r={5} fill={colors.coin} stroke={colors.navy} strokeWidth={2.2} />
        </G>
      )}
      {/* pot */}
      <Path d="M18 70 H62 L57 90 H23 Z" fill={color} stroke={colors.navy} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M14 64 H66 V72 H14 Z" fill={color} stroke={colors.navy} strokeWidth={3} strokeLinejoin="round" />
      <SvgText x={40} y={85} fontSize={11} fontWeight="bold" fill="#fff" textAnchor="middle">
        {glyph}
      </SvgText>
    </Svg>
  );
}
