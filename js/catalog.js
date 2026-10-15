'use strict';
/* ===== Silah modeli kataloğu (GLB). Her model bir oyun sınıfına bağlanır: rifle / smg / pistol / dual / knife.
   Seçilen model o sınıfın görünümünü ve istatistiklerini değiştirir. Modeller CC-BY 4.0 (bkz. Krediler). ===== */
/* MDLFIX: namlu/uç yönü ters çıkanları çevirir (models.js içinde okunur) */
['sw_bakufu_mesh','sw_boreas_mesh','sw_cool_steel_mesh','sw_dull_blade_mesh','sw_freedom_sworn_mesh','sw_katana_mesh','sw_lions_roar_mesh','sw_narukami_mesh','sw_prototype_rancour_mesh','sw_mistsplitter_reforged_mesh',
 'kn_bayonet_knife','kn_butterfly_knife','kn_combat_knife','kn_krambit_knife','kn_nomad_knife','kn_skeleton_knife','kn_t_handle_dagger','lg_knife','lg_large_knife','lg_tomahawk','lg_morningstar',
 'lg_sr_3m','lg_h_k_ump45','lg_kriss_vector','lg_skorpion','lg_fn_p90','lg_aa_12','lg_xma_10','lg_s12p8','lg_saiga_12','ap_p2020','ap_r_99','ap_r_301','ap_shotgun'
].forEach(i=>MDLFIX[i]={f:1});

