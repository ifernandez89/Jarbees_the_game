import os
import sys
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
    try:
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
    except Exception as e:
        pass
    return textures

# Cache WAD textures
wad_cache = {}
for root, dirs, files in os.walk(CS_ROOT):
    for f in files:
        if f.lower().endswith(".wad"):
            wad_cache.update(load_wad_textures(os.path.join(root, f)))

def convert_bsp(bsp_path, map_name):
    tex_dir = os.path.join(ROOT_DIR, "public", "textures", map_name)
    os.makedirs(tex_dir, exist_ok=True)
    out_glb = os.path.join(MODELS_OUT, f"{map_name}.glb")
    
    print(f"\nProcessing BSP: {bsp_path} -> {out_glb}")
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
            
        # 5. Textures
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

    print(f"Stats: {len(raw_verts)} verts, {len(faces)} faces, {len(tex_names)} texture slots")
    for name in set(tex_names):
        out_p = os.path.join(tex_dir, f"{name}.png")
        if name in map_textures:
            map_textures[name].save(out_p)
            texture_dims[name] = map_textures[name].size
        else:
            fallback = Image.new("RGB", (64, 64), (115, 115, 120))
            fallback.save(out_p)
            texture_dims[name] = (64, 64)

    # Center bounds
    xs = [v[0] for v in raw_verts]
    ys = [v[1] for v in raw_verts]
    zs = [v[2] for v in raw_verts]
    cx = (min(xs) + max(xs)) / 2.0
    cy = (min(ys) + max(ys)) / 2.0
    cz = min(zs)
    
    verts_scaled = [((v[0] - cx) * SCALE, (v[2] - cz) * SCALE, -(v[1] - cy) * SCALE) for v in raw_verts]
    
    blender_script = os.path.join(ROOT_DIR, "scripts", f"temp_build_{map_name}.py")
    with open(blender_script, "w", encoding="utf-8") as f:
        f.write(f'''
import bpy
import bmesh
import os

bpy.ops.wm.read_factory_settings(use_empty=True)

verts = {verts_scaled}
faces_raw = []
edges = {edges}
surfedges = {surfedges}
texinfos = {texinfos}
tex_names = {tex_names}
texture_dims = {texture_dims}
tex_dir = r"{tex_dir}"

faces_data = {faces}

mesh = bpy.data.meshes.new("{map_name}_mesh")
obj = bpy.data.objects.new("{map_name}_obj", mesh)
bpy.context.collection.objects.link(obj)

bm = bmesh.new()
bm_verts = [bm.verts.new(v) for v in verts]
bm.verts.ensure_lookup_table()

materials = {{}}
def get_or_create_mat(tname):
    if tname in materials:
        return materials[tname]
    mat = bpy.data.materials.new(name=tname)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    tex_path = os.path.join(tex_dir, tname + ".png")
    if os.path.exists(tex_path):
        tex_node = mat.node_tree.nodes.new("ShaderNodeTexImage")
        tex_node.image = bpy.data.images.load(tex_path)
        mat.node_tree.links.new(bsdf.inputs['Base Color'], tex_node.outputs['Color'])
    if bsdf:
        bsdf.inputs['Roughness'].default_value = 0.8
        bsdf.inputs['Specular IOR Level'].default_value = 0.2
    obj.data.materials.append(mat)
    idx = len(obj.data.materials) - 1
    materials[tname] = (mat, idx)
    return materials[tname]

uv_layer = bm.loops.layers.uv.new("UVMap")

for f_idx, face in enumerate(faces_data):
    ti_idx = face["texinfo"]
    if ti_idx < 0 or ti_idx >= len(texinfos):
        continue
    ti = texinfos[ti_idx]
    mip = ti["miptex"]
    if mip < 0 or mip >= len(tex_names):
        continue
    tname = tex_names[mip]
    if tname in ["aaatrigger", "sky", "null", "clip", "nodraw", "origin"]:
        continue
        
    _, mat_idx = get_or_create_mat(tname)
    tw, th = texture_dims.get(tname, (64, 64))
    
    fe = face["firstedge"]
    ne = face["numedges"]
    poly_verts = []
    for i in range(ne):
        se = surfedges[fe + i]
        if se > 0:
            poly_verts.append(bm_verts[edges[se][0]])
        else:
            poly_verts.append(bm_verts[edges[-se][1]])
            
    if len(poly_verts) < 3:
        continue
        
    try:
        bm_face = bm.faces.new(poly_verts)
        bm_face.material_index = mat_idx
        for loop in bm_face.loops:
            orig_v = verts_scaled[loop.vert.index]
            bx = orig_v[0] / {SCALE} + {cx}
            by = -orig_v[2] / {SCALE} + {cy}
            bz = orig_v[1] / {SCALE} + {cz}
            
            u = (bx * ti["s"][0] + by * ti["s"][1] + bz * ti["s"][2] + ti["s"][3]) / tw
            v = 1.0 - (bx * ti["t"][0] + by * ti["t"][1] + bz * ti["t"][2] + ti["t"][3]) / th
            loop[uv_layer].uv = (u, v)
    except Exception:
        pass

bm.to_mesh(mesh)
bm.free()

bpy.ops.export_scene.gltf(
    filepath=r"{out_glb}",
    export_format='GLB',
    use_selection=False,
    export_apply=True
)
print("SUCCESSFULLY EXPORTED TO:", r"{out_glb}")
''')

    cmd = [BLENDER_EXE, "-b", "--python", blender_script]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if "SUCCESSFULLY EXPORTED" in res.stdout:
        size_mb = os.path.getsize(out_glb) / (1024 * 1024)
        print(f"===> SUCESS! {out_glb} ({size_mb:.2f} MB)")
    else:
        print("Blender output:", res.stdout[-500:])
        print("Blender error:", res.stderr[-500:])

if __name__ == "__main__":
    if len(sys.argv) > 2:
        convert_bsp(sys.argv[1], sys.argv[2])
