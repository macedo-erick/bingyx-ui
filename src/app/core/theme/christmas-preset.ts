import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

// Christmas red as the primary, warm cream surfaces by day and pine green ones for the
// "noite de Natal" dark scheme the draw screen uses.
export const ChristmasPreset = definePreset(Aura, {
  primitive: {
    borderRadius: {
      none: '0',
      xs: '4px',
      sm: '6px',
      md: '10px',
      lg: '14px',
      xl: '20px',
    },
  },
  semantic: {
    primary: {
      50: '#fdf2f3',
      100: '#fce4e7',
      200: '#f9cdd3',
      300: '#f3a4ae',
      400: '#ea7083',
      500: '#dc4460',
      600: '#c52640',
      700: '#b3122b',
      800: '#8e0e22',
      900: '#7a1124',
      950: '#440510',
    },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '#fff8ee',
          100: '#fbf1e1',
          200: '#f1e6d2',
          300: '#eadfcb',
          400: '#c4b59b',
          500: '#8f8370',
          600: '#6e6a5c',
          700: '#5c5a4e',
          800: '#3e3a31',
          900: '#1f2a22',
          950: '#141a16',
        },
        primary: {
          color: '{primary.700}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.800}',
          activeColor: '{primary.900}',
        },
        highlight: {
          background: '{primary.50}',
          focusBackground: '{primary.100}',
          color: '{primary.800}',
          focusColor: '{primary.900}',
        },
      },
      dark: {
        surface: {
          0: '#ffffff',
          50: '#e9f2ec',
          100: '#d6e6da',
          200: '#b9cfbf',
          300: '#7fa08c',
          400: '#5a7f69',
          500: '#3f7356',
          600: '#2e6b48',
          700: '#1f5a3e',
          800: '#133a29',
          900: '#0f2a1e',
          950: '#0b2318',
        },
        primary: {
          color: '{primary.400}',
          contrastColor: '#1a0508',
          hoverColor: '{primary.300}',
          activeColor: '{primary.200}',
        },
        highlight: {
          background: 'color-mix(in srgb, {primary.400}, transparent 84%)',
          focusBackground: 'color-mix(in srgb, {primary.400}, transparent 76%)',
          color: 'rgba(255,255,255,.87)',
          focusColor: 'rgba(255,255,255,.87)',
        },
      },
    },
  },
});
