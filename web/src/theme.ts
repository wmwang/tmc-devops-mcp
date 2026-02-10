import { createLightTheme, createDarkTheme, type BrandVariants } from '@fluentui/react-components';

// TMC brand colors (modern blue-purple gradient inspired)
const tmcBrand: BrandVariants = {
    10: '#020305',
    20: '#111723',
    30: '#16263D',
    40: '#193253',
    50: '#1B3F6A',
    60: '#1B4C82',
    70: '#18599B',
    80: '#1267B4',
    90: '#3174C2',
    100: '#4F82C8',
    110: '#6790CE',
    120: '#7E9ED5',
    130: '#94ACDB',
    140: '#AAB9E2',
    150: '#BFC8E8',
    160: '#D4D6EF',
};

export const tmcLightTheme = createLightTheme(tmcBrand);
export const tmcDarkTheme = createDarkTheme(tmcBrand);

// 使用淺色主題
export const defaultTheme = tmcLightTheme;
