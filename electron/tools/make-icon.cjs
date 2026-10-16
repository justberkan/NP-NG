'use strict';
// Yerel vektör şekillerinden 256 px PNG/ICO üretir; görsel indirmez.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const out=path.join(__dirname,'../build');fs.mkdirSync(out,{recursive:true});
const N=256,pixels=Buffer.alloc(N*(N*4+1));
function inside(x,y,p){let hit=false;for(let i=0,j=p.length-1;i<p.length;j=i++)if((p[i][1]>y)!==(p[j][1]>y)&&x<(p[j][0]-p[i][0])*(y-p[i][1])/(p[j][1]-p[i][1])+p[i][0])hit=!hit;return hit}
const shape=[[61,67],[87,67],[170,186],[144,186]],left=[[61,67],[86,67],[86,186],[61,186]],right=[[170,67],[195,67],[195,186],[170,186]];
for(let y=0;y<N;y++)for(let x=0;x<N;x++){const p=y*(N*4+1)+1+x*4;const radius=Math.hypot(x-127.5,y-127.5),edge=radius>116&&radius<120,gold=edge||[shape,left,right].some(s=>inside(x,y,s));const c=gold?[217,182,109]:[13,24,26];pixels[p]=c[0];pixels[p+1]=c[1];pixels[p+2]=c[2];pixels[p+3]=radius<=123?255:0}
function crc(b){let c=0xffffffff;for(const x of b){c^=x;for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0)}return(c^0xffffffff)>>>0}
function chunk(type,b){const t=Buffer.from(type),l=Buffer.alloc(4),c=Buffer.alloc(4);l.writeUInt32BE(b.length);c.writeUInt32BE(crc(Buffer.concat([t,b])));return Buffer.concat([l,t,b,c])}
const ih=Buffer.alloc(13);ih.writeUInt32BE(N);ih.writeUInt32BE(N,4);ih[8]=8;ih[9]=6;
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ih),chunk('IDAT',zlib.deflateSync(pixels)),chunk('IEND',Buffer.alloc(0))]);
fs.writeFileSync(path.join(out,'icon.png'),png);const ico=Buffer.alloc(22);ico.writeUInt16LE(1,2);ico.writeUInt16LE(1,4);ico.writeUInt16LE(1,10);ico.writeUInt16LE(32,12);ico.writeUInt32LE(png.length,14);ico.writeUInt32LE(22,18);fs.writeFileSync(path.join(out,'icon.ico'),Buffer.concat([ico,png]));