/* Sınıf başına temel değerler (WP'den), model bazlı üzerine yazılır */
const WM_CATS={
 ar:{cls:'rifle'},
 br:{cls:'rifle',dmg:34,rate:.13,mag:20,kick:1.35,spread:.018,rel:2},
 lmg:{cls:'rifle',dmg:23,rate:.085,mag:75,kick:.95,spread:.03,rel:3.3},
 sn:{cls:'rifle',dmg:120,rate:1,mag:6,auto:0,kick:3,spread:.004,rel:2.8},
 sg:{cls:'rifle',dmg:95,rate:.75,mag:8,auto:0,kick:3.2,spread:.05,rel:2.6,pel:1},
 smg:{cls:'smg'},
 pi:{cls:'pistol'},
 kn:{cls:'knife'}
};
/* [id, model, ad, kategori, nadirlik, fiyat, ölçek(m/birim), değişiklikler] */
const WM_RAW=[
 ['m_ak556','lg_ak_556','AK-556','ar','common',400,.4,{dmg:27,rate:.105,kick:1.15}],
 ['m_m4','lg_ar_15','M4 Karabina','ar','common',350,.4,{dmg:25,rate:.092,kick:.95}],
 ['m_l85','lg_l85a2','L85A2','ar','common',450,.4,{dmg:26,rate:.1,spread:.019}],
 ['m_aug','lg_steyr_aug','AUG A3','ar','rare',700,.4,{dmg:26,rate:.09,spread:.016,kick:.85}],
 ['m_famas','lg_famas_f1','FAMAS F1','ar','rare',700,.4,{dmg:22,rate:.07,mag:25,kick:.9}],
 ['m_g36','lg_h_k_g36k','G36K','ar','rare',750,.4,{dmg:25,rate:.088,spread:.017,mag:30}],
 ['m_scarl','lg_fn_scar_l','SCAR-L','ar','epic',1200,.4,{dmg:30,rate:.1,spread:.016,kick:1}],
 ['m_groza','lg_ots_14_groza','OTs-14 Groza','ar','epic',1400,.4,{dmg:31,rate:.095,spread:.017,kick:1.1}],
 ['m_badger','lg_aac_honey_badger','Honey Badger','ar','epic',1500,.4,{dmg:28,rate:.085,spread:.013,kick:.8}],
 ['m_r301','ap_r_301','R-301','ar','epic',1600,.0548,{dmg:26,rate:.083,spread:.015,kick:.9}],
 ['m_g3','lg_h_k_g3','G3','br','rare',900,.4,{}],
 ['m_scarh','lg_fn_scar_h','SCAR-H','br','epic',1500,.4,{dmg:38,rate:.12}],
 ['m_as762','lg_as_762','AS-762','br','rare',950,.4,{dmg:35,rate:.125}],
 ['m_galil','lg_imi_galil_762','Galil 762','br','rare',950,.4,{dmg:33,rate:.115,mag:25}],
 ['m_hbar','lg_steyr_aug_hbar','AUG HBAR','br','rare',800,.4,{dmg:30,rate:.1,mag:42,kick:.9}],
 ['m_rpd','lg_rpd','RPD','lmg','epic',1800,.4,{}],
 ['m_rpk','lg_rpk_556','RPK-556','lmg','epic',1800,.4,{dmg:25,mag:60,spread:.026}],
 ['m_m24','lg_m24','M24','sn','rare',1200,.4,{dmg:110,rate:1.05,mag:5}],
 ['m_awm','lg_awm','AWM','sn','legendary',2500,.4,{dmg:150,rate:1.25,mag:5,spread:.002}],
 ['m_m107','lg_barret_m107','Barret M107','sn','legendary',3200,.4,{dmg:200,rate:1.4,mag:5,kick:4,rel:3.4}],
 ['m_mosin','lg_mosin_nagat','Mosin','sn','rare',900,.4,{dmg:100,rate:1.1,mag:5,rel:3}],
 ['m_ssr','lg_fn_scar_ssr','SCAR-SSR','sn','epic',1700,.4,{dmg:65,rate:.33,mag:10,auto:0,kick:2,spread:.006}],
 ['m_svd','lg_dragunov_svd','Dragunov SVD','sn','epic',1600,.4,{dmg:75,rate:.4,mag:10,auto:0,kick:2.2,spread:.006}],
 ['m_sks','lg_sks','SKS','sn','rare',800,.4,{dmg:48,rate:.24,mag:10,auto:0,kick:1.7,spread:.01}],
 ['m_aa12','lg_aa_12','AA-12','sg','epic',1700,.4,{auto:1,rate:.2,mag:20,dmg:40,spread:.045}],
 ['m_xma','lg_xma_10','XMA-10','sg','rare',900,.4,{}],
 ['m_s12','lg_s12p8','S12P8','sg','rare',1000,.4,{rate:.6,mag:10}],
 ['m_saiga','lg_saiga_12','SAIGA-12','sg','rare',1100,.4,{auto:1,rate:.3,mag:8,dmg:55}],
 ['m_moz','ap_shotgun','Mozambique','sg','epic',1400,.066,{dmg:105,rate:.85,mag:6}],
 ['m_mp7','lg_h_k_mp7','MP7','smg','common',400,.4,{dmg:13,rate:.055,mag:40}],
 ['m_ump','lg_h_k_ump45','UMP45','smg','common',450,.4,{dmg:20,rate:.09,mag:25,kick:.8}],
 ['m_skor','lg_skorpion','Skorpion','smg','common',350,.4,{dmg:12,rate:.06,mag:30,spread:.04}],
 ['m_sr3','lg_sr_3m','SR-3M','smg','rare',700,.4,{dmg:18,rate:.07,mag:30,spread:.03}],
 ['m_p90','lg_fn_p90','P90','smg','rare',850,.4,{dmg:14,rate:.06,mag:50,kick:.5}],
 ['m_kriss','lg_kriss_vector','Vector','smg','rare',900,.4,{dmg:12,rate:.045,mag:33,kick:.5}],
 ['m_r99','ap_r_99','R-99','smg','epic',1300,.0564,{dmg:14,rate:.052,mag:27,kick:.5,spread:.03}],
 ['m_g17','lg_g_17','G17','pi','common',250,.4,{dmg:30,rate:.2,mag:17}],
 ['m_p9','lg_p9','P9','pi','common',200,.4,{dmg:32,rate:.22,mag:15}],
 ['m_57','lg_fn_five_seven','Five-seven','pi','rare',500,.4,{dmg:30,rate:.16,mag:20,kick:1}],
 ['m_deagle','lg_iwi_mri_deagle','Desert Eagle','pi','rare',800,.4,{dmg:62,rate:.4,mag:7,kick:2.4,spread:.01}],
 ['m_357','lg_blazeson_julius_357','Magnum 357','pi','epic',1200,.4,{dmg:70,rate:.55,mag:6,kick:2.6,spread:.009}],
 ['m_p2020','ap_p2020','P2020','pi','rare',600,.0544,{dmg:34,rate:.2,mag:14}],
 ['m_wing','ap_wingman','Wingman','pi','epic',1500,.05,{dmg:66,rate:.45,mag:6,kick:2.4,spread:.008}],
 ['m_katana','lg_katana','Katana','kn','epic',900,.06,{dmg:62,rate:.34}],
 ['m_raran','lg_raran_prototype_1130','RARAN Prototype','pi','legendary',1400,.05,{dmg:58,rate:.3,mag:8,kick:2,spread:.008}],
 ['m_kbay','kn_bayonet_knife','Süngü','kn','common',200,.06,{}],
 ['m_kcom','kn_combat_knife','Savaş Bıçağı','kn','common',150,.06,{dmg:48,rate:.28}],
 ['m_ktac','lg_knife','Taktik Bıçak','kn','common',150,.4,{dmg:46,rate:.26}],
 ['m_klrg','lg_large_knife','Büyük Bıçak','kn','common',300,.4,{dmg:62,rate:.36}],
 ['m_knom','kn_nomad_knife','Nomad','kn','rare',500,.06,{dmg:52,rate:.3}],
 ['m_kbut','kn_butterfly_knife','Kelebek Bıçağı','kn','rare',600,.06,{dmg:44,rate:.2}],
 ['m_ktee','kn_t_handle_dagger','T-Saplı Hançer','kn','rare',650,.07,{dmg:56,rate:.3}],
 ['m_kske','kn_skeleton_knife','İskelet Bıçak','kn','rare',700,.065,{dmg:50,rate:.24}],
 ['m_kkar','kn_krambit_knife','Karambit','kn','epic',1100,.06,{dmg:58,rate:.26}],
 ['m_taxe','lg_tomahawk','Tomahawk','kn','rare',800,.4,{dmg:78,rate:.46}],
 ['m_mace','lg_trench_mace','Siper Gürzü','kn','epic',1300,.4,{dmg:92,rate:.62}],
 ['m_mstar','lg_morningstar','Sabah Yıldızı','kn','legendary',2000,.4,{dmg:115,rate:.72}]
];
const WM_CLS={rifle:'Tüfek',smg:'SMG',pistol:'Tabanca',knife:'Bıçak'};
const WM_SUB={ar:'Taarruz tüfeği',br:'Muharebe tüfeği',lmg:'Makineli tüfek',sn:'Nişancı',sg:'Pompalı',smg:'SMG',pi:'Tabanca',kn:'Yakın dövüş'};
/* Model kimliği → alt tür açıklaması */
const WMOD=WM_RAW.map(r=>{
 const [id,mid,n,cat,rar,p,k,o]=r,b=WM_CATS[cat],base=WP[b.cls];
 const st=Object.assign({},b,o),mel=!!base.melee;
 const dmg=st.dmg!=null?st.dmg:base.dmg,rate=st.rate!=null?st.rate:base.rate,mag=st.mag!=null?st.mag:base.mag,kick=st.kick!=null?st.kick:base.kick,spread=st.spread!=null?st.spread:base.spread;
 const bar=[Math.min(100,Math.round(20+dmg*1.3)),mel?100:Math.max(5,Math.min(100,Math.round(100-spread*2200))),mel?0:Math.min(100,Math.round(kick*40)),Math.min(100,Math.round(80*Math.pow(.1/rate,.6))),mel?0:mag];
 return {id,mid,n,cat,cls:b.cls,r:rar,p,k,cs:{dmg,rate,mag,kick,spread,auto:st.auto,rel:st.rel,pel:st.pel,mel},st:bar,sub:WM_SUB[cat]};
});
const WMID={};WMOD.forEach(m=>WMID[m.id]=m);
/* Oyundan kaldırılan modeller: elleri silaha oturmuyor (Mozambique: tutuş noktası güveni 0,3, sol el havada).
   Kayıt silinmez (envanter/pazar bozulmasın) ama satılmaz, kasadan çıkmaz, seçilemez; kuşanan varsayılan modele düşer. */
