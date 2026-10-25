/* Authorized per-worksheet Stage06 producer. Loaded after user confirmation.
 * The Studio-owned handoff helper performs an additional privacy gate.
 */
import { mapSelectedWorksheet, trustedStudioRoot } from './stage06-outbound-material.js';

export async function sendSelectedWorksheet(sheet) {
  const access = window.__GHRAB_STUDIO_ACCESS__;
  if (access?.appId !== 'differentiator' || !access.permit) throw new Error('ACCESS_REQUIRED');
  if (!sheet?._text?.trim() || sheet.querySelector('.body')?.isContentEditable) throw new Error('SHEET_NOT_READY');
  const base = trustedStudioRoot(window.__GHRAB_DEPLOYMENT_CONFIG__?.studioBaseUrl, window.location.href);
  const version = document.documentElement.dataset.ghrabAppVersion;
  if (!globalThis.crypto || typeof crypto.randomUUID !== 'function') throw new Error('CRYPTO_UNAVAILABLE');
  const material = mapSelectedWorksheet({
    form: {
      subject: document.getElementById('subject')?.value || '',
      meta: {
        topic: document.getElementById('mTopic')?.value || '',
        subject: document.getElementById('mSubject')?.value || '',
        className: document.getElementById('mClass')?.value || '',
      },
      advanced: { learningGoal: document.getElementById('advLearningGoal')?.value || '' },
    },
    sheet,
    id: 'dif-' + crypto.randomUUID(),
    now: new Date().toISOString(),
    appVersion: version,
    privacyConfirmed: true,
  });
  // No application-owned Bridge fork: import the canonical, same-origin helper.
  const helperUrl = new URL('integration/save-to-studio.js', base);
  const { saveMaterialToStudio } = await import(helperUrl.href);
  // Fail closed if the signed grant was revoked while the helper was loading.
  if (window.__GHRAB_STUDIO_ACCESS__?.permit !== access.permit) throw new Error('ACCESS_REVOKED');
  const result = saveMaterialToStudio({
    material,
    studioUrl: base,
    sourceAppId: 'differentiator',
    sourceAppVersion: version,
    navigate: false,
  });
  if (!result?.ok || !result.targetUrl) throw new Error(result?.reason || 'HANDOFF_NOT_PREPARED');
  return result.targetUrl;
}
