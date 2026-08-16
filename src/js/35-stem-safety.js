const STEM_SUBJECT_ALIASES=Object.freeze({
  math:['matematika','matematicky','matematický','math','mathematics'],
  physics:['fyzika','fyzikalni','fyzikální','physics'],
  chemistry:['chemie','chemicky','chemický','chemistry'],
  biology:['biologie','biologicky','biologický','biology','prirodopis','přírodopis']
});
const CHEM_ELEMENTS=new Set('H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og'.split(' '));
const STEM_LATEX_SYMBOLS=Object.freeze({
  cdot:'·',times:'×',div:'÷',pm:'±',mp:'∓',le:'≤',leq:'≤',ge:'≥',geq:'≥',neq:'≠',approx:'≈',sim:'∼',propto:'∝',rightarrow:'→',to:'→',leftarrow:'←',leftrightarrow:'↔',Rightarrow:'⇒',Leftrightarrow:'⇔',infty:'∞',sum:'∑',int:'∫',partial:'∂',nabla:'∇',degree:'°',circ:'°',alpha:'α',beta:'β',gamma:'γ',delta:'δ',Delta:'Δ',epsilon:'ε',theta:'θ',lambda:'λ',mu:'μ',pi:'π',rho:'ρ',sigma:'σ',Sigma:'Σ',phi:'φ',omega:'ω',Omega:'Ω'
});
const STEM_LATEX_WORDS=new Set(['sin','cos','tan','tg','cot','log','ln','lim']);
const STEM_LATEX_WRAPPERS=new Set(['mathrm','text','mathbf','mathit','operatorname']);
const STEM_ALLOWED_LATEX=new Set(['frac','dfrac','tfrac','sqrt','ce','left','right','begin','end','overline','underline','vec','hat','bar','tilde','prod','iint','iiint','oint','min','max','det','gcd','subset','subseteq','supset','supseteq','cup','cap','forall','exists','notin','equiv','simeq','perp','parallel','mapsto','dots','ldots','cdots',...Object.keys(STEM_LATEX_SYMBOLS),...STEM_LATEX_WORDS,...STEM_LATEX_WRAPPERS]);

