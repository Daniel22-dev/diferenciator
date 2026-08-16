/* Diferenciator 1.3.29 - deterministic school chemistry graph validator and compact SMILES subset. */
const DEFAULT_VALENCE=Object.freeze({H:[1],B:[3],C:[4],N:[3,4,5],O:[1,2,3],F:[1],Si:[4],P:[3,5],S:[2,4,6],Cl:[1,3,5,7],Br:[1,3,5,7],I:[1,3,5,7],Na:[1],K:[1],Mg:[2],Ca:[2],Al:[3],Fe:[2,3],Cu:[1,2],Zn:[2],Ag:[1],Ba:[2]});
function atomToken(s,i){
 if(s[i]==='['){
  const j=s.indexOf(']',i+1);if(j<0)throw Error('SMILES: chybí ]');
  const raw=s.slice(i+1,j),m=raw.match(/^(?:(\d+))?([A-Z][a-z]?|[cnops])(?:H(\d*)?)?([+-]\d*|\d*[+-])?/);if(!m)throw Error('SMILES: neplatný atom '+raw);
  const isotope=m[1]?Number(m[1]):0;let el=m[2],aromatic=/^[cnops]$/.test(el);if(aromatic)el=el.toUpperCase();
  const hydrogens=m[3]===undefined?0:(m[3]===''?1:Number(m[3]));let charge=0;if(m[4]){const q=m[4],sign=q.includes('-')?-1:1,mag=Number((q.match(/\d+/)||['1'])[0]);charge=sign*mag}
  return {atom:{element:el,charge,aromatic,label:raw,isotope,hydrogens},end:j+1};
 }
 const two=s.slice(i,i+2);if(['Cl','Br','Si','Na','Mg','Ca','Al','Fe','Cu','Zn','Ag','Ba'].includes(two))return {atom:{element:two,charge:0,hydrogens:0,isotope:0},end:i+2};
 if(/[BCNOFPSIHK]/.test(s[i]))return {atom:{element:s[i],charge:0,hydrogens:0,isotope:0},end:i+1};
 if(/[cnops]/.test(s[i]))return {atom:{element:s[i].toUpperCase(),charge:0,aromatic:true,hydrogens:0,isotope:0},end:i+1};return null
}
export function parseSmiles(smiles){const s=String(smiles||'').trim(),atoms=[],bonds=[],stack=[],rings=new Map();let i=0,current=null,bondOrder=1,bondStereo='';while(i<s.length){const ch=s[i];if(ch==='('){if(current==null)throw Error('SMILES: větev bez atomu');stack.push(current);i++;continue}if(ch===')'){if(!stack.length)throw Error('SMILES: nadbytečná )');current=stack.pop();i++;continue}if(ch==='.' ){current=null;i++;continue}if(ch==='-'||ch==='='||ch==='#'||ch===':'){bondOrder=ch==='='?2:ch==='#'?3:ch===':'?1.5:1;i++;continue}if(ch==='/'||ch==='\\'){bondStereo=ch;i++;continue}if(/\d/.test(ch)){if(current==null)throw Error('SMILES: kruh bez atomu');if(rings.has(ch)){const r=rings.get(ch);bonds.push({a:r.atom,b:current,order:bondOrder!==1?bondOrder:r.order||1,stereo:bondStereo||r.stereo||''});rings.delete(ch)}else rings.set(ch,{atom:current,order:bondOrder,stereo:bondStereo});bondOrder=1;bondStereo='';i++;continue}const tok=atomToken(s,i);if(!tok)throw Error('SMILES: nepodporovaný token '+ch);const id='a'+atoms.length;atoms.push({id,...tok.atom});if(current!=null)bonds.push({a:current,b:id,order:atoms[atoms.length-2]?.aromatic&&tok.atom.aromatic&&bondOrder===1?1.5:bondOrder,stereo:bondStereo});current=id;bondOrder=1;bondStereo='';i=tok.end}if(rings.size)throw Error('SMILES: neuzavřený kruh');return {atoms,bonds}}
function cycleLayout(graph){const n=graph.atoms.length;if(!n)return graph;const deg=new Map(graph.atoms.map(a=>[a.id,0]));graph.bonds.forEach(b=>{deg.set(b.a,(deg.get(b.a)||0)+1);deg.set(b.b,(deg.get(b.b)||0)+1)});const placed=new Map();const center={x:.5,y:.5};if(n<=8&&graph.bonds.length>=n){graph.atoms.forEach((a,i)=>placed.set(a.id,{x:center.x+.32*Math.cos(-Math.PI/2+i*2*Math.PI/n),y:center.y+.32*Math.sin(-Math.PI/2+i*2*Math.PI/n)}))}else{const adj=new Map(graph.atoms.map(a=>[a.id,[]]));graph.bonds.forEach(b=>{adj.get(b.a)?.push(b.b);adj.get(b.b)?.push(b.a)});const root=graph.atoms[0]?.id,queue=[[root,0,.5,.5,0]],seen=new Set();while(queue.length){const [id,depth,x,y,angle]=queue.shift();if(seen.has(id))continue;seen.add(id);placed.set(id,{x,y});const kids=(adj.get(id)||[]).filter(k=>!seen.has(k));kids.forEach((k,j)=>{const spread=(j-(kids.length-1)/2)*.75,a=angle+spread+(depth===0?0:0.15),r=.19;queue.push([k,depth+1,Math.max(.08,Math.min(.92,x+r*Math.cos(a))),Math.max(.1,Math.min(.9,y+r*Math.sin(a))),a])})}}return {...graph,atoms:graph.atoms.map(a=>({...a,...(placed.get(a.id)||{x:.5,y:.5})}))}}
export function validateChemGraph(spec){
 const errors=[],warnings=[],atoms=Array.isArray(spec?.atoms)?spec.atoms:[],bonds=Array.isArray(spec?.bonds)?spec.bonds:[],ids=new Set();
 for(const a of atoms){
  if(!a?.id||ids.has(String(a.id)))errors.push('Atom má chybějící nebo duplicitní id.');ids.add(String(a?.id));
  if(!DEFAULT_VALENCE[a?.element])warnings.push('Valence prvku '+String(a?.element||'?')+' není v lokální školní tabulce.');
  const lp=Number(a?.lonePairs??0),rad=Number(a?.radicalElectrons??0),iso=Number(a?.isotope??0),h=Number(a?.hydrogens??0);
  if(!Number.isInteger(lp)||lp<0||lp>4)errors.push('Atom '+String(a?.id||'?')+' má neplatný počet volných elektronových párů.');
  if(!Number.isInteger(rad)||rad<0||rad>2)errors.push('Atom '+String(a?.id||'?')+' má neplatný počet nepárových elektronů.');
  if(iso&&(!Number.isInteger(iso)||iso<1||iso>300))errors.push('Atom '+String(a?.id||'?')+' má neplatné nukleonové číslo.');
  if(!Number.isInteger(h)||h<0||h>8)errors.push('Atom '+String(a?.id||'?')+' má neplatný počet explicitních vodíků.');
 }
 const val=new Map(atoms.map(a=>[String(a.id),Number(a?.hydrogens||0)])),seen=new Set();
 for(const b of bonds){const a=String(b?.a),c=String(b?.b),key=[a,c].sort().join('|');if(!ids.has(a)||!ids.has(c))errors.push('Vazba odkazuje na neexistující atom.');if(a===c)errors.push('Vazba vede atom na sebe.');if(seen.has(key))warnings.push('Mezi stejnými atomy je více samostatných vazeb; použij order.');seen.add(key);const o=Number(b?.order||1);if(![1,1.5,2,3].includes(o))errors.push('Nepodporovaný řád vazby '+o+'.');val.set(a,(val.get(a)||0)+o);val.set(c,(val.get(c)||0)+o)}
 for(const a of atoms){const allowed=DEFAULT_VALENCE[a.element];if(!allowed)continue;const v=val.get(String(a.id))||0,max=Math.max(...allowed);if(v>max+.01)errors.push('Atom '+a.id+' ('+a.element+') překračuje běžnou školní valenci: '+v+' > '+max+'.');else if(!a.aromatic&&v>0&&!allowed.some(x=>Math.abs(x-v)<=.01)&&a.element!=='C')warnings.push('Atom '+a.id+' ('+a.element+') má neobvyklý součet řádů vazeb '+v+'.')}
 return {ok:errors.length===0,errors:[...new Set(errors)],warnings:[...new Set(warnings)]}
}
export function normalizeChemSpec(spec={}){let graph=spec;if(spec.smiles){graph={...spec,...parseSmiles(spec.smiles)}}graph=cycleLayout(graph);const validation=validateChemGraph(graph);return {...graph,validation}}
