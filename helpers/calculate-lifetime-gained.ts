/**
 * Calculate estimated lifetime gained by quitting smoking
 * Based on epidemiological studies showing smoking reduces life expectancy
 *
 * @param age - Current age of the person
 * @param smokingHistory - Years of smoking history
 * @param initialIntake - Daily nicotine intake in mg
 * @returns Estimated years of life gained by quitting
 */
export function calculateLifeTimeGained(
  age: number | null | undefined,
  smokingHistory: number | null | undefined,
  initialIntake: number | null | undefined
): number {
  // Validate inputs - check for null/undefined and ensure they're valid numbers
  if (
    age == null ||
    smokingHistory == null ||
    initialIntake == null ||
    !Number.isFinite(age) ||
    !Number.isFinite(smokingHistory) ||
    !Number.isFinite(initialIntake)
  ) {
    return 0;
  }

  if (age <= 0 || smokingHistory <= 0 || initialIntake <= 0) {
    return 0;
  }

  // Convert nicotine mg to approximate cigarette equivalents
  // Average cigarette contains ~1.2mg nicotine
  const cigarettesPerDay = initialIntake / 1.2;
  
  // Average life expectancy reduction per pack-year (20 cigarettes = 1 pack)
  // Studies suggest ~6-7 minutes lost per cigarette, roughly 2 months per pack-year
  const packsPerDay = cigarettesPerDay / 20;
  const packYears = packsPerDay * smokingHistory;

  // Younger quitters gain more years back
  let recoveryFactor = 1.0;
  if (age < 35) {
    recoveryFactor = 0.9; // Can recover ~90% of lost time
  } else if (age < 45) {
    recoveryFactor = 0.7; // Can recover ~70% of lost time
  } else if (age < 55) {
    recoveryFactor = 0.5; // Can recover ~50% of lost time
  } else {
    recoveryFactor = 0.3; // Can recover ~30% of lost time
  }

  // Calculate years gained (conservative estimate)
  // Each pack-year costs about 0.15-0.2 years of life
  const yearsLostPerPackYear = 0.17;
  const totalYearsLost = packYears * yearsLostPerPackYear;
  const yearsGained = totalYearsLost * recoveryFactor;

  // Cap at reasonable maximum (10 years)
  return Math.min(Math.max(0, yearsGained), 10);
}

/**
 * Format lifetime gained into a readable string
 * 
 * @param years - Number of years gained
 * @returns Formatted string representation
 */
export function formatLifeTimeGained(years: number): string {
  if (!years || years <= 0) {
    return 'N/A';
  }

  const wholeYears = Math.floor(years);
  const months = Math.round((years - wholeYears) * 12);

  if (wholeYears === 0 && months > 0) {
    return `${months} ${months === 1 ? 'month' : 'months'}`;
  }

  if (months === 0 || months >= 11) {
    // Round to nearest year if months is 0 or close to 12
    const roundedYears = months >= 11 ? wholeYears + 1 : wholeYears;
    return `${roundedYears} ${roundedYears === 1 ? 'year' : 'years'}`;
  }

  // Display both years and months
  const yearText = `${wholeYears} ${wholeYears === 1 ? 'year' : 'years'}`;
  const monthText = `${months} ${months === 1 ? 'month' : 'months'}`;
  
  return `${yearText}, ${monthText}`;
}