import os
import struct
import subprocess
from PIL import Image

ROOT_DIR = r"c:\Projects\Jarbees_the_game"
CS_ROOT = r"C:\Program Files (x86)\Counter-Strike 1.6"
MODELS_OUT = os.path.join(ROOT_DIR, "public", "models")
BLENDER_EXE = r"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"
SCALE = 0.0254

os.makedirs(MODELS_OUT, exist_ok=True)

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
            if ltype == 0x43:
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

# Pre-load all available WADs
print("Pre-loading all WAD textures...")
wad_cache = {}
for root, dirs, files in os.walk(CS_ROOT):
    for f in files:
        if f.lower().endswith(".wad"):
            wad_cache.update(load_wad_textures(os.path.join(root, f)))
print(f"Total WAD textures in cache: {len(wad_cache)}")

def convert_community_map(map_name, bsp_rel):
    bsp_path = os.path.join(CS_ROOT, bsp_rel)
    tex_dir = os.path.join(ROOT_DIR, "public", "textures", map_name)
    os.makedirs(tex_dir, exist_ok=True)
    out_glb = os.path.join(MODELS_OUT, f"{map_name}.glb")
    
    print(f"\n=======================================================")
    print(f"Processing community map: {map_name} ({bsp_path})...")
    
    with open(bsp_path, "rb") as f:
        ver = struct.unpack("<I", f.read(4))[0]
        lumps = [struct.unpack("<II", f.read(8)) for _ in range(15)]
        
        # 1. Vertices
        f.seek(lumps[3][0])
        raw_verts = [struct.unpack("<fff", f.read(12)) for _ in range(lumps[3][1]//12)]
        
        # 2. Edges
        f.seek(lumps[12][0])
        edges = [struct.unpack("<HH", f.read(4)) for _ in range(lumps[12][1]//4)]
        
        # 3. Surfedges
        f.seek(lumps[13][0])
        surfedges = [struct.unpack("<i", f.read(4))[0] for _ in range(lumps[13][1]//4)]
        
        # 4. Texinfo
        f.seek(lumps[6][0])
        num_ti = lumps[6][1] // 40
        texinfos = []
        for _ in range(num_ti):
            s = struct.unpack("<4f", f.read(16))
            t = struct.unpack("<4f", f.read(16))
            miptex, flags = struct.unpack("<II", f.read(8))
            texinfos.append({"s": s, "t": t, "miptex": miptex, "flags": flags})
            
        # 5. Textures (Embedded or WAD)
        f.seek(lumps[2][0])
        numtex = struct.unpack("<I", f.read(4))[0]
        tex_offsets = [struct.unpack("<i", f.read(4))[0] for _ in range(numtex)]
        tex_names = []
        map_textures = {}
        texture_dims = {}
        
        for off in tex_offsets:
            if off < 0:
                tex_names.append("null")
                continue
            base_pos = lumps[2][0] + off
            f.seek(base_pos)
            name, w, h, off0, off1, off2, off3 = struct.unpack("<16sIIIIII", f.read(40))
            clean_name = name.split(b"\x00")[0].decode("latin-1", errors="ignore").lower()
            tex_names.append(clean_name)
            
            if off0 > 0:
                f.seek(base_pos + off0)
                pix = f.read(w * h)
                f.seek(base_pos + off3 + (w // 8) * (h // 8))
                pal_count = struct.unpack("<H", f.read(2))[0]
                pal_raw = f.read(pal_count * 3)
                img = Image.frombytes("P", (w, h), pix)
                img.putpalette(pal_raw)
                map_textures[clean_name] = img.convert("RGB")
            elif clean_name in wad_cache:
                map_textures[clean_name] = wad_cache[clean_name]
                
        # 6. Faces
        f.seek(lumps[7][0])
        num_faces = lumps[7][1] // 20
        faces = []
        for _ in range(num_faces):
            chunk = f.read(20)
            plane, side, firstedge, numedges, ti = struct.unpack("<hhihh", chunk[:12])
            faces.append({"firstedge": firstedge, "numedges": numedges, "texinfo": ti})
            
    print(f"BSP Stats: {len(raw_verts)} verts, {len(faces)} faces, {len(tex_names)} texture slots")
    
    # Save textures
    for name in set(tex_names):
        out_p = os.path.join(tex_dir, f"{name}.png")
        if name in map_textures:
            map_textures[name].save(out_p)
            texture_dims[name] = map_textures[name].size
        else:
            fallback = Image.new("RGB", (64, 64), (115, 115, 120))
            fallback.save(out_p)
            texture_dims[name] = (64, 64)
            
    print(f"Saved {len(texture_dims)} textures to {tex_dir}")
    
    # Center bounds
    xs = [v[0] for v in raw_verts]
    ys = [v[1] for v in raw_verts]
    zs = [v[2] for v in raw_verts]
    cx = (min(xs) + max(xs)) * 0.5
    cy = (min(ys) + max(ys)) * 0.5
    cz = min(zs)
    
    blender_script = os.path.join(ROOT_DIR, "scripts", f"temp_build_{map_name}.py")
    
    with open(blender_script, "w", encoding="utf-8") as bf:
        bf.write(f'''
import bpy, bmesh, os

bpy.ops.wm.read_factory_settings(use_empty=True)

TEX_DIR = r"{tex_dir}"
OUT_GLB = r"{out_glb}"

raw_verts = {raw_verts}
edges = {edges}
surfedges = {surfedges}
texinfos = {texinfos}
tex_names = {tex_names}
faces = {faces}
tex_dims = {texture_dims}

SCALE = {SCALE}
cx = {cx}
cy = {cy}
cz = {cz}

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
    
    img_p = os.path.join(TEX_DIR, f"{{tname}}.png")
    if os.path.exists(img_p):
        tex_node = nodes.new('ShaderNodeTexImage')
        tex_node.image = bpy.data.images.load(img_p)
        tex_node.interpolation = 'Closest'
        links.new(tex_node.outputs['Color'], n_bsdf.inputs['Base Color'])
    
    n_bsdf.inputs['Roughness'].default_value = 0.85
    n_bsdf.inputs['Metallic'].default_value = 0.05
    materials[tname] = mat
    return mat

mesh = bpy.data.meshes.new("{map_name}_Mesh")
bm = bmesh.new()
uv_layer = bm.loops.layers.uv.new("UVMap")

bm_verts = []
for v in raw_verts:
    bx = (v[0] - cx) * SCALE
    by = (v[1] - cy) * SCALE
    bz = (v[2] - cz) * SCALE
    bm_verts.append(bm.verts.new((bx, by, bz)))

bm.verts.ensure_lookup_table()

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
        
    if tname not in mat_slot_map:
        mat_slot_map[tname] = len(mesh.materials)
        mesh.materials.append(get_material(tname))
    bm_face.material_index = mat_slot_map[tname]
    
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

obj = bpy.data.objects.new("{map_name}_Map", mesh)
bpy.context.collection.objects.link(obj)

bpy.ops.export_scene.gltf(filepath=OUT_GLB, export_format='GLB', use_selection=False)
print(f"SUCCESS: Exported {map_name}.glb ({{os.path.getsize(OUT_GLB)}} bytes)")
''')
    
    print(f"Running Blender headless for {map_name}...")
    subprocess.run([BLENDER_EXE, "-b", "-P", blender_script], check=True)
    if os.path.exists(out_glb):
        print(f"DONE: {out_glb} ready ({os.path.getsize(out_glb)} bytes)")
    if os.path.exists(blender_script):
        os.remove(blender_script)

# Convert de_rats3, de_westwood, fy_iceworld (fy_pool_day already exported)
convert_community_map("de_rats3", r"cstrike\maps\de_rats3.bsp")
convert_community_map("de_westwood", r"cstrike\maps\de_westwood.bsp")
convert_community_map("fy_iceworld", r"cstrike\maps\fy_iceworld.bsp")
print("\nAll community maps converted successfully!")