function normalizeStemSubject(value){
  return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z]+/g,' ').trim();
}
function stemSubjectKind(value){
  const s=normalizeStemSubject(value==null?(typeof getSubjectValue==='function'?getSubjectValue():''):value);
  if(!s)return '';
  for(const [kind,names] of Object.entries(STEM_SUBJECT_ALIASES))if(names.some(n=>s.includes(normalizeStemSubject(n))))return kind;
  if(/matemat|algebr|geometri|statistik|pravdepodob|kombinator|trigonometr/.test(s))return 'math';
  if(/fyzik|astronom|mechanik|optik|elektromagnet/.test(s))return 'physics';
  if(/biolog|ekolog|environmental|genetik|anatom|fyziolog|botanik|zoolog/.test(s))return 'biology';
  if(/geolog|mineralog|petrolog|geoved|vedy o zemi|earth science/.test(s))return 'earthscience';
  return '';
}
function stemGenerationPromptLines(subject){
  const kind=stemSubjectKind(subject);if(!kind)return [];
  const common='STEM PŘESNOST: žádný výpočet, vzorec, jednotku, index, exponent, rovnici, značku ani odborný údaj nepřebírej bez kontroly. Pokud při diferenciaci změníš číselná data, musíš znovu dopočítat řešení. V answer_key uváděj správný výsledek a u výpočtových úloh dostatečný postup, aby šel učitelem ověřit. Nepoužívej nečitelný surový LaTeX, pokud stejný zápis lze zapsat standardními symboly; běžné zápisy \\frac{}, \\sqrt{}, mocniny a indexy aplikace umí zobrazit.';
  if(kind==='math')return [common,'MATEMATIKA: každý uzavřený numerický výraz přepočítej nezávisle. U rovnic dosaď nalezené řešení zpět do původní rovnice. U geometrie ověř podmínky, jednotky a to, že zadaná data vedou k řešitelnému příkladu. Zlomky nezkresluj desetinným zaokrouhlením, pokud není výslovně požadováno.'];
  if(kind==='physics')return [common,'FYZIKA: před výsledkem ověř použitý fyzikální vztah, dosazení, převod jednotek a rozměrovou konzistenci. Uváděj jednotku výsledku; převody mezi SI a běžnými jednotkami musí numericky sedět. Pokud použiješ konstantu, musí být pro daný kontext správná.'];
  if(kind==='chemistry')return [common,'CHEMIE: zachovej chemické indexy, stechiometrické koeficienty, náboje a skupiny v závorkách. Každou chemickou rovnici v řešení zkontroluj na počet atomů na obou stranách a u iontových rovnic také na náboj. U stechiometrie, látkového množství a koncentrací přepočítej aritmetiku a jednotky. Nikdy nezaměň index ve vzorci za koeficient před vzorcem.'];
  if(kind==='earthscience')return [common,'VĚDY O ZEMI: ověř terminologii, geologickou posloupnost, jednotky a vazbu mapy/profilu/vzorku na otázku; z nejasného obrazu nic neurčuj odhadem.'];
  return [common,'BIOLOGIE: používej přesnou současnou odbornou terminologii a nevymýšlej jednoznačnou odpověď tam, kde biologicky závisí na podmínkách. U anatomie, genetiky, fyziologie a ekologie zkontroluj vztah mezi otázkou a klíčem; u více možných správných odpovědí uveď přijatelné varianty nebo podmínku.'];
}
function stemQualityPromptLines(subject){
  const kind=stemSubjectKind(subject);if(!kind)return [];
  if(kind==='math')return ['MATEMATICKÁ KONTROLA: přepočítej všechny číselné výsledky; u rovnic ověř řešení dosazením; u zlomků, procent, mocnin, odmocnin, funkcí a geometrie hledej i nenápadnou početní nebo definiční chybu.'];
  if(kind==='physics')return ['FYZIKÁLNÍ KONTROLA: ověř vztah, dosazení, jednotky, převody, rozměry a číselný výsledek každé výpočtové úlohy. Chybná jednotka nebo nesprávný převod je Opravit, ne Doporučení.'];
  if(kind==='chemistry')return ['CHEMICKÁ KONTROLA: ověř každý vzorec, index, koeficient, bilanci atomů a tam, kde je relevantní, i bilanci náboje. Přepočítej stechiometrii, molární hmotnosti, koncentrace a jednotky.'];
  if(kind==='earthscience')return ['KONTROLA VĚD O ZEMI: ověř terminologii, posloupnost, jednotky a vazbu mapy/profilu/vzorku na klíč; z nejasného obrazu nic neurčuj odhadem.'];
  return ['BIOLOGICKÁ KONTROLA: ověř odbornou faktickou správnost, terminologii a vztah mezi strukturou a funkcí; zkontroluj, zda klíč nepředstírá jedinou odpověď u úlohy, která připouští více biologicky správných variant.'];
}
function stemAnswerKeyPromptLine(subject){const lines=stemQualityPromptLines(subject);return lines.length?' Před odevzdáním klíče '+lines[0].replace(/^[^:]+:\s*/,'').replace(/\.$/,'').toLowerCase()+'.':''}

