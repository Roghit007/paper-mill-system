// Blocks NoSQL-injection tricks such as { "email": { "$gt": "" } }.
// Removes any key that starts with "$" or contains "." from the request body.
const clean = (value) => {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value)) {
      if (key.startsWith('$') || key.includes('.') || key === '__proto__') continue;
      out[key] = clean(value[key]);
    }
    return out;
  }
  return value;
};

module.exports = (req, res, next) => {
  if (req.body) req.body = clean(req.body);
  next();
};