const WM_HIDE=new Set(['m_moz']);
const wmOn=m=>!WM_HIDE.has(m.id);
/* sınıf anahtarı → seçili model kimliği (çift tabanca, tabanca modelini kullanır) */
const modId=cls=>{const c=cls==='dual'?'pistol':cls;const id=(typeof LO!=='undefined'&&LO.on&&(c in LO.mod))?LO.mod[c]:(SV&&SV.mod&&SV.mod[c]);return id&&WMID[id]&&!WM_HIDE.has(id)?id:null};
const modOf=cls=>{const id=modId(cls);return id?WMID[id]:null};

/* Sınıf WP kaydının model uygulanmış kopyası (yalnızca yerel oyuncu için) */
const _wpx={};
function wpx(k){
 const m=modOf(k);if(!m||!WP[k])return WP[k];
 const key=k+'|'+m.id;
 if(_wpx[key])return _wpx[key];
 const c=m.cs,b=WP[k];
 const o=Object.assign({},b,{n:m.n,dmg:c.dmg,rate:c.rate,mag:c.mag,kick:c.kick,spread:c.spread,mdl:m.id});
 if(c.auto!=null)o.auto=c.auto;if(c.rel!=null)o.rel=c.rel;if(c.pel)o.pel=c.pel;
 o.st=m.st;
 return _wpx[key]=o;
}