function stemBraceGroup(src,start){
  if(src[start]!=='{')return null;let depth=0;
  for(let i=start;i<src.length;i++){if(src[i]==='{')depth++;else if(src[i]==='}'&&--depth===0)return {content:src.slice(start+1,i),end:i+1};}
  return null;
}
function appendStemTextNode(parent,text){if(text)parent.appendChild(document.createTextNode(text))}
let stemTexModulePromise=null;
function loadStemTexModule(){return stemTexModulePromise||(stemTexModulePromise=import('./modules/tex-math.js').catch(error=>{stemTexModulePromise=null;throw error}))}
function appendTeXMathPlaceholder(parent,tex,display=false){const wrap=document.createElement(display?'div':'span');wrap.className='stem-tex-math';wrap.dataset.texSource=String(tex||'').slice(0,20000);wrap.dataset.texDisplay=display?'1':'0';wrap.textContent=String(tex||'');parent.appendChild(wrap);loadStemTexModule().then(m=>{if(!wrap.isConnected&&typeof document!=='undefined'&&!document.contains(wrap))return;const bad=m.texUnsupportedCommands(tex);if(bad.length){wrap.dataset.texError='unsupported';wrap.title='Nepodporovaný TeX: '+bad.map(x=>'\\'+x).join(', ');return}wrap.replaceChildren(m.renderTeXMath(tex,{display}));wrap.dataset.texReady='1'}).catch(()=>{wrap.dataset.texError='load'});return wrap}
function texDelimitedAt(src,i){if(src.startsWith('$$',i)){const j=src.indexOf('$$',i+2);return j>i+2?{tex:src.slice(i+2,j),end:j+2,display:true}:null}if(src[i]==='$'){const j=src.indexOf('$',i+1);return j>i+1?{tex:src.slice(i+1,j),end:j+1,display:false}:null}if(src.startsWith('\\[',i)){const j=src.indexOf('\\]',i+2);return j>i+2?{tex:src.slice(i+2,j),end:j+2,display:true}:null}if(src.startsWith('\\(',i)){const j=src.indexOf('\\)',i+2);return j>i+2?{tex:src.slice(i+2,j),end:j+2,display:false}:null}return null}
function chemistryFormulaParts(token){
  const src=String(token||'');const m=src.match(/^(\d+)?(.+)$/);if(!m)return null;const coeff=m[1]||'',formula=m[2];
  let i=0,hasDigit=false,elementCount=0,depth=0;
  while(i<formula.length){const ch=formula[i];if(ch==='('||ch==='['){depth++;i++;continue}if(ch===')'||ch===']'){if(depth<=0)return null;depth--;i++;while(/\d/.test(formula[i]||'')){hasDigit=true;i++;}continue}if(/[A-Z]/.test(ch)){let symbol=ch;i++;if(/[a-z]/.test(formula[i]||'')){symbol+=formula[i];i++;}if(!CHEM_ELEMENTS.has(symbol))return null;elementCount++;while(/\d/.test(formula[i]||'')){hasDigit=true;i++;}continue}return null;}
  if(depth!==0||!elementCount||!hasDigit)return null;return {coeff,formula};
}
function appendChemFormula(parent,token){
  const parsed=chemistryFormulaParts(token);if(!parsed){appendStemTextNode(parent,token);return}
  const wrap=document.createElement('span');wrap.className='stem-chem';wrap.dataset.stemSource=token;if(parsed.coeff)appendStemTextNode(wrap,parsed.coeff);let i=0;
  while(i<parsed.formula.length){const ch=parsed.formula[i];if(/\d/.test(ch)){let j=i+1;while(/\d/.test(parsed.formula[j]||''))j++;const sub=document.createElement('sub');sub.dataset.stemSource=parsed.formula.slice(i,j);sub.textContent=parsed.formula.slice(i,j);wrap.appendChild(sub);i=j;}else{appendStemTextNode(wrap,ch);i++;}}
  parent.appendChild(wrap);
}
function appendStemPlainChunk(parent,chunk,kind){
  if(!chunk)return;
  if(kind!=='chemistry'){appendStemTextNode(parent,chunk);return}
  const rx=/(?:\d+)?[A-Z][A-Za-z0-9()\[\]]*/g;let last=0,m;
  while((m=rx.exec(chunk))){if(m.index>last)appendStemTextNode(parent,chunk.slice(last,m.index));const token=m[0];if(chemistryFormulaParts(token))appendChemFormula(parent,token);else appendStemTextNode(parent,token);last=rx.lastIndex;}if(last<chunk.length)appendStemTextNode(parent,chunk.slice(last));
}
function appendStemScript(parent,marker,content,kind){const el=document.createElement(marker==='^'?'sup':'sub');el.className='stem-script';el.dataset.stemSource=marker+(content.length>1?'{'+content+'}':content);appendStemInline(el,content,kind);parent.appendChild(el)}
function appendStemInline(parent,text,kind=stemSubjectKind()){
  const src=String(text||'');let plain='';const flush=()=>{appendStemPlainChunk(parent,plain,kind);plain=''};
  for(let i=0;i<src.length;){
    const tex=texDelimitedAt(src,i);if(tex){flush();appendTeXMathPlaceholder(parent,tex.tex,tex.display);i=tex.end;continue}
    if(src[i]==='$'){i++;continue}
    if((src[i]==='^'||src[i]==='_')){const marker=src[i],g=src[i+1]==='{'?stemBraceGroup(src,i+1):null;let content='',end=i+1;if(g){content=g.content;end=g.end}else if(i+1<src.length){content=src[i+1];end=i+2}if(content){flush();appendStemScript(parent,marker,content,kind);i=end;continue}}
    if(src[i]==='\\'){
      const nameMatch=src.slice(i+1).match(/^([A-Za-z]+|[,;:!])/);const name=nameMatch?nameMatch[1]:'';
      if(name){
        const cmdEnd=i+1+name.length;
        if(name==='frac'){
          const a=stemBraceGroup(src,cmdEnd),b=a?stemBraceGroup(src,a.end):null;
          if(a&&b){flush();const f=document.createElement('span');f.className='stem-frac';f.dataset.stemSource=src.slice(i,b.end);const n=document.createElement('span');n.className='stem-frac-num';appendStemInline(n,a.content,kind);const d=document.createElement('span');d.className='stem-frac-den';appendStemInline(d,b.content,kind);f.append(n,d);parent.appendChild(f);i=b.end;continue}
        }
        if(name==='sqrt'){
          let rootIndex='',after=cmdEnd;if(src[after]==='['){const close=src.indexOf(']',after+1);if(close>after){rootIndex=src.slice(after+1,close).trim();after=close+1}}
          const g=stemBraceGroup(src,after);if(g){flush();const w=document.createElement('span');w.className='stem-sqrt';w.dataset.stemSource=src.slice(i,g.end);if(rootIndex){const idx=document.createElement('sup');idx.className='stem-root-index';idx.textContent=rootIndex;w.appendChild(idx)}appendStemTextNode(w,'√');const rad=document.createElement('span');rad.className='stem-radicand';appendStemInline(rad,g.content,kind);w.appendChild(rad);parent.appendChild(w);i=g.end;continue}
        }
        if(name==='left'||name==='right'){flush();i=cmdEnd;continue}
        if(name==='ce'){
          const g=stemBraceGroup(src,cmdEnd);if(g){flush();const w=document.createElement('span');w.className='stem-ce';w.dataset.stemSource=src.slice(i,g.end);appendStemInline(w,g.content,'chemistry');parent.appendChild(w);i=g.end;continue}
        }
        if(STEM_LATEX_WRAPPERS.has(name)){
          const g=stemBraceGroup(src,cmdEnd);if(g){flush();const w=document.createElement('span');w.dataset.stemSource=src.slice(i,g.end);appendStemInline(w,g.content,kind);parent.appendChild(w);i=g.end;continue}
        }
        if(name==='left'||name==='right'){i=cmdEnd;continue}
        if(STEM_LATEX_SYMBOLS[name]){flush();appendStemTextNode(parent,STEM_LATEX_SYMBOLS[name]);i=cmdEnd;continue}
        if(STEM_LATEX_WORDS.has(name)){flush();appendStemTextNode(parent,name);i=cmdEnd;continue}
      }
    }
    plain+=src[i++];
  }
  flush();
}
function appendStemRichText(parent,text,kind=stemSubjectKind()){
  const src=String(text||''),re=/\*\*(.+?)\*\*/g;let last=0,m;
  while((m=re.exec(src))){if(m.index>last)appendStemInline(parent,src.slice(last,m.index),kind);const b=document.createElement('b');appendStemInline(b,m[1],kind);parent.appendChild(b);last=re.lastIndex}if(last<src.length)appendStemInline(parent,src.slice(last),kind);
}
function renderStemTextHtml(text,kind=stemSubjectKind()){
  const div=document.createElement('div');appendStemRichText(div,text,kind);return div.innerHTML;
}

