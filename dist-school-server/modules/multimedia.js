/* Diferenciator 1.3.29 - bounded audio/video input helpers. */
const AUDIO_EXT={mp3:'audio/mpeg',wav:'audio/wav',m4a:'audio/mp4',aac:'audio/aac',ogg:'audio/ogg',oga:'audio/ogg',flac:'audio/flac',webm:'audio/webm'};
const VIDEO_EXT={mp4:'video/mp4',m4v:'video/mp4',webm:'video/webm',mov:'video/quicktime',ogv:'video/ogg'};
function ext(name){const m=String(name||'').toLowerCase().match(/\.([a-z0-9]+)$/);return m?m[1]:''}
export function detectMultimediaFile(file){
  const declared=String(file&&file.type||'').toLowerCase(),e=ext(file&&file.name);
  if(declared.startsWith('audio/'))return {kind:'audio',mime:declared};
  if(declared.startsWith('video/'))return {kind:'video',mime:declared};
  if(AUDIO_EXT[e])return {kind:'audio',mime:AUDIO_EXT[e]};
  if(VIDEO_EXT[e])return {kind:'video',mime:VIDEO_EXT[e]};
  return null;
}
export async function prepareMultimediaFile(file,d){
  const hit=detectMultimediaFile(file);if(!hit)return null;
  if(file.size>d.maxBytes)throw d.makeAppError((hit.kind==='audio'?'Audio':'Video')+' soubor je příliš velký ('+d.humanBytes(file.size)+'). Bezpečný limit pro přímé zpracování je '+d.humanBytes(d.maxBytes)+'. Materiál zkrať nebo rozděl.','FILE_TOO_LARGE');
  const data=await d.fileToBase64(file);const encodedBytes=new TextEncoder().encode(data).length;
  if(encodedBytes>d.maxInlineBytes)throw d.makeAppError('Multimediální vstup je po převodu pro přímé API volání příliš velký. Materiál zkrať nebo rozděl.','REQUEST_TOO_LARGE');
  return {kind:hit.kind,name:String(file.name||hit.kind),mime_type:hit.mime,data,bytes:file.size,originalBytes:file.size,compressed:false};
}
