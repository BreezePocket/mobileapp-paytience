import { Platform, ViewStyle } from 'react-native';

/**
 * PAYtience visual language, taken from the hackathon promo video:
 * a kawaii sky world, navy ink outlines, sticker cards with hard offset shadows,
 * glossy blue Sprout, smiley gold coins and a cream grid floor.
 */
export const colors = {
  // brand
  blue: '#1F6BFF',
  blueDeep: '#0B4FE0',
  blueSoft: '#D6E6FF',
  cyan: '#13C8FB',
  navy: '#13254D', // ink outline + headings
  ink: '#0B2350', // body text
  muted: '#5A7396',
  faint: '#8FA3BF',

  // world
  skyTop: '#A9D3F5',
  skyBottom: '#E6F2FB',
  cloud: '#FFFFFF',
  floor: '#EFE8DC',
  floorLine: '#FFFFFF',
  paper: '#FFFFFF',
  cream: '#FFF9EE',

  // mascot + props
  sprout: '#3DB35A',
  sproutDark: '#23863E',
  blush: '#FF9EB5',
  coin: '#FFC83D',
  coinDark: '#E09B12',
  pink: '#F9C9D8',
  pinkDeep: '#E2638A',

  // outcomes (never red/green as good/bad)
  keep: '#2FD6C9', // "you get it back"
  keepSoft: '#DDF8F5',
  swap: '#FF6B81', // "the trade happens" (not an error)
  swapSoft: '#FFE3E8',
  earn: '#1FA45A', // upfront pay amounts
  earnSoft: '#DDF5E6',

  // system
  warn: '#8A5A00',
  warnSoft: '#FFEFC7',
  danger: '#A60B00',
  dangerSoft: '#FFD9D5',
  border: '#D0E1EB',
  practice: '#FFD84D',
} as const;

export const fonts = {
  display: 'Fredoka_700Bold',
  displayMedium: 'Fredoka_600SemiBold',
  body: 'Nunito_600SemiBold',
  bodyRegular: 'Nunito_400Regular',
  bodyBold: 'Nunito_800ExtraBold',
} as const;

export const radius = { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

/** Sticker look: navy outline + hard offset shadow. */
export function sticker(offset = 3, borderWidth = 2): ViewStyle {
  return {
    borderWidth,
    borderColor: colors.navy,
    ...Platform.select<ViewStyle>({
      web: { boxShadow: `0px ${offset}px 0px ${colors.navy}` } as ViewStyle,
      default: {
        shadowColor: colors.navy,
        shadowOffset: { width: 0, height: offset },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: offset,
      },
    }),
  };
}

export const MAX_WIDTH = 520;
