// Generates random JSON, where size is the size in KB. For example,
// jsonNoiseGen(50000) will generate just under 50MB of JSON string that looks
// like: ["0.8414631846233733","0.5578395798684737", ... ]
function jsonNoiseGen(size) {
  // Math.random() will usually generate between 18 and 21 of bytes of chars.
  // Syntax chars increase this by about 1.3% at 1000k.
  size = ((size * 1024) / 21);
  size -= size * 0.013;
  const result = [];
  for (let i = 0, len = size; i < len; i++) {
    result.push('' + Math.random());
  }
  return JSON.stringify(result);
}

export {
  jsonNoiseGen,
}
