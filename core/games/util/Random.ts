// Central-limit "sum of 12" approximation of a Gaussian centered on `middle`, spread by `range`.
// Sums 12 Bernoulli(1/2) samples (Math.round(Math.random()) is 0 or 1 with equal probability),
// giving Binomial(12, 1/2) which the transform maps to roughly [middle - range, middle + range].
//
// Deliberately not Box-Muller: this is a coarser, bounded distribution, and Redacted's random
// censor/truncate modes are tuned against it. Swapping in a true Gaussian changes how those modes
// play, so it is a gameplay decision rather than a cleanup.
export function gauss(range = 1, middle = 0): number {
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Math.round(Math.random());
  return (sum / 6.0 - 1) * range + middle;
}
