// language=glsl
const import_log10 = `
#ifndef RLOG10
  // Reciprocal of log(10). Core component needed to calculate log10(x).
  #define RLOG10 (1.0 / log(10.0))
#endif

float log10(float number) {
  return RLOG10 * log(number);
}
`;

export {
  import_log10,
}