function ommlChild(node,name){return [...(node&&node.children||[])].find(x=>x.localName===name)||null}
function ommlChildrenText(node){return [...(node&&node.childNodes||[])].map(n=>n.nodeType===3?n.nodeValue:ommlNodeText(n)).join('')}
function ommlNodeText(node){
  if(!node)return '';if(node.nodeType===3)return node.nodeValue||'';if(node.nodeType!==1)return '';
  const n=node.localName;
  if(n==='t')return node.textContent||'';
  if(n==='f'){const a=ommlChild(node,'num'),b=ommlChild(node,'den');return a&&b?'\\frac{'+ommlChildrenText(a)+'}{'+ommlChildrenText(b)+'}':ommlChildrenText(node)}
  if(n==='sSup'){const e=ommlChild(node,'e'),s=ommlChild(node,'sup');return ommlChildrenText(e)+'^{'+ommlChildrenText(s)+'}'}
  if(n==='sSub'){const e=ommlChild(node,'e'),s=ommlChild(node,'sub');return ommlChildrenText(e)+'_{'+ommlChildrenText(s)+'}'}
  if(n==='sSubSup'){const e=ommlChild(node,'e'),sub=ommlChild(node,'sub'),sup=ommlChild(node,'sup');return ommlChildrenText(e)+'_{'+ommlChildrenText(sub)+'}^{'+ommlChildrenText(sup)+'}'}
  if(n==='rad'){const e=ommlChild(node,'e'),deg=ommlChild(node,'deg'),d=deg?ommlChildrenText(deg).trim():'';return d?'\\sqrt['+d+']{'+ommlChildrenText(e)+'}':'\\sqrt{'+ommlChildrenText(e)+'}'}
  if(n==='nary'){const e=ommlChild(node,'e'),sub=ommlChild(node,'sub'),sup=ommlChild(node,'sup'),chr=[...(node.getElementsByTagNameNS?node.getElementsByTagNameNS('*','chr'):[])][0],val=chr&&(chr.getAttribute('m:val')||chr.getAttribute('val'));let op=val||'∑';return op+(sub?'_{'+ommlChildrenText(sub)+'}':'')+(sup?'^{'+ommlChildrenText(sup)+'}':'')+ommlChildrenText(e)}
  if(n==='d'){const e=ommlChild(node,'e');return '('+ommlChildrenText(e)+')'}
  if(n==='m'){const rows=[...node.children].filter(x=>x.localName==='mr');if(rows.length)return '['+rows.map(r=>[...r.children].filter(x=>x.localName==='e').map(e=>ommlChildrenText(e)).join(', ')).join('; ')+']'}
  if(n==='eqArr'){const rows=[...node.children].filter(x=>x.localName==='e').map(e=>ommlChildrenText(e));return rows.join(' ; ')}
  if(n==='limLow'||n==='limUpp'){const e=ommlChild(node,'e'),lim=ommlChild(node,'lim'),mark=n==='limLow'?'_':'^';return ommlChildrenText(e)+mark+'{'+ommlChildrenText(lim)+'}'}
  if(n==='func'){const f=ommlChild(node,'fName'),e=ommlChild(node,'e');return ommlChildrenText(f)+ommlChildrenText(e)}
  if(n==='acc'){const e=ommlChild(node,'e'),chr=[...(node.getElementsByTagNameNS?node.getElementsByTagNameNS('*','chr'):[])][0],val=chr&&(chr.getAttribute('m:val')||chr.getAttribute('val'));return (val==='⃗'?'→':val||'')+ommlChildrenText(e)}
  if(/Pr$/.test(n||'')||['ctrlPr','rPr','argPr'].includes(n))return '';
  return ommlChildrenText(node);
}
function officeDomBlockText(xml){
  try{
    const doc=new DOMParser().parseFromString(String(xml||''),'application/xml');if(doc.querySelector&&doc.querySelector('parsererror'))return '';
    const paragraphs=[...doc.getElementsByTagNameNS('*','p')].filter(p=>['p'].includes(p.localName));if(!paragraphs.length)return '';
    const rows=paragraphs.map(p=>{
      let out='';const walk=node=>{if(node.nodeType===3)return;if(node.nodeType!==1)return;const n=node.localName;if(n==='oMath'||n==='oMathPara'){out+=ommlNodeText(node);return}if(n==='t'){out+=node.textContent||'';return}if(n==='tab'){out+='\t';return}if(n==='br'||n==='cr'){out+='\n';return}[...node.childNodes].forEach(walk)};[...p.childNodes].forEach(walk);return out.replace(/[ \t]+\n/g,'\n').trim();
    }).filter(Boolean);return rows.join('\n').replace(/\n{3,}/g,'\n\n').trim();
  }catch(_){return ''}
}

