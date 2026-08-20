/**
 * Drawing fixtures for the game tests.
 *
 * Games no longer see image bytes at all - a client uploads those to /api/v1/drawing and the game
 * message carries only the resulting id (see core/Drawings.ts). So what these tests need is ids:
 * one the store knows about, one that is well-formed but dangling, and the shapes that must be
 * rejected outright. Byte-level validation is covered in test/drawing.test.ts.
 */

/** A well-formed id whose drawing exists. */
export const KNOWN_DRAWING_ID = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';

/** A second stored drawing, for tests that need two distinct links. */
export const OTHER_DRAWING_ID = '0f1e2d3c4b5a69788796a5b4c3d2e1f0';

/**
 * Well-formed but not in the store: what a client would send to make every other player render a
 * hole where an image should be.
 */
export const MISSING_DRAWING_ID = 'ffffffffffffffffffffffffffffffff';

/** Ids that are not even the right shape. */
export const MALFORMED_IDS = [
  'not-an-id',
  '',
  'A1B2C3D4E5F60718293A4B5C6D7E8F90', // uppercase hex
  'a1b2c3d4e5f60718293a4b5c6d7e8f', // too short
  'a1b2c3d4e5f60718293a4b5c6d7e8f901', // too long
  '../../../etc/passwd',
];

/** The pre-raster Paper.js payload, which must no longer be accepted anywhere. */
export const legacyVectorDrawing = [['Path', {}], ['Path', {}]];

/** The set the mocked store reports as present. */
export const STORED_IDS = new Set([KNOWN_DRAWING_ID, OTHER_DRAWING_ID]);
