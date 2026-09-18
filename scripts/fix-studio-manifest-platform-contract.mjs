#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const consumer = JSON.parse(fs.readFileSync(path.join(root, 'ghrab-platform.consumer.json'), 'utf8'));
const targets = ['studio-manifest.json', 'app-manifest.json'];
let processed = 0;

for (const name of targets) {
  const target = path.join(dist, name);
  if (!fs.existsSync(target)) continue;
  const manifest = JSON.parse(fs.readFileSync(target, 'utf8'));

  // Final publication boundary: preserve app-specific/newer keys, but make the
  // canonical Studio-visible contract explicit. This is deliberately a merge,
  // not a destructive replacement of the whole platform object.
  manifest.platform = {
    ...(manifest.platform || {}),
    schema: 'ghrab-platform-app-integration-v1',
    contract: consumer.platform.contract,
    requiredPlatformRange: consumer.platform.requiredRange,
    platformVersion: consumer.platform.version,
    brandVersion: consumer.brand.version,
    themeContract: 'ghrab-theme-v1',
    swContract: 1,
    studioBridge: 2,
    artifactEnvelope: 1,
    storagePrefix: `ghrab.${consumer.appId}.`,
    cacheName: consumer.cache.name,
  };

  const failures = [];
  const p = manifest.platform;
  if (manifest.id !== consumer.appId) failures.push('id');
  if (manifest.version !== consumer.appVersion) failures.push('version');
  if (p.schema !== 'ghrab-platform-app-integration-v1') failures.push('platform.schema');
  if (p.contract !== 'ghrab-platform-v1') failures.push('platform.contract');
  if (p.requiredPlatformRange !== consumer.platform.requiredRange) failures.push('platform.requiredPlatformRange');
  if (p.platformVersion !== consumer.platform.version) failures.push('platform.platformVersion');
  if (p.brandVersion !== consumer.brand.version) failures.push('platform.brandVersion');
  if (p.themeContract !== 'ghrab-theme-v1') failures.push('platform.themeContract');
  if (p.swContract !== 1) failures.push('platform.swContract');
  if (p.studioBridge !== 2) failures.push('platform.studioBridge');
  if (p.artifactEnvelope !== 1) failures.push('platform.artifactEnvelope');
  if (p.storagePrefix !== `ghrab.${consumer.appId}.`) failures.push('platform.storagePrefix');
  if (p.cacheName !== consumer.cache.name) failures.push('platform.cacheName');
  if (manifest.compatibility?.platformRange !== consumer.platform.requiredRange) failures.push('compatibility.platformRange');
  if (manifest.compatibility?.studioBridge !== '2.0') failures.push('compatibility.studioBridge');
  if (failures.length) throw new Error(`Studio manifest contract FAIL (${name}): ${failures.join(', ')}`);

  fs.writeFileSync(target, `${JSON.stringify(manifest, null, 2)}\n`);
  processed += 1;
}
if (!processed) throw new Error('Studio manifest contract FAIL: v dist/ chybi studio-manifest.json i app-manifest.json.');
console.log(`[studio-manifest-contract] PASS · ${processed} manifest(u) · ${consumer.appId} ${consumer.appVersion}`);