function stemExpandSimpleMathNotation(expr){
  let s=String(expr||'');
  for(let i=0;i<6;i++){const prev=s;s=s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g,'(($1)/($2))').replace(/\\sqrt\[([^\]]+)\]\{([^{}]+)\}/g,'(($2)^(1/($1)))').replace(/\\sqrt\{([^{}]+)\}/g,'(($1)^(1/2))');if(s===prev)break}
  s=s.replace(/√\s*\(?\s*(-?\d+(?:[.,]\d+)?)\s*\)?/g,'(($1)^(1/2))');
  return s;
}
function stemNormalizeArithmetic(expr){return stemExpandSimpleMathNotation(expr).replace(/,/g,'.').replace(/[−–—]/g,'-').replace(/[×·]/g,'*').replace(/÷/g,'/').replace(/²/g,'^2').replace(/³/g,'^3').replace(/\s+/g,'').replace(/%/g,'/100').replace(/(\d|\))\(/g,'$1*(')}
function stemEvalArithmetic(expr){
  const s=stemNormalizeArithmetic(expr);if(!s||/[^0-9.+\-*/^()]/.test(s))return null;let i=0;
  const peek=()=>s[i],eat=c=>peek()===c?(i++,true):false;
  function primary(){if(eat('(')){const v=add();if(!eat(')'))throw 0;return v}const m=s.slice(i).match(/^(?:\d+(?:\.\d*)?|\.\d+)/);if(!m)throw 0;i+=m[0].length;return Number(m[0])}
  function unary(){if(eat('+'))return unary();if(eat('-'))return -unary();return primary()}
  function power(){let v=unary();if(eat('^'))v=Math.pow(v,power());return v}
  function mul(){let v=power();for(;;){if(eat('*'))v*=power();else if(eat('/'))v/=power();else return v}}
  function add(){let v=mul();for(;;){if(eat('+'))v+=mul();else if(eat('-'))v-=mul();else return v}}
  try{const v=add();return i===s.length&&Number.isFinite(v)?v:null}catch(_){return null}
}
function stemArithmeticIssues(text){
  const issues=[];for(const raw of String(text||'').split(/\r?\n/)){const line=raw.replace(/\*\*/g,'');if(!line.includes('='))continue;const parts=line.split('=').map(x=>x.trim());for(let i=0;i<parts.length-1;i++){const a=stemEvalArithmetic(parts[i]),b=stemEvalArithmetic(parts[i+1]);if(a==null||b==null)continue;const tol=Math.max(1e-9,Math.abs(a)*1e-8,Math.abs(b)*1e-8);if(Math.abs(a-b)>tol){issues.push('STEM kontrola: početní rovnost „'+parts[i]+' = '+parts[i+1]+'“ numericky nesedí.');break}}}return issues;
}
function stemLinearEquationIssues(text){
  const issues=[];
  for(const raw of String(text||'').split(/\r?\n/)){
    const line=raw.replace(/\*\*/g,'').trim(),m=line.match(/^(.+?)=([^=]+?)(?:\s*(?:→|=>|⇒|;)\s*|\s{2,})([a-zA-Z])\s*=\s*(-?\d+(?:[.,]\d+)?)\s*$/);if(!m)continue;
    const variable=m[3],value=Number(m[4].replace(',','.'));if(!Number.isFinite(value))continue;
    const subst=expr=>String(expr).replace(new RegExp('([+-]?\\d*(?:[.,]\\d+)?)\\s*'+variable,'g'),(_,coef)=>{let c=String(coef||'').replace(',','.');if(c===''||c==='+')c='1';if(c==='-')c='-1';return '('+c+'*('+value+'))'});
    const a=stemEvalArithmetic(subst(m[1])),b=stemEvalArithmetic(subst(m[2]));if(a==null||b==null)continue;const tol=Math.max(1e-9,Math.abs(a)*1e-8,Math.abs(b)*1e-8);if(Math.abs(a-b)>tol)issues.push('STEM kontrola: uvedené řešení „'+variable+' = '+m[4]+'“ po dosazení nesplňuje rovnici „'+m[1].trim()+' = '+m[2].trim()+'“.');
  }
  return issues;
}

