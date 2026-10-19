# -*- coding: utf-8 -*-
"""Adım 3b: UV -> palet renk örnekleme, simplify, renk aktarımı, vertex-color GLB."""
import trimesh, numpy as np, json, os
import fast_simplification
from PIL import Image
from scipy.spatial import cKDTree

SRC='lowpoly_city.glb'; OUT_DIR='npng-repo/assets/city'
SCALE=2.5; CX,CZ,HALF=-150.0,-250.0,175.0; CELL=80.0; TRI_TARGET=55000
os.makedirs(OUT_DIR,exist_ok=True)

scene=trimesh.load(SRC,force='scene')
meshes=[]
for nn in scene.graph.nodes_geometry:
    T,gn=scene.graph[nn]; g=scene.geometry[gn]
    if not isinstance(g,trimesh.Trimesh):continue
    c=trimesh.transformations.transform_points(g.triangles_center.reshape(-1,3),T)
    sel=(np.abs(c[:,0]-CX)<=HALF)&(np.abs(c[:,2]-CZ)<=HALF)
    if not sel.any():continue
    g2=g.copy(); g2.update_faces(sel)
    if g2.faces.shape[0]==0:continue
    g2.apply_transform(T)
    g2.vertices=(g2.vertices-[CX,0,CZ])*SCALE
    meshes.append(g2)
print('mesh:',len(meshes),'tri:',sum(m.faces.shape[0] for m in meshes))

# doku paleti
tex_img=None
for gn,g in scene.geometry.items():
    m=getattr(g.visual,'material',None)
    img=getattr(m,'baseColorTexture',None) if m else None
    if img is not None: tex_img=img.convert('RGB'); break
tex_arr=np.asarray(tex_img)
TH,TH=tex_arr.shape[0],tex_arr.shape[1]
def uv2color(uv):
    # glTF/three UV: v=0 alt kenar; PIL satir 0 ust kenar -> v'yi ters cevir
    u=np.clip((uv[:,0]%1.0)*TH,0,TH-1).astype(int)
    v=np.clip(((1.0-uv[:,1])%1.0)*TH,0,TH-1).astype(int)
    return tex_arr[v,u]  # (N,3)

cells={}
for m in meshes:
    cc=m.triangles_center
    key=(int(np.floor(cc[:,0].mean()/CELL)),int(np.floor(cc[:,2].mean()/CELL)))
    cells.setdefault(key,[]).append(m)
tot=sum(m.faces.shape[0] for m in meshes)
KEEP=0.17  # 178k -> ~60k; kat/komsu kaynakmasi yok, her bina kendi icinde sadelestirilir

ready=[]
for i,m in enumerate(meshes):
    uv=np.asarray(m.visual.uv)
    cols=uv2color(uv) if len(uv)==len(m.vertices) else np.full((len(m.vertices),3),200)
    v=np.asarray(m.vertices,dtype=np.float32); f=np.asarray(m.faces,dtype=np.int64)
    if f.shape[0]>60:
        tgt=max(30,int(f.shape[0]*KEEP))
        v,f=fast_simplification.simplify(v,f,target_count=tgt)
    b=trimesh.Trimesh(vertices=v,faces=f,process=False)
    b.merge_vertices()
    b.remove_infinite_values()
    b.update_faces(b.nondegenerate_faces())
    # birlestirme sonrasi kose sayisina gore en yakin orijinalden renk
    tree=cKDTree(np.asarray(m.vertices))
    _,idx=tree.query(np.asarray(b.vertices))
    vc=np.hstack([cols[idx].astype(np.uint8),np.full((len(idx),1),255,dtype=np.uint8)])
    b.visual=trimesh.visual.ColorVisuals(vertex_colors=vc)
    _=b.vertex_normals
    ready.append(b)
print('hazir mesh:',len(ready),'tri:',sum(b.faces.shape[0] for b in ready))

cells={}
for b in ready:
    cc=b.triangles_center
    key=(int(np.floor(cc[:,0].mean()/CELL)),int(np.floor(cc[:,2].mean()/CELL)))
    cells.setdefault(key,[]).append(b)

merged=[]
for key,ms in cells.items():
    b=trimesh.util.concatenate(ms)
    _=b.vertex_normals
    merged.append((key,b))
    print('hücre',key,'tri',b.faces.shape[0])

# hücreleri ayrı node'lar olarak sahneye koy (ekran dışı hücre çizilmesin)
# metal varsayilan 1 -> isiksiz ortamda siyah gorunur; 0 yap
s=trimesh.Scene()
for (key,b) in merged:
    s.add_geometry(b,node_name=f'cell_{key[0]}_{key[1]}',geom_name=f'cell_{key[0]}_{key[1]}')
glb_path=os.path.join(OUT_DIR,'lowpoly_city_opt.glb')
s.export(glb_path)
print('GLB boyut:',os.path.getsize(glb_path)//1024,'KB')

# kaynak doku da PNG olarak kalsın (referans)
tex_img.save(os.path.join(OUT_DIR,'city_tex.png'))

# colliders
boxes=[]
for m in meshes:
    mn,mx=m.bounds
    h=mx[1]-mn[1]; wx=mx[0]-mn[0]; wz=mx[2]-mn[2]
    if h>=2.5 and wx>=1.5 and wz>=1.5 and wx<120 and wz<120:
        boxes.append([round(float(mn[0]),1),round(float(mn[2]),1),round(float(mx[0]),1),round(float(mx[2]),1),round(float(h),1)])
final=[]
for b in sorted(boxes,key=lambda b:(b[0],b[1])):
    if any(b[0]>=f[0]-.5 and b[1]>=f[1]-.5 and b[2]<=f[2]+.5 and b[3]<=f[3]+.5 for f in final):continue
    final.append(b)
coll={"origin":[0,0],"scale":1.0,"note":"kutular [minX,minZ,maxX,maxZ,yukseklik], metre; sehir merkezine gore; kaynak 2.5x olceklendi, 350x350m mahalle","boxes":final}
with open(os.path.join(OUT_DIR,'city_colliders.json'),'w') as f:json.dump(coll,f)
print('collider kutu:',len(final))
