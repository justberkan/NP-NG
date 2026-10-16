const fs=require('fs'),path=require('path'),cp=require('child_process');
const root=process.cwd(),out=path.join(root,'docs/codex-lobi-yama'),stage=path.join(out,'deneme');fs.mkdirSync(stage,{recursive:true});
const files=['css/style.css','js/lobby3d.js','js/ui.js'];
for(const f of files){fs.mkdirSync(path.dirname(path.join(stage,f)),{recursive:true});fs.copyFileSync(path.join(root,f),path.join(stage,f));}
cp.execFileSync('git',['init','-q'],{cwd:stage});cp.execFileSync('git',['add','.'],{cwd:stage});cp.execFileSync('git',['-c','user.name=Codex','-c','user.email=codex@local','commit','--allow-empty','-qm','base'],{cwd:stage});
let css=fs.readFileSync(path.join(stage,files[0]),'utf8');css+='\n/* LOBI-ALAN-001: menu ve karakter icin birbirinden ayri alanlar. */\n#lb.sub #sa{display:block;width:clamp(130px,25vw,440px);min-width:0;flex:none;pointer-events:none}\n#lb.sub #scn{min-width:0}\n@media(max-width:760px){\n #lb.sub #sa{width:clamp(76px,21vw,160px)}\n #lb.sub #sv{gap:8px}\n #lb.sub #av{margin-right:0}\n #lb.sub #fr{display:none}\n #lb.sub #fx{display:none}\n #lb.sub #scn .grid{grid-template-columns:repeat(2,minmax(0,1fr))}\n #lb.sub #scn table{font-size:11px}\n}\n';fs.writeFileSync(path.join(stage,files[0]),css);
let js=fs.readFileSync(path.join(stage,files[1]),'utf8');
js=js.replace(" const avail=1-204/Math.max(innerWidth,400);",` const avail=1-204/Math.max(innerWidth,400);
 // DOM olustuktan sonra gercek onizleme alanini olc; her karede olcum yapma.
 const lane=document.getElementById('sa');
 const rect=lobbyView!=='home'&&lane?lane.getBoundingClientRect():null;
 const laneOK=rect&&rect.width>0;
 const laneF=laneOK?(rect.left+rect.width/2)/innerWidth:.165;
 const halfW=Math.tan(LC.fov*Math.PI/360)*(LB.camDist+.4)*LC.aspect;
 // Silah ve platform icin 2.8 dunya birimlik guvenli genislik birak.
 const fit=laneOK?Math.min(1,rect.width*.82/(2.8*innerWidth/(2*halfW))):1;`);
js=js.replace("const f=sub?(s.d.me?.165:.5)","const f=sub?(s.d.me?laneF:.5)");
js=js.replace('  const x=worldX(f);',`  // Alt gorunumde z=-.4 oldugundan ekran merkezi icin ayni derinligi kullan.
  const x=sub?(f-.5)*2*halfW:worldX(f);
  const scale=sub&&s.d.me?fit:1;
  s.plat.scale.setScalar(scale);
  if(s.rig)s.rig.root.scale.setScalar(scale);`);
fs.writeFileSync(path.join(stage,files[1]),js);
let ui=fs.readFileSync(path.join(stage,files[2]),'utf8').replace(/\r\n/g,'\n');ui=ui.replace(" lobbySetView(n==='home'?'home':'sub');",' // lobbySetView, #sa olusturulduktan sonra cagrilir.');
ui=ui.replace("  (VIEWWIRE[n]||(()=>{}))();\n }\n bal();","  (VIEWWIRE[n]||(()=>{}))();\n }\n lobbySetView(n==='home'?'home':'sub');\n bal();");
if(!ui.includes(" }\n lobbySetView(n==='home'?'home':'sub');"))throw Error('ui anchor not found');fs.writeFileSync(path.join(stage,files[2]),ui);
const diff=cp.execFileSync('git',['diff','--no-ext-diff','--binary'],{cwd:stage});fs.writeFileSync(path.join(out,'lobi-karakter-alani.patch'),diff);
for(const f of files){fs.mkdirSync(path.dirname(path.join(out,'degisen-dosyalar',f)),{recursive:true});fs.copyFileSync(path.join(stage,f),path.join(out,'degisen-dosyalar',f));}
console.log('Patch hazır: '+diff.length+' bytes');