const STEM_UNITS=Object.freeze({
  mm:['L',1e-3],cm:['L',1e-2],dm:['L',1e-1],m:['L',1],km:['L',1e3],
  'mm2':['A',1e-6],'cm2':['A',1e-4],'dm2':['A',1e-2],'m2':['A',1],'km2':['A',1e6],
  ml:['V',1e-6],l:['V',1e-3],'cm3':['V',1e-6],'dm3':['V',1e-3],'m3':['V',1],
  mg:['M',1e-6],g:['M',1e-3],kg:['M',1],t:['M',1e3],
  ms:['T',1e-3],s:['T',1],min:['T',60],h:['T',3600],
  'm/s':['S',1],'km/h':['S',1000/3600],
  pa:['P',1],kpa:['P',1e3],mpa:['P',1e6],n:['F',1],kn:['F',1e3],j:['E',1],kj:['E',1e3],w:['W',1],kw:['W',1e3],hz:['Hz',1],khz:['Hz',1e3]
});
function normalizeUnitToken(u){return String(u||'').trim().replace(/²/g,'2').replace(/³/g,'3').replace(/\^2/g,'2').replace(/\^3/g,'3').replace(/ℓ/g,'l').toLowerCase()}
function stemUnitConversionIssues(text){
  const issues=[],rx=/(-?\d+(?:[.,]\d+)?)\s*(mm²|cm²|dm²|m²|km²|mm\^2|cm\^2|dm\^2|m\^2|km\^2|mm³|cm³|dm³|m³|mm\^3|cm\^3|dm\^3|m\^3|km\/h|m\/s|mm|cm|dm|km|m|mg|kg|g|t|ms|min|h|s|mL|ml|L|l|kPa|MPa|Pa|kN|N|kJ|J|kW|W|kHz|Hz)\s*=\s*(-?\d+(?:[.,]\d+)?)\s*(mm²|cm²|dm²|m²|km²|mm\^2|cm\^2|dm\^2|m\^2|km\^2|mm³|cm³|dm³|m³|mm\^3|cm\^3|dm\^3|m\^3|km\/h|m\/s|mm|cm|dm|km|m|mg|kg|g|t|ms|min|h|s|mL|ml|L|l|kPa|MPa|Pa|kN|N|kJ|J|kW|W|kHz|Hz)/gi;
  for(const m of String(text||'').matchAll(rx)){const a=Number(m[1].replace(',','.')),b=Number(m[3].replace(',','.')),ua=STEM_UNITS[normalizeUnitToken(m[2])],ub=STEM_UNITS[normalizeUnitToken(m[4])];if(!ua||!ub||ua[0]!==ub[0])continue;const av=a*ua[1],bv=b*ub[1],tol=Math.max(1e-9,Math.abs(av)*1e-7,Math.abs(bv)*1e-7);if(Math.abs(av-bv)>tol)issues.push('STEM kontrola: převod „'+m[0]+'“ numericky nesedí.');}
  return issues;
}
const CHEM_SUP_DIGITS=Object.freeze({'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9'});
function chemChargeInfo(value){
  let s=String(value||'').trim(),m=s.match(/\^\{?(\d*)([+-])\}?$/);if(m)return {base:s.slice(0,m.index),charge:Number(m[1]||1)*(m[2]==='+'?1:-1),explicit:true};
  m=s.match(/([⁰¹²³⁴⁵⁶⁷⁸⁹]*)([⁺⁻])$/);if(m){const mag=[...m[1]].map(ch=>CHEM_SUP_DIGITS[ch]||'').join('');return {base:s.slice(0,m.index),charge:Number(mag||1)*(m[2]==='⁺'?1:-1),explicit:true}}
  m=s.match(/([+-])$/);if(m)return {base:s.slice(0,-1),charge:m[1]==='+'?1:-1,explicit:true};
  return {base:s,charge:0,explicit:false};
}
function chemReactionChargeBalanced(line){
  const m=String(line||'').replace(/\*\*/g,'').match(/(.+?)(?:->|→|⇌|↔)(.+)/);if(!m)return null;let any=false;
  const total=s=>s.split(/\s+\+\s+/).map(x=>x.trim()).filter(Boolean).reduce((sum,raw)=>{let coeff=1,species=raw.replace(/^\d+[.)]\s*/,'').trim();const cm=species.match(/^(\d+)\s*(?=[A-Za-z(\[])/);if(cm){coeff=Number(cm[1]);species=species.slice(cm[0].length).trim()}if(/^e[-⁻]$/i.test(species)){any=true;return sum-coeff}const info=chemChargeInfo(species);if(info.explicit)any=true;return sum+coeff*info.charge},0);
  const a=total(m[1]),b=total(m[2]);return any?a===b:null;
}
function chemParseFormula(formula){
  let src=chemChargeInfo(String(formula||'').trim().replace(/\((?:aq|s|l|g)\)$/i,'')).base.trim();if(!src)return null;if(/^e$/i.test(src))return {};
  const hydrate=src.split(/[·]/);const total={};
  const add=(dst,el,n)=>dst[el]=(dst[el]||0)+n;
  const parsePart=part=>{
    let multiplier=1;const lead=part.match(/^(\d+)(?=[A-Z(\[])/);if(lead){multiplier=Number(lead[1]);part=part.slice(lead[1].length)}let i=0;
    function group(stop){const out={};while(i<part.length){const ch=part[i];if(stop&&ch===stop){i++;return out}if(ch==='('||ch==='['){const close=ch==='('?')':']';i++;const sub=group(close);if(!sub)return null;const num=(part.slice(i).match(/^\d+/)||['1'])[0];i+=num==='1'&&part[i]!=='1'?0:num.length;for(const [el,n] of Object.entries(sub))add(out,el,n*Number(num));continue}if(/[A-Z]/.test(ch)){let el=ch;i++;if(/[a-z]/.test(part[i]||'')){el+=part[i];i++;}if(!CHEM_ELEMENTS.has(el))return null;const mm=part.slice(i).match(/^\d+/),num=mm?Number(mm[0]):1;if(mm)i+=mm[0].length;add(out,el,num);continue}return null}return stop?null:out}
    const counts=group(null);if(!counts||i!==part.length)return null;for(const k of Object.keys(counts))counts[k]*=multiplier;return counts;
  };
  for(const part of hydrate){const c=parsePart(part);if(!c)return null;for(const [el,n] of Object.entries(c))add(total,el,n)}return total;
}
function chemReactionBalanced(line){
  const m=String(line||'').replace(/\*\*/g,'').match(/(.+?)(?:->|→|⇌|↔)(.+)/);if(!m)return null;const splitSide=s=>s.split(/\s+\+\s+/).map(x=>x.trim()).filter(Boolean);const left=splitSide(m[1]),right=splitSide(m[2]);if(!left.length||!right.length)return null;
  function side(species){const total={};for(const raw of species){let coeff=1,formula=raw.replace(/^\d+[.)]\s*/,'').trim();const cm=formula.match(/^(\d+)\s*(?=[A-Z(\[])/);if(cm){coeff=Number(cm[1]);formula=formula.slice(cm[0].length).trim()}const counts=chemParseFormula(formula);if(!counts)return null;for(const [el,n] of Object.entries(counts))total[el]=(total[el]||0)+coeff*n}return total}
  const a=side(left),b=side(right);if(!a||!b)return null;const keys=new Set([...Object.keys(a),...Object.keys(b)]);return [...keys].every(k=>(a[k]||0)===(b[k]||0));
}
function stemChemicalIssues(text){const issues=[];for(const raw of String(text||'').split(/\r?\n/)){const balanced=chemReactionBalanced(raw),charge=chemReactionChargeBalanced(raw);if(balanced===false)issues.push('STEM kontrola: chemická rovnice „'+raw.trim()+'“ není vyčíslena na stejný počet atomů.');if(charge===false)issues.push('STEM kontrola: iontová rovnice „'+raw.trim()+'“ nemá stejný celkový náboj na obou stranách.');}return issues}
function stemLatexIssues(text){const issues=[],seen=new Set();for(const m of String(text||'').matchAll(/\\([A-Za-z]+)/g)){if(!STEM_ALLOWED_LATEX.has(m[1])&&!seen.has(m[1])){seen.add(m[1]);issues.push('STEM zobrazení: nepodporovaný LaTeX příkaz \\'+m[1]+' může být v listu zobrazen doslova; uprav zápis nebo použij běžné symboly.')}}return issues}
function stemValidationIssues(parsed,subject){
  const kind=stemSubjectKind(subject);if(!kind||!parsed)return [];
  const p=parsed.parts||{},key=String(p.answerKey||parsed.answerKey||''),all=[p.title,p.instructions,p.tasks,key].join('\n');let issues=[...stemLatexIssues(all)];
  if(kind==='math')issues.push(...stemArithmeticIssues(key),...stemLinearEquationIssues(key));
  if(kind==='physics')issues.push(...stemArithmeticIssues(key),...stemLinearEquationIssues(key),...stemUnitConversionIssues(key));
  if(kind==='chemistry')issues.push(...stemArithmeticIssues(key),...stemLinearEquationIssues(key),...stemUnitConversionIssues(key),...stemChemicalIssues(key));
  if(kind==='earthscience')issues.push(...stemArithmeticIssues(key),...stemUnitConversionIssues(key));
  return [...new Set(issues)].slice(0,12);
}
