// Cene i dužine štapova preuzete iz cenovnika Salamander/Lyctum verzija 09.10.2026.
// Trošak je proporcionalan utrošenoj dužini profila; nije obračun gotovog prozora.
const SYSTEMS = {
  pro72:   {name:"proEvolution 72 mm AD", frame:37, frameLen:6.5, sash:39, sashLen:6.5, bead:9.30, beadLen:6, tbar:51, tbarLen:6.5, reinforcement:8.70, reinLen:6, rate:16.12},
  pro72md: {name:"proEvolution 72 mm MD", frame:45, frameLen:6.5, sash:39, sashLen:6.5, bead:10.40, beadLen:6, tbar:62, tbarLen:6.5, reinforcement:8.70, reinLen:6, rate:17.35},
  green76:{name:"greenEvolution 76 mm MD A-klasa", frame:56, frameLen:6.5, sash:51, sashLen:6.5, bead:11.00, beadLen:6, tbar:72, tbarLen:6.5, reinforcement:8.70, reinLen:6, rate:21.38},
  blue82: {name:"bluEvolution 82 mm MD", frame:49, frameLen:6.5, sash:50, sashLen:6.5, bead:11.45, beadLen:6, tbar:72, tbarLen:6.5, reinforcement:8.70, reinLen:6, rate:20.00},
  blue92: {name:"bluEvolution 92 mm", frame:53, frameLen:6.5, sash:59, sashLen:6.5, bead:11.00, beadLen:6, tbar:81, tbarLen:6.5, reinforcement:8.70, reinLen:6, rate:22.70}
};
const $ = id => document.getElementById(id);
let windows = [];
let lastResults = [];

const euro = n => new Intl.NumberFormat("sr-RS",{style:"currency",currency:"EUR"}).format(n);
const mm = n => `${Math.round(n)} mm`;
const safe = s => String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function typeName(n){return n===1?"Jednokrilni":n===2?"Dvokrilni":"Trokrilni"}

