export function resolveBuildTime(env = process.env) {
  if (env.GHRAB_BUILD_TIME) {
    const d = new Date(env.GHRAB_BUILD_TIME);
    if (!Number.isFinite(d.getTime())) throw new Error('GHRAB_BUILD_TIME must be a valid ISO date/time.');
    return d.toISOString();
  }
  if (env.SOURCE_DATE_EPOCH) {
    if (!/^\d+$/.test(String(env.SOURCE_DATE_EPOCH))) throw new Error('SOURCE_DATE_EPOCH must be integer Unix seconds.');
    const ms = Number(env.SOURCE_DATE_EPOCH) * 1000;
    if (!Number.isSafeInteger(ms)) throw new Error('SOURCE_DATE_EPOCH is outside the supported range.');
    return new Date(ms).toISOString();
  }
  return new Date().toISOString();
}
