/**
 * Dumping this here for now because unsure where to put it. Planetary
 * distances according to NASA:
 * https://www.jpl.nasa.gov/edu/pdfs/ssbeads_answerkey.pdf
 * | ---------------------+---------+---------------------------+--------------
 * | Object               | AU      | Scale Value (centimeters) | Bead Color
 * | ---------------------+---------+---------------------------+--------------
 * | Sun                  | 0.0 AU  | 0 cm                      | Yellow
 * | Mercury              | 0.4 AU  | 4 cm                      | Solid Red
 * | Venus                | 0.7 AU  | 7 cm                      | Cream
 * | Earth                | 1.0 AU  | 10 cm                     | Clear Blue
 * | Mars                 | 1.5 AU  | 15 cm                     | Clear Red
 * | Asteroid Belt        | 2.8 AU  | 28 cm                     | Black
 * | Jupiter              | 5.2 AU  | 52 cm                     | Orange
 * | Saturn               | 9.6 AU  | 96 cm                     | Clear Gold
 * | Uranus               | 19.2 AU | 192 cm                    | Dark Blue
 * | Neptune              | 30.0 AU | 300 cm                    | Light Blue
 * | Pluto (closest)      | 29.7 AU | 297 cm                    | Brown
 * | Pluto (average)      | 39.5 AU | 395 cm                    | Brown
 * | Pluto (most distant) | 49.3 AU | 493 cm                    | Brown
 * | ---------------------+---------+---------------------------+--------------
 *
 * Some other stats:
 * The sun is supposedly 1000x dimmer at pluto
 * surface area = 4 × π × radius ^2
 * https://www.discovermagazine.com/the-sciences/bafact-math-how-bright-is-the-sun-from-pluto
 *
 */

/**
 * Contains units converted to various other units (particularly meters). Note
 * that anything larger than Number.MAX_SAFE_INTEGER [9007199254740991] is
 * inherently inaccurate (although still perfectly usable in many contexts if
 * care is taken). Note that, while there are formulas to derive most of these
 * (particularly parsecs), derivation isn't a good idea because inaccuracies of
 * large numbers produce vastly different results to the actual values. The
 * values used here were calculated by hand hopefully and accurate as possible.
 */
export const Unit = {};

Unit.lightSpeed = {};
// Speed of light in a vacuum. Slows down when not in a vacuum.
Unit.lightSpeed.inMeters = 299792458;

Unit.au = {};
// This is by definition. It used to be 149597870691, but was standardised to
// 149597870700 in 2012 for a multitude of reasons (observer inconsistencies,
// relativistic effects, etc).
Unit.au.inMeters = 149597870700;

Unit.parsec = {};
// To nearest meter, derived from definition:
// π * pc = 180 * 180 * 180 * auInMeters.
// Note that, while this exact value is correct, it's larger than
// Number.MAX_SAFE_INTEGER and will produce bad results in contexts where
// accuracy is needed.
Unit.parsec.inMetersBigInt = BigInt('30856775814913673');
Unit.parsec.inMeters = Number(Unit.parsec.inMetersBigInt);
// ^^ factors:
// 1801n, 12269n, 22096469n, 1396457317n

Unit.centiParsec = {};
Unit.centiParsec.inMeters = 3085677581491367.3; // loses accuracy to .5

Unit.lightYear = {};
// Note that, while this exact value is correct, it's larger than
// Number.MAX_SAFE_INTEGER and will produce bad results in contexts where
// accuracy is needed (we're accurate up to just over 0.9ly).
Unit.lightYear.inMetersBigInt = BigInt('9460730472580800');
Unit.lightYear.inMeters = Number(Unit.lightYear.inMetersBigInt);

export default Unit;
