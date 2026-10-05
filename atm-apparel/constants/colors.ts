/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    text: '#191817',
    tint: '#191817',
    background: '#F7F5F0',
    foreground: '#191817',
    card: '#FFFFFF',
    cardForeground: '#191817',
    primary: '#191817',
    primaryForeground: '#FFFFFF',
    secondary: '#EAE7E0',
    secondaryForeground: '#292724',
    muted: '#EFEEE9',
    mutedForeground: '#77736D',
    accent: '#D8D0C4',
    accentForeground: '#24211E',
    destructive: '#B64031',
    destructiveForeground: '#FFFFFF',
    border: '#E4E0D8',
    input: '#E4E0D8',
    onImage: '#FFFFFF',
    heroOverlay: 'rgba(25,24,23,0.42)',
  },
  dark: {
    text: '#F4F1EC',
    tint: '#F4F1EC',
    background: '#171614',
    foreground: '#F4F1EC',
    card: '#24221F',
    cardForeground: '#F4F1EC',
    primary: '#F4F1EC',
    primaryForeground: '#191817',
    secondary: '#34312C',
    secondaryForeground: '#F4F1EC',
    muted: '#2A2824',
    mutedForeground: '#B1ACA3',
    accent: '#71685D',
    accentForeground: '#FFFFFF',
    destructive: '#E27466',
    destructiveForeground: '#191817',
    border: '#3A3731',
    input: '#3A3731',
    onImage: '#FFFFFF',
    heroOverlay: 'rgba(25,24,23,0.58)',
  },
  radius: 8,
};

export default colors;
