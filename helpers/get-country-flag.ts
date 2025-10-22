export function getCountryFlagEmoji(countryCode?: string | null) {
  if (!countryCode) {
    return '🏳️';
  }

  const normalizedCode = countryCode.trim().toUpperCase();

  if (normalizedCode.length !== 2 || /[^A-Z]/.test(normalizedCode)) {
    return '🏳️';
  }

  const codePoints = [...normalizedCode].map((char) => 127397 + char.charCodeAt(0));

  return String.fromCodePoint(...codePoints);
}