/* ----- Açık dünya kılıçları (s0..s9): GLB modeller ----- */
const SWMOD={
 s0:{mid:'sw_dull_blade_mesh',len:1.1},s1:{mid:'sw_cool_steel_mesh',len:1.12},s2:{mid:'sw_katana_mesh',len:1.2},s3:{mid:'sw_bakufu_mesh',len:1.2},
 s4:{mid:'sw_lions_roar_mesh',len:1.5},s5:{mid:'sw_freedom_sworn_mesh',len:1.15},s6:{mid:'sw_boreas_mesh',len:1.1},
 s7:{mid:'sw_mistsplitter_reforged_mesh',len:1.55},s8:{mid:'sw_narukami_mesh',len:1.15},s9:{mid:'sw_prototype_rancour_mesh',len:1.2}
};
/* görünüme uygun ad/açıklama/parıltı */
(()=>{
 const T={s1:['Ay Palası','Gümüş bıçak, mor kabza. Geniş ve dengeli kesik atar.',null],
  s4:['Aslan Pençesi','İki elle taşınan geniş bıçak. Yavaş ama ezer geçer.',null],
  s5:['Mavi Şahin','Mavi parıltılı, altın kabzalı kılıç. Hızlı ve zarif.',0x4aa8ff],
  s6:['Don Keskisi','Buz tutmuş bıçak, soğuk bir parıltı bırakır.',0x7fe9ff],
  s7:['Sis Yaran','Mor ışıltılı dev kılıç. Her darbe sis saçar.',0xa88cff],
  s8:['Gece Yarısı','Gölgeden dökülmüş mor bıçak. Sessiz, çok hızlı.',0xa060ff],
  s9:['Ejderha Bıçağı','Altın işlemeli bıçak. Efsanelerin kılıcı.',0xffd24a]};
 for(const id in T){const s=SWID[id],t=T[id];s.n=t[0];s.d=t[1];s.gl=t[2];if(WP[id]){WP[id].n=t[0];WP[id].d=t[1];WP[id].glow=t[2]}}
})();

/* ----- weapons.js için yardımcılar ----- */
/* Klasik (kutu) silah modelleri kaldırıldı: model seçilmediyse sınıfın varsayılan GLB modeli kullanılır */
SWMOD.sword={mid:'sw_katana_mesh',len:1.2};SWMOD.gsword={mid:'sw_lions_roar_mesh',len:1.5};
const DEF_MOD={rifle:'m_m4',smg:'m_ump',pistol:'m_g17',knife:'m_kcom'};
function mdlSpec(k,mid){
 if(mid&&WMID[mid])return {mid:WMID[mid].mid,k:WMID[mid].k,sw:0};
 if(SWMOD[k])return {mid:SWMOD[k].mid,len:SWMOD[k].len,sw:1};
 const d=DEF_MOD[k==='dual'?'pistol':k];
 if(d&&WMID[d])return {mid:WMID[d].mid,k:WMID[d].k,sw:0};
 return null;
}
const GUN_SC=.8; /* silah boyu çarpanı: tutuş daha doğal dursun */
function mdlBuild(sp){
 const m=MDL.cache[sp.mid];if(!m)return null;
 return mdlMake(sp.mid,sp.len||m.L*sp.k*GUN_SC);
}
/* modeli sınıfın el noktasına oturtur; namlu/uç, sol el, nişangah yüksekliği döner */
function mdlPlace(mm,k,d,sp){
 const L=mm.userData.L,H=mm.userData.H,mel=!!d.melee,pis=d.hold==='pistol'||d.hold==='dual';
 /* Geometri tabanlı tutuş: kabza/ön kundak/namlu noktaları modelden otomatik bulunur (models.js: mdlGrips) */
 if(!mel&&!sp.sw){
  const m0=MDL.cache[sp.mid],G=m0?mdlGrips(sp.mid,pis?'pistol':(k==='smg'?'smg':'rifle')):null;
  if(G&&G.conf>=.5&&G.gR&&G.mz){
   const s=L/m0.L,gR=d.gR;
   const cy=gR[1]-s*G.gR[0],cz=gR[2]-s*G.gR[1];
   mm.position.set(0,cy,cz);
   const gf=(G.gR[1]-G.zmin)/G.L;
   let gL=null;
   if(!pis&&G.gL)gL=[0,cy+s*G.gL[0]-(G.gLk==='ön tutamak'?0:.03),cz+s*G.gL[1]];
   mm.userData.auto=1;
   return {bk:s*(G.gR[1]-G.zmin),adsz:pis?0:((k==='smg'?.4:.42)-gf)*L,mz:[0,cy+s*G.mz[0],cz+s*G.mz[1]],gL,sh:cy+s*G.top-.012};
  }
 }
 const gf=mel?(sp.sw?.15:.22):(pis?.28:(k==='smg'?.27:.3)); /* kabza: silahın arkadan %27-30'unda */
 const gR=d.gR,gy=mel?0:(pis?.3:.3)*H;
 const cy=gR[1]+gy,cz=gR[2]+(.5-gf)*L;
 mm.position.set(0,cy,cz);
 return {adsz:(mel||pis)?0:((k==='smg'?.4:.42)-gf)*L,mz:[0,cy+(mel?0:.1*H),cz+L/2],gL:(!mel&&!pis)?[0,cy-.38*H,cz+.2*L]:null /* sol el: ön kundağın altı */,sh:cy+H/2-.012};
}
/* model henüz yüklenmediyse yükle, bitince cb çağır */
function mdlWant(k,mid,cb){
 const sp=mdlSpec(k,mid);if(!sp||MDL.cache[sp.mid])return;
 mdlLoad(sp.mid,r=>{if(r)cb()});
}

/* Kuşanılan silah/kılıç modellerini önceden yükle (oyuna girince kutu yerine hemen model görünsün) */
function mdlPreload(){
 try{
  const ids=[];
  ['rifle','smg','pistol','knife'].forEach(k=>{const m=modOf(k);if(m)ids.push(m.mid)});
  const sw=SWMOD[SV.ow.mw];if(sw)ids.push(sw.mid);
  (SV.ow.sw||[]).forEach(s=>{if(SWMOD[s])ids.push(SWMOD[s].mid)});
  ids.forEach(id=>mdlLoad(id,()=>{}));
 }catch(e){}
}
