import fs from 'node:fs';
import path from 'node:path';

function parseArray(sw,name){
  const match=sw.match(new RegExp(`const\\s+${name}\\s*=\\s*\\[([\\s\\S]*?)\\];`));
  if(!match)return [];
  return [...match[1].matchAll(/[\"']([^\"']+)[\"']/g)].map(item=>item[1]);
}
function localTarget(root,asset){
  const clean=String(asset||'').replace(/^\.\//,'').split(/[?#]/,1)[0];
  return clean?path.join(root,clean):root;
}
export function verifySwCoreAssets(distDir,label='dist'){
  const swPath=path.join(distDir,'sw.js');
  if(!fs.existsSync(swPath))throw new Error(`${label}: chybí sw.js`);
  const sw=fs.readFileSync(swPath,'utf8');
  const groups=['CORE_ASSETS','GHRAB_PLATFORM_P3_ASSETS'];
  let checked=0;
  for(const name of groups){
    for(const asset of parseArray(sw,name)){
      if(!String(asset).startsWith('./'))continue;
      checked++;
      const target=localTarget(distDir,asset);
      if(!fs.existsSync(target))throw new Error(`${label}: ${name} odkazuje na neexistující asset ${asset}`);
    }
  }
  if(!checked)throw new Error(`${label}: service worker neobsahuje žádné ověřitelné precache assety`);
  const modulesDir=path.join(distDir,'modules');
  const moduleFiles=fs.existsSync(modulesDir)?fs.readdirSync(modulesDir).filter(name=>name.endsWith('.js')).sort():[];
  const missingModules=moduleFiles.filter(name=>!sw.includes(`./modules/${name}`));
  if(missingModules.length)throw new Error(`${label}: service worker neuvádí všechny specialistické moduly: ${missingModules.join(', ')}`);
  const coreAssets=parseArray(sw,'CORE_ASSETS');
  if(moduleFiles.includes('map-presets.js')&&!coreAssets.includes('./modules/map-presets.js'))throw new Error(`${label}: map-presets.js musí být povinný CORE_ASSET pro spolehlivou offline mapu.`);
  return {label,checked,moduleCount:moduleFiles.length};
}

if(import.meta.url===new URL(`file://${process.argv[1]}`).href){
  const target=path.resolve(process.argv[2]||'dist');
  const result=verifySwCoreAssets(target,path.basename(target));
  console.log(`[sw-assets] ${result.label}: ${result.checked} core assetů + ${result.moduleCount} specialistických modulů evidováno`);
}
