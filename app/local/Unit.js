// Contains units converted to various other units (particularly meters). Note
// that anything larger than Number.MAX_SAFE_INTEGER [9007199254740991] is
// inherently inaccurate (although still perfectly usable in many contexts if
// care is taken). Note that, while there are formulas to derive most of these
// (particularly parsecs), derivation isn't a good idea because inaccuracies of
// large numbers produce vastly different results to the actual values. The
// values used here were calculated by hand hopefully and accurate as possible.
export const Unit = {};

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
Unit.parsec.inMeters = BigInt('30856775814913673');
// ^^ factors:
// 1801n, 12269n, 22096469n, 1396457317n

Unit.lightYear = {};
// Note that, while this exact value is correct, it's larger than
// Number.MAX_SAFE_INTEGER and will produce bad results in contexts where
// accuracy is needed (we're accurate up to just over 0.9ly).
Unit.lightYear.inMeters = BigInt('9460730472580800');

export default Unit;