$("windowForm").addEventListener("submit",e=>{
  e.preventDefault();
  const w=Number($("width").value), h=Number($("height").value), n=Number($("type").value), q=Number($("quantity").value);
  if(!Number.isFinite(w)||!Number.isFinite(h)||w<250||h<250||w>4000||h>4000||q<1||q>999){alert("Unesi širinu i visinu od 250 do 4000 mm i broj komada od 1 do 999.");return}
  windows.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random()),w,h,n,q,system:$("system").value,label:$("label").value.trim()});
  renderList();
  $("label").value="";
});
function renderList(){
  const el=$("windowList");
  $("listSubtitle").textContent=windows.length?`${windows.length} stavki · ${windows.reduce((s,x)=>s+x.q,0)} ukupno komada`:"Još nema dodatih prozora.";
  if(!windows.length){el.innerHTML='<div class="empty-state">Dodaj prvi prozor da bi se pojavio na listi.</div>';return}
  el.innerHTML=windows.map((x,i)=>`<article class="window-item"><div><strong>${safe(x.label||`Prozor ${i+1}`)} · ${typeName(x.n)}</strong><p>${mm(x.w)} × ${mm(x.h)} · ${x.q} kom. · ${safe(SYSTEMS[x.system].name)}</p></div><div class="item-actions"><button class="mini-btn" data-edit="${x.id}">Izmeni</button><button class="mini-btn delete" data-delete="${x.id}">Ukloni</button></div></article>`).join("");
  el.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>{windows=windows.filter(x=>x.id!==b.dataset.delete);renderList()});
  el.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>{const x=windows.find(x=>x.id===b.dataset.edit);if(!x)return;$("width").value=x.w;$("height").value=x.h;$("type").value=x.n;$("quantity").value=x.q;$("system").value=x.system;$("label").value=x.label;windows=windows.filter(y=>y.id!==x.id);renderList();window.scrollTo({top:0,behavior:"smooth"})});
}
$("clearBtn").onclick=()=>{if(windows.length&&confirm("Obrisati celu listu prozora?")){windows=[];renderList();$("results").classList.add("hidden")}};
$("showBtn").onclick=()=>{
  if(!windows.length){alert("Prvo dodaj bar jedan prozor na listu.");return}
  lastResults=windows.map(x=>({...x,cost:calculate(x)}));
  renderResults();$("results").classList.remove("hidden");$("results").scrollIntoView({behavior:"smooth",block:"start"});
};
function calculate(x){
  const p=SYSTEMS[x.system], w=x.w/1000,h=x.h/1000,n=x.n,q=x.q;
  const frameLen=2*(w+h);
  // Procena: krila dele korisnu širinu ravnomerno; ne uključuje odbitke za varenje i okov.
  const sashLen=n*2*(w/n+h);
  const beadLen=sashLen;
  const tLen=Math.max(0,n-1)*h;
  const reinLen=frameLen+sashLen+tLen;
  const parts=[
    {name:"Štok",len:frameLen,price:p.frame,stock:p.frameLen},
    {name:"Krilo",len:sashLen,price:p.sash,stock:p.sashLen},
    {name:"Lajsna za staklo",len:beadLen,price:p.bead,stock:p.beadLen},
    {name:"Ojačanje (procena)",len:reinLen,price:p.reinforcement,stock:p.reinLen},
    ...(n>1?[{name:"T-prečka / razdelnik",len:tLen,price:p.tbar,stock:p.tbarLen}]:[])
  ].map(z=>({...z,cost:z.len*z.price/z.stock*q}));
  return {parts,total:parts.reduce((s,z)=>s+z.cost,0),perPiece:parts.reduce((s,z)=>s+z.cost,0)/q,frameLen,sashLen,beadLen,tLen,reinLen,system:p};
}
function svgSketch(x){
  const width=540,height=370, left=100,top=56,drawW=340,drawH=250;
  const ratio=Math.min(drawW/x.w,drawH/x.h), rw=x.w*ratio,rh=x.h*ratio, ox=left+(drawW-rw)/2,oy=top+(drawH-rh)/2;
  let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${safe(typeName(x.n))} ${x.w} x ${x.h} mm"><rect width="540" height="370" fill="#fbfdfd"/><text x="22" y="26" font-family="Arial" font-size="13" font-weight="bold" fill="#24343b">${safe(x.label||typeName(x.n))}</text>`;
  s+=`<rect x="${ox}" y="${oy}" width="${rw}" height="${rh}" fill="#dfe9e8" stroke="#263b42" stroke-width="7"/>`;
  const inner=8;
  const ix=ox+inner,iy=oy+inner,iw=rw-inner*2,ih=rh-inner*2;
  s+=`<rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" fill="#d9eef2" stroke="#77939a" stroke-width="2"/>`;
  for(let i=1;i<x.n;i++){const xx=ix+iw*i/x.n;s+=`<line x1="${xx}" y1="${iy}" x2="${xx}" y2="${iy+ih}" stroke="#263b42" stroke-width="7"/><line x1="${xx}" y1="${iy+5}" x2="${xx}" y2="${iy+ih-5}" stroke="#77939a" stroke-width="1.5"/>`}
  for(let i=0;i<x.n;i++){const mid=ix+iw*(i+.5)/x.n;s+=`<path d="M ${mid-10} ${iy+ih/2-7} L ${mid+7} ${iy+ih/2} L ${mid-10} ${iy+ih/2+7}" fill="none" stroke="#4d737b" stroke-width="2"/>`}
  // Dimension lines
  s+=`<line x1="${ox}" y1="${oy-17}" x2="${ox+rw}" y2="${oy-17}" stroke="#6c7c81" stroke-width="1"/><line x1="${ox}" y1="${oy-22}" x2="${ox}" y2="${oy-12}" stroke="#6c7c81"/><line x1="${ox+rw}" y1="${oy-22}" x2="${ox+rw}" y2="${oy-12}" stroke="#6c7c81"/><text x="${ox+rw/2}" y="${oy-24}" text-anchor="middle" font-family="Arial" font-size="12" fill="#53666c">${x.w} mm</text>`;
  s+=`<line x1="${ox+rw+18}" y1="${oy}" x2="${ox+rw+18}" y2="${oy+rh}" stroke="#6c7c81" stroke-width="1"/><line x1="${ox+rw+13}" y1="${oy}" x2="${ox+rw+23}" y2="${oy}" stroke="#6c7c81"/><line x1="${ox+rw+13}" y1="${oy+rh}" x2="${ox+rw+23}" y2="${oy+rh}" stroke="#6c7c81"/><text x="${ox+rw+32}" y="${oy+rh/2}" transform="rotate(90 ${ox+rw+32} ${oy+rh/2})" text-anchor="middle" font-family="Arial" font-size="12" fill="#53666c">${x.h} mm</text>`;
  s+=`<text x="22" y="347" font-family="Arial" font-size="11" fill="#73858a">${safe(SYSTEMS[x.system].name)} · ${x.q} kom.</text></svg>`;
  return s;
}
function renderResults(){
  const totalPieces=lastResults.reduce((s,x)=>s+x.q,0);
  const totalCost=lastResults.reduce((s,x)=>s+x.cost.total,0);
  const totalProfit=totalCost*0.70;
  const totalSale=totalCost*1.70;
  const allLength=lastResults.reduce((s,x)=>s+(x.cost.frameLen+x.cost.sashLen+x.cost.beadLen+x.cost.reinLen+x.cost.tLen)*x.q,0);
  $("summary").innerHTML=`<div class="metric"><span>Ukupno prozora</span><strong>${totalPieces}</strong><small>komada</small></div><div class="metric"><span>Cena proizvodnje (profili)</span><strong>${euro(totalCost)}</strong><small>za celu listu</small></div><div class="metric"><span>Zarada (70%)</span><strong>${euro(totalProfit)}</strong><small>obračunata na cenu proizvodnje</small></div><div class="metric"><span>Prodajna cena ukupno</span><strong>${euro(totalSale)}</strong><small>proizvodnja + 70% zarade</small></div><div class="metric"><span>Utrošak profila (približno)</span><strong>${allLength.toFixed(2)} m</strong><small>zbir svih stavki</small></div>`;
  $("sketchGrid").innerHTML=lastResults.map((x,i)=>{
    const profit=x.cost.total*0.70, sale=x.cost.total*1.70;
    return `<article class="sketch-card"><header><strong>${safe(x.label||`Prozor ${i+1}`)} · ${typeName(x.n)}</strong><span>${x.q} kom.</span></header><div class="sketch-wrap">${svgSketch(x)}</div><div class="sketch-caption"><strong>${mm(x.w)} × ${mm(x.h)}</strong><br>${safe(x.cost.system.name)}<br>Cena proizvodnje po komadu: ${euro(x.cost.perPiece)}<br>Zarada po komadu (70%): ${euro(x.cost.perPiece*0.70)}<br><strong>Prodajna cena po komadu: ${euro(x.cost.perPiece*1.70)}</strong><br>Proizvodnja za stavku: ${euro(x.cost.total)} · zarada za stavku: ${euro(profit)} · prodajna cena stavke: ${euro(sale)}<br>${x.cost.parts.map(p=>`${safe(p.name)}: ${p.len.toFixed(2)} m × ${x.q} = ${euro(p.cost)}`).join("<br>")}</div></article>`;
  }).join("");
}
function downloadBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)}
$("downloadSvgBtn").onclick=()=>{
  if(!lastResults.length)return;
  const pieces=lastResults.map((x,i)=>`<g transform="translate(0 ${i*390})">${svgSketch(x).replace(/^<svg[^>]*>/,"").replace(/<\/svg>$/,"")}</g>`).join("");
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="540" height="${lastResults.length*390}" viewBox="0 0 540 ${lastResults.length*390}">${pieces}</svg>`;
  downloadBlob(new Blob([svg],{type:"image/svg+xml;charset=utf-8"}),"salamander-skice.svg");
};
$("downloadPngBtn").onclick=async()=>{
  if(!lastResults.length)return;
  const svgPieces=lastResults.map((x,i)=>`<g transform="translate(0 ${i*390})">${svgSketch(x).replace(/^<svg[^>]*>/,"").replace(/<\/svg>$/,"")}</g>`).join("");
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="${lastResults.length*780}" viewBox="0 0 540 ${lastResults.length*390}">${svgPieces}</svg>`;
  const url=URL.createObjectURL(new Blob([svg],{type:"image/svg+xml"}));const img=new Image();
  img.onload=()=>{const c=document.createElement("canvas");c.width=1080;c.height=lastResults.length*780;c.getContext("2d").drawImage(img,0,0,c.width,c.height);c.toBlob(blob=>downloadBlob(blob,"salamander-skice.png"),"image/png");URL.revokeObjectURL(url)};
  img.onerror=()=>{URL.revokeObjectURL(url);alert("PNG nije mogao da se napravi. Preuzmi SVG umesto njega.")};img.src=url;
};
$("downloadCsvBtn").onclick=()=>{
  const rows=[["Naziv","Tip","Sistem","Širina (mm)","Visina (mm)","Količina","Stavka profila","Dužina po prozoru (m)","Cena profila po štapu (€)","Dužina štapa (m)","Trošak stavke (€)","Cena proizvodnje prozora (€)","Zarada 70% (€)","Prodajna cena (€)"]];
  lastResults.forEach((x,i)=>x.cost.parts.forEach((p,j)=>rows.push([x.label||`Prozor ${i+1}`,typeName(x.n),x.cost.system.name,x.w,x.h,x.q,p.name,p.len.toFixed(3),p.price,p.stock,p.cost.toFixed(2),j===0?x.cost.total.toFixed(2):"",j===0?(x.cost.total*0.70).toFixed(2):"",j===0?(x.cost.total*1.70).toFixed(2):""])));
  const csv="\uFEFF"+rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(";")).join("\r\n");
  downloadBlob(new Blob([csv],{type:"text/csv;charset=utf-8"}),"salamander-obracun.csv");
};
$("printBtn").onclick=()=>window.print();
