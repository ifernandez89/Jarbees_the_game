import os
import struct
from PIL import Image

ROOT_DIR = r"c:\Projects\Jarbees_the_game"
CS_ROOT = r"C:\Program Files (x86)\Counter-Strike 1.6"
BSP_PATH = os.path.join(CS_ROOT, r"cstrike\maps\cs_assault.bsp")
WAD_ASSAULT = os.path.join(CS_ROOT, r"cstrike\cs_assault.wad")
WAD_HALFLIFE = os.path.join(CS_ROOT, r"valve\halflife.wad")
TEX_OUT_DIR = os.path.join(ROOT_DIR, "public", "textures", "cs_assault")
MODELS_OUT = os.path.join(ROOT_DIR, "public", "models")

os.makedirs(TEX_OUT_DIR, exist_ok=True)
os.makedirs(MODELS_OUT, exist_ok=True)

# 1. Leer texturas WAD3
def load_wad_textures(wad_path):
    textures = {}
    if not os.path.exists(wad_path):
        return textures
    with open(wad_path, "rb") as f:
        magic, numlumps, info_ofs = struct.unpack("<4sII", f.read(12))
        f.seek(info_ofs)
        entries = []
        for _ in range(numlumps):
            filepos, disksize, size, ltype, comp, pad, name = struct.unpack("<IIIbbH16s", f.read(32))
            clean_name = name.split(b"\x00")[0].decode("latin-1", errors="ignore").lower()
            entries.append((filepos, clean_name, ltype))
        for pos, name, ltype in entries:
            if ltype == 0x43: # Miptex
                f.seek(pos)
                tex_name, w, h, off0, off1, off2, off3 = struct.unpack("<16sIIIIII", f.read(40))
                if off0 > 0:
                    f.seek(pos + off0)
                    pix_data = f.read(w * h)
                    f.seek(pos + off3 + (w//8)*(h//8))
                    pal_count = struct.unpack("<H", f.read(2))[0]
                    pal_raw = f.read(pal_count * 3)
                    img = Image.frombytes("P", (w, h), pix_data)
                    img.putpalette(pal_raw)
                    textures[name] = img.convert("RGB")
    return textures

print("Loading textures from WAD files...")
wad_tex = {}
wad_tex.update(load_wad_textures(WAD_HALFLIFE))
wad_tex.update(load_wad_textures(WAD_ASSAULT))
print(f"Total textures loaded in memory: {len(wad_tex)}")

# 2. Leer cs_assault.bsp
with open(BSP_PATH, "rb") as f:
    ver = struct.unpack("<I", f.read(4))[0]
    lumps = [struct.unpack("<II", f.read(8)) for _ in range(15)]
    
    # Vertices
    f.seek(lumps[3][0])
    raw_verts = [struct.unpack("<fff", f.read(12)) for _ in range(lumps[3][1]//12)]
    
    # Edges
    f.seek(lumps[12][0])
    edges = [struct.unpack("<HH", f.read(4)) for _ in range(lumps[12][1]//4)]
    
    # Surfedges
    f.seek(lumps[13][0])
    surfedges = [struct.unpack("<i", f.read(4))[0] for _ in range(lumps[13][1]//4)]
    
    # Texinfo
    f.seek(lumps[6][0])
    num_ti = lumps[6][1] // 40
    texinfos = []
    for _ in range(num_ti):
        s = struct.unpack("<4f", f.read(16))
        t = struct.unpack("<4f", f.read(16))
        miptex, flags = struct.unpack("<II", f.read(8))
        texinfos.append({"s": s, "t": t, "miptex": miptex, "flags": flags})
        
    # Texture names en lump 2
    f.seek(lumps[2][0])
    numtex = struct.unpack("<I", f.read(4))[0]
    tex_offsets = [struct.unpack("<i", f.read(4))[0] for _ in range(numtex)]
    tex_names = []
    for off in tex_offsets:
        if off < 0:
            tex_names.append("null")
            continue
        f.seek(lumps[2][0] + off)
        name = f.read(16).split(b"\x00")[0].decode("latin-1", errors="ignore").lower()
        tex_names.append(name)
        
    # Faces
    f.seek(lumps[7][0])
    num_faces = lumps[7][1] // 20
    faces = []
    for _ in range(num_faces):
        chunk = f.read(20)
        plane, side, firstedge, numedges, ti = struct.unpack("<hhihh", chunk[:12])
        faces.append({"firstedge": firstedge, "numedges": numedges, "texinfo": ti})

print(f"BSP v{ver}: {len(raw_verts)} verts, {len(edges)} edges, {len(faces)} faces, {len(tex_names)} texture slots")

# 3. Guardar las texturas referenciadas a disco
texture_dimensions = {}
for name in set(tex_names):
    if name in wad_tex:
        out_p = os.path.join(TEX_OUT_DIR, f"{name}.png")
        wad_tex[name].save(out_p)
        texture_dimensions[name] = wad_tex[name].size
    else:
        # Textura fallback neutral (gris)
        fallback = Image.new("RGB", (64, 64), (100, 105, 110))
        out_p = os.path.join(TEX_OUT_DIR, f"{name}.png")
        fallback.save(out_p)
        texture_dimensions[name] = (64, 64)

print(f"Saved {len(texture_dimensions)} unique textures to {TEX_OUT_DIR}")

# 4. Generar script para Blender para construir la geometría con UVs exactas
blender_code = f"""
import bpy, bmesh, os

bpy.ops.wm.read_factory_settings(use_empty=True)

TEX_DIR = r"{TEX_OUT_DIR}"
MODELS_OUT = r"{MODELS_OUT}"

raw_verts = {raw_verts}
edges = {edges}
surfedges = {surfedges}
texinfos = {texinfos}
tex_names = {tex_names}
faces = {faces}
tex_dims = {texture_dimensions}

# Factor de escala metrico: CS units (pulgadas) a Metros Three.js (1 unidad = 0.0254m)
SCALE = 0.0254

# Centro aproximado de la arena para centrar en el origen de coordenadas
xs = [v[0] for v in raw_verts]
ys = [v[1] for v in raw_verts]
zs = [v[2] for v in raw_verts]
cx = (min(xs) + max(xs)) * 0.5
cy = (min(ys) + max(ys)) * 0.5
cz = min(zs) # Apoyar el suelo exterior en Y = 0.0

# Materiales creados
materials = {{}}
def get_material(tname):
    if tname in materials:
        return materials[tname]
    mat = bpy.data.materials.new(name="Mat_" + tname)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    
    n_out = nodes.new('ShaderNodeOutputMaterial')
    n_bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    links.new(n_bsdf.outputs['BSDF'], n_out.inputs['Surface'])
    
    # Textura
    img_p = os.path.join(TEX_DIR, f"{{tname}}.png")
    if os.path.exists(img_p):
        tex_node = nodes.new('ShaderNodeTexImage')
        tex_node.image = bpy.data.images.load(img_p)
        tex_node.interpolation = 'Closest' # Texturizado clasico retro CS 1.6 pixel-crisp
        links.new(tex_node.outputs['Color'], n_bsdf.inputs['Base Color'])
    
    n_bsdf.inputs['Roughness'].default_value = 0.85
    n_bsdf.inputs['Metallic'].default_value = 0.05
    materials[tname] = mat
    return mat

mesh = bpy.data.meshes.new("CS_Assault_Mesh")
bm = bmesh.new()
uv_layer = bm.loops.layers.uv.new("UVMap")

# Crear vertices en bmesh: en Blender +Z es arriba, igual que en GoldSrc (+Z Up)
# El exportador glTF de Blender convertira automaticamente (+Z Up) a (+Y Up) de Three.js
bm_verts = []
for v in raw_verts:
    bx = (v[0] - cx) * SCALE
    by = (v[1] - cy) * SCALE
    bz = (v[2] - cz) * SCALE
    bm_v = bm.verts.new((bx, by, bz))
    bm_verts.append(bm_v)

bm.verts.ensure_lookup_table()

# Construir caras y asignar materiales / UVs
mat_slot_map = {{}}

for f_idx, f_data in enumerate(faces):
    ti_idx = f_data["texinfo"]
    if ti_idx < 0 or ti_idx >= len(texinfos):
        continue
    ti = texinfos[ti_idx]
    mip_idx = ti["miptex"]
    if mip_idx < 0 or mip_idx >= len(tex_names):
        tname = "null"
    else:
        tname = tex_names[mip_idx]
        
    # Ignorar caras invisibles o de skybox/triggers
    if tname in ["sky", "aaatrigger", "clip", "origin", "null"]:
        continue
        
    poly_verts = []
    poly_orig_coords = []
    firstedge = f_data["firstedge"]
    numedges = f_data["numedges"]
    
    for e in range(numedges):
        se = surfedges[firstedge + e]
        if se >= 0:
            v_idx = edges[se][0]
        else:
            v_idx = edges[-se][1]
        poly_verts.append(bm_verts[v_idx])
        poly_orig_coords.append(raw_verts[v_idx])
        
    if len(poly_verts) < 3:
        continue
        
    # Evitar duplicados consecutivos
    clean_verts = []
    clean_coords = []
    for vi, cv in enumerate(poly_verts):
        if not clean_verts or cv != clean_verts[-1]:
            clean_verts.append(cv)
            clean_coords.append(poly_orig_coords[vi])
    if len(clean_verts) >= 3 and clean_verts[0] == clean_verts[-1]:
        clean_verts.pop()
        clean_coords.pop()
        
    if len(clean_verts) < 3:
        continue
        
    try:
        bm_face = bm.faces.new(clean_verts)
    except Exception:
        continue
        
    # Asignar slot de material
    if tname not in mat_slot_map:
        mat_slot_map[tname] = len(mesh.materials)
        mesh.materials.append(get_material(tname))
    bm_face.material_index = mat_slot_map[tname]
    
    # Calcular coordenadas UV usando vectores s y t de GoldSrc
    tw, th = tex_dims.get(tname, (64, 64))
    s_vec = ti["s"]
    t_vec = ti["t"]
    
    for l_idx, loop in enumerate(bm_face.loops):
        ox, oy, oz = clean_coords[l_idx]
        u = (ox * s_vec[0] + oy * s_vec[1] + oz * s_vec[2] + s_vec[3]) / tw
        v = (ox * t_vec[0] + oy * t_vec[1] + oz * t_vec[2] + t_vec[3]) / th
        loop[uv_layer].uv = (u, 1.0 - v)

bm.to_mesh(mesh)
bm.free()

obj = bpy.data.objects.new("CS_Assault_Map", mesh)
bpy.context.collection.objects.link(obj)

out_glb = os.path.join(MODELS_OUT, "cs_assault.glb")
bpy.ops.export_scene.gltf(filepath=out_glb, export_format='GLB', use_selection=False)
print(f"SUCCESS: Exported cs_assault.glb ({{os.path.getsize(out_glb)}} bytes)")
"""

script_p = os.path.join(ROOT_DIR, "scripts", "temp_convert_assault.py")
with open(script_p, "w", encoding="utf-8") as f:
    f.write(blender_code)

print("Running Blender to build cs_assault.glb...")
cmd = f'& "C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe" -b -P "{script_p}"'
os.system(f'powershell -Command "{cmd}"')
print("Conversion complete!")
