/* Stage 06 - Differentiator -> AI Studio GHRAB Material v1.
 * Pure mapping and URL checks. Never copy the whole local project or teacher key.
 * The Studio helper performs a second privacy/size check and Bridge v2 transport.
 */
const TIER = Object.freeze({support:'Jednodušší',core:'Běžná',extend:'Obtížnější'});
const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const UNSAFE = /<\s*(?:script|iframe|object|embed|img|video|audio|source)\b|\bon\w+\s*=|javascript\s*:/i;
const PRIVATE_KEY = /(?:student|pupil|learner|roster|classlist|attendance|dateofbirth|birthdate|personaldata|rodnecislo|firstname|lastname|fullname|studentid|emailaddress|resultsbyname)/i;
const NONPORTABLE = /\[\[(?:VISUAL_\d+|MEDIA_SOURCE)\]\]|!\[[^\]]*\]\([^)]*\)|\b(?:data:image|blob:|https?:\/\/[^\s]+\.(?:mp3|mp4|wav|webm|mov|png|jpe?g|svg|gif|webp))\b/i;
const ROOTS = new Set(['/AI-Studio-GHRAB/','/ai-studio/']);
const UTF8 = new TextEncoder();
const text = v => typeof v === 'string' ? v.trim() : '';

export class Stage06MaterialError extends Error {
  constructor(code) { super(code); this.name='Stage06MaterialError'; this.code=code; }
}
const reject = code => { throw new Stage06MaterialError(code); };

export function trustedStudioRoot(configured, currentHref) {
  if (typeof configured !== 'string' || !configured.trim()) reject('STUDIO_NOT_CONFIGURED');
  let here, root;
  try { here=new URL(currentHref); root=new URL(configured,here); }
  catch { reject('STUDIO_URL_INVALID'); }
  if (root.search || root.hash || root.username || root.password) reject('STUDIO_URL_INVALID');
  if (!root.pathname.endsWith('/')) root.pathname += '/';
  if (!ROOTS.has(root.pathname)) reject('STUDIO_PATH_UNTRUSTED');
  if (root.origin!==here.origin ||
      (root.protocol!=='https:' && !(root.protocol==='http:' && ['localhost','127.0.0.1'].includes(root.hostname))))
    reject('STUDIO_ORIGIN_UNTRUSTED');
  return root.href;
}

export function mapSelectedWorksheet({form,sheet,id,now,appVersion,privacyConfirmed}={}) {
  if (privacyConfirmed !== true) reject('ANONYMITY_NOT_CONFIRMED');
  if (!form || typeof form!=='object' || !sheet || typeof sheet!=='object') reject('NO_WORKSHEET');
  if (!/^[a-z][a-z0-9-]{0,79}$/.test(id||'')) reject('MATERIAL_ID');
  if (typeof now !== 'string' || !Number.isFinite(Date.parse(now))) reject('MATERIAL_DATE');
  if (!/^\d+\.\d+\.\d+(?:[-+][a-z0-9.-]+)?$/i.test(appVersion||'')) reject('APP_VERSION');
  if ((sheet._visualAssets || []).length || sheet._mediaSource || sheet._mediaSourceMarker ||
      (sheet.visualAssets || []).length || sheet.mediaSource) reject('NONPORTABLE_MEDIA');
  const tier=text(sheet._tierKey || sheet.tierKey || 'core');
  if (!Object.hasOwn(TIER,tier)) reject('TIER_UNSUPPORTED');
  const parts=sheet._parts || sheet.parts || {};
  const source=text(sheet._text || sheet.text);
  const title=text(form.meta?.topic) || text(parts.title);
  const subject=text(form.meta?.subject) || text(form.subject);
  const goal=text(form.advanced?.learningGoal);
  const group=text(form.meta?.className);
  if (!source) reject('NO_GENERATED_TEXT');
  if (!title || !subject) reject('MISSING_METADATA');
  if (source.length > 180000 || goal.length>800 || group.length>120 ||
      subject.length>160 || `${title} (${TIER[tier]})`.length>240) reject('MATERIAL_OVERSIZED');
  const material={
    schema:'ghrab-material-v1', id, version:1,
    title:`${title} (${TIER[tier]})`, subject,
    objectives:goal ? [goal] : [],
    content:{sourceText:source,tasks:[],vocabulary:[]},
    quality:{status:'ai-draft'},
    provenance:{sourceAppId:'differentiator',sourceAppVersion:appVersion,createdAt:now,updatedAt:now,containsPersonalData:false},
  };
  const level=text(sheet._cefrLabel || sheet.cefrLabel);
  if (/^(A1|A2|B1|B2|C1|C2)$/.test(level)) material.level=level;
  if (group) material.yearGroup=group;
  let raw;
  try { raw=JSON.stringify(material); } catch { reject('MATERIAL_INVALID'); }
  if (EMAIL.test(raw) || UNSAFE.test(raw)) reject('PRIVATE_OR_ACTIVE_CONTENT');
  if (NONPORTABLE.test(raw)) reject('NONPORTABLE_MEDIA');
  for(const match of raw.matchAll(/"([^"\\]{1,128})"\s*:/g)) {
    const key=match[1].replace(/[^a-z0-9]/gi,'');
    if (key!=='containsPersonalData' && PRIVATE_KEY.test(key)) reject('PRIVATE_OR_ACTIVE_CONTENT');
  }
  if(UTF8.encode(raw).byteLength > 480000) reject('MATERIAL_OVERSIZED');
  return Object.freeze(material);
}
