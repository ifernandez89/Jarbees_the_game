"""
Build Hall of Armors - Converter for Source Engine Iron Man Armor Pack
Converts Vad36 Iron Man models from I:\\Juegos\\Chonter\\cstrike to WebGL GLB
Models:
1. Mark 42 (t_guerilla)
2. Silver Centurion Mark 33 (t_leet)
3. Heartbreaker Mark 17 (t_phoenix)
4. War Machine Mark 2 (ct_urban)
5. Mark VII (t_arctic)
"""

import os
import sys
import struct
import subprocess
import numpy as np
from PIL import Image

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
MODELS_DIR = os.path.join(PROJECT_ROOT, "public", "models")
TEMP_DIR = os.path.join(SCRIPT_DIR, "_temp_armor_build")
os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

BLENDER_EXE = r"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"

T_PACK = r"I:\Juegos\Chonter\cstrike\models\player\urban\Iron Man T Pack"
CT_PACK = r"I:\Juegos\Chonter\cstrike\models\player\urban\Iron Man CT Pack"

SUITS = [
    {
        "id": "armor_mark42",
        "name": "Mark 42 (Autonome)",
        "mdl_base": os.path.join(T_PACK, "cstrike", "models", "player", "t_guerilla"),
        "tex_base": os.path.join(T_PACK, "cstrike", "materials", "models", "player", "vad36heartbreaker"),
        "diffuse": "42.vtf",
        "normal": "42_n.vtf",
        "illum": "42_i.vtf"
    },
    {
        "id": "armor_silver_centurion",
        "name": "Silver Centurion Mark XXXIII",
        "mdl_base": os.path.join(T_PACK, "cstrike", "models", "player", "t_leet"),
        "tex_base": os.path.join(T_PACK, "cstrike", "materials", "models", "player", "vad36heartbreaker"),
        "diffuse": "sc.vtf",
        "normal": "sc_n.vtf",
        "illum": "sc_i.vtf"
    },
    {
        "id": "armor_heartbreaker",
        "name": "Heartbreaker Mark XVII",
        "mdl_base": os.path.join(T_PACK, "cstrike", "models", "player", "t_phoenix"),
        "tex_base": os.path.join(T_PACK, "cstrike", "materials", "models", "player", "vad36heartbreaker"),
        "diffuse": "heartbreaker_d.vtf",
        "normal": "heartbreaker_n.vtf",
        "illum": "heartbreaker_i.vtf"
    },
    {
        "id": "armor_war_machine",
        "name": "War Machine Mark II",
        "mdl_base": os.path.join(CT_PACK, "cstrike", "models", "player", "ct_urban"),
        "tex_base": os.path.join(CT_PACK, "cstrike", "materials", "models", "player", "vad36heartbreaker"),
        "diffuse": "wm2.vtf",
        "normal": "wm2_n.vtf",
        "illum": None
    },
    {
        "id": "armor_mark7",
        "name": "Mark VII (Heavy Combat)",
        "mdl_base": os.path.join(T_PACK, "cstrike", "models", "player", "t_arctic"),
        "tex_base": os.path.join(T_PACK, "cstrike", "materials", "models", "player", "vad36heartbreaker"),
        "diffuse": "mk7.vtf",
        "normal": "mk7_n.vtf",
        "illum": None
    }
]

def decode_dxt1(data, width, height):
    blocks_x = (width + 3) // 4
    blocks_y = (height + 3) // 4
    img = np.zeros((height, width, 3), dtype=np.uint8)
    offset = 0
    for by in range(blocks_y):
        for bx in range(blocks_x):
            if offset + 8 > len(data):
                break
            c0, c1, mask = struct.unpack('<HHI', data[offset:offset+8])
            offset += 8
            r0 = ((c0 >> 11) & 0x1F) * 255 // 31
            g0 = ((c0 >> 5) & 0x3F) * 255 // 63
            b0 = (c0 & 0x1F) * 255 // 31
            r1 = ((c1 >> 11) & 0x1F) * 255 // 31
            g1 = ((c1 >> 5) & 0x3F) * 255 // 63
            b1 = (c1 & 0x1F) * 255 // 31
            palette = np.array([[r0, g0, b0], [r1, g1, b1], [0, 0, 0], [0, 0, 0]], dtype=np.uint8)
            if c0 > c1:
                palette[2] = ((2 * palette[0] + palette[1]) // 3)
                palette[3] = ((palette[0] + 2 * palette[1]) // 3)
            else:
                palette[2] = ((palette[0] + palette[1]) // 2)
                palette[3] = [0, 0, 0]
            for py in range(4):
                if by * 4 + py >= height:
                    continue
                row_mask = (mask >> (py * 8)) & 0xFF
                for px in range(4):
                    if bx * 4 + px >= width:
                        continue
                    code = (row_mask >> (px * 2)) & 0x03
                    img[by * 4 + py, bx * 4 + px] = palette[code]
    return Image.fromarray(img)

def extract_vtf_to_png(vtf_path, out_png_path):
    if not os.path.exists(vtf_path):
        return None
    with open(vtf_path, 'rb') as f:
        hdr = f.read(65)
        hdr_size = struct.unpack('<I', hdr[12:16])[0]
        w, h = struct.unpack('<HH', hdr[16:20])
        num_mips = struct.unpack('<B', hdr[56:57])[0]
        f.seek(hdr_size)
        total_smaller = 0
        for m in range(num_mips - 1, 0, -1):
            mw = max(1, w >> m)
            mh = max(1, h >> m)
            bx = max(1, (mw + 3) // 4)
            by = max(1, (mh + 3) // 4)
            total_smaller += bx * by * 8
        f.seek(hdr_size + total_smaller)
        bx = max(1, (w + 3) // 4)
        by = max(1, (h + 3) // 4)
        dxt_data = f.read(bx * by * 8)
        img = decode_dxt1(dxt_data, w, h)
        img.save(out_png_path)
        return out_png_path

def extract_mesh_to_obj(vvd_path, vtx_path, out_obj_path):
    with open(vvd_path, 'rb') as f:
        vvd_data = f.read()
    with open(vtx_path, 'rb') as f:
        vtx_data = f.read()

    num_verts = struct.unpack('<8I', vvd_data[16:48])[0]
    vertexDataStart = struct.unpack('<I', vvd_data[56:60])[0]

    verts = []
    normals = []
    uvs = []
    scale = 0.0254 # inches to meters
    
    # Calculate min Z to rest feet exactly on ground plane (Y = 0)
    raw_zs = []
    for i in range(num_verts):
        off = vertexDataStart + i * 48
        pz = struct.unpack('<f', vvd_data[off+24:off+28])[0]
        raw_zs.append(pz)
    min_z = min(raw_zs)

    for i in range(num_verts):
        off = vertexDataStart + i * 48
        px, py, pz = struct.unpack('<3f', vvd_data[off+16:off+28])
        nx, ny, nz = struct.unpack('<3f', vvd_data[off+28:off+40])
        u, v = struct.unpack('<2f', vvd_data[off+40:off+48])
        
        # Shift Z so feet are at ground 0.0
        y_up = (pz - min_z) * scale
        x_m = px * scale
        z_m = -py * scale
        verts.append((x_m, y_up, z_m))
        normals.append((nx, nz, -ny))
        uvs.append((u, 1.0 - v))

    bodyPartOffset = struct.unpack('<I', vtx_data[32:36])[0]
    numModels, modelOffset = struct.unpack('<ii', vtx_data[bodyPartOffset:bodyPartOffset+8])
    m_off = bodyPartOffset + modelOffset
    numLODs, lodOffset = struct.unpack('<ii', vtx_data[m_off:m_off+8])
    lod0_off = m_off + lodOffset
    numMeshes, meshOffset, switchPoint = struct.unpack('<iif', vtx_data[lod0_off:lod0_off+12])

    faces = []
    for m_idx in range(numMeshes):
        mesh_off = lod0_off + meshOffset + m_idx * 9
        numStripGroups, stripGroupHeaderOffset, flags = struct.unpack('<iib', vtx_data[mesh_off:mesh_off+9])
        for sg_idx in range(numStripGroups):
            sg_off = mesh_off + stripGroupHeaderOffset + sg_idx * 25
            numVerts, vertOffset, numIndices, indexOffset, numStrips, stripOffset, sg_flags = struct.unpack('<iiiiiiB', vtx_data[sg_off:sg_off+25])
            v_start = sg_off + vertOffset
            orig_ids = []
            for vi in range(numVerts):
                orig_id = struct.unpack('<H', vtx_data[v_start + vi*9 + 4 : v_start + vi*9 + 6])[0]
                orig_ids.append(orig_id)

            i_start = sg_off + indexOffset
            indices = struct.unpack(f'<{numIndices}H', vtx_data[i_start : i_start + numIndices * 2])
            for t in range(0, numIndices, 3):
                i0 = orig_ids[indices[t]] + 1
                i1 = orig_ids[indices[t+1]] + 1
                i2 = orig_ids[indices[t+2]] + 1
                faces.append((i0, i1, i2))

    with open(out_obj_path, 'w') as f:
        f.write('# Iron Man Mesh Extracted for JarBees Hall of Armors\n')
        for v in verts:
            f.write(f'v {v[0]:.5f} {v[1]:.5f} {v[2]:.5f}\n')
        for vt in uvs:
            f.write(f'vt {vt[0]:.5f} {vt[1]:.5f}\n')
        for vn in normals:
            f.write(f'vn {vn[0]:.5f} {vn[1]:.5f} {vn[2]:.5f}\n')
        for tri in faces:
            f.write(f'f {tri[0]}/{tri[0]}/{tri[0]} {tri[1]}/{tri[1]}/{tri[1]} {tri[2]}/{tri[2]}/{tri[2]}\n')

    return len(verts), len(faces)

def build_glb_with_blender(suit_id, obj_path, diff_png, norm_png, illum_png, out_glb_path):
    blender_script = os.path.join(TEMP_DIR, f"build_{suit_id}.py")
    script_content = f"""
import bpy

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.wm.obj_import(filepath=r'{obj_path}')

obj = bpy.context.selected_objects[0]
obj.name = '{suit_id}'
bpy.context.view_layer.objects.active = obj

mat = bpy.data.materials.new(name='Mat_{suit_id}')
mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
bsdf = nodes.get('Principled BSDF')

# Metalic & Roughness
bsdf.inputs['Metallic'].default_value = 0.85
bsdf.inputs['Roughness'].default_value = 0.28

# Diffuse
if r'{diff_png}' and r'{diff_png}' != 'None':
    tex_diff = nodes.new('ShaderNodeTexImage')
    tex_diff.image = bpy.data.images.load(r'{diff_png}')
    links.new(tex_diff.outputs['Color'], bsdf.inputs['Base Color'])

# Normal Map
if r'{norm_png}' and r'{norm_png}' != 'None':
    tex_norm = nodes.new('ShaderNodeTexImage')
    tex_norm.image = bpy.data.images.load(r'{norm_png}')
    tex_norm.image.colorspace_settings.name = 'Non-Color'
    norm_node = nodes.new('ShaderNodeNormalMap')
    norm_node.inputs['Strength'].default_value = 1.0
    links.new(tex_norm.outputs['Color'], norm_node.inputs['Color'])
    links.new(norm_node.outputs['Normal'], bsdf.inputs['Normal'])

# Emission / Arc Reactor
if r'{illum_png}' and r'{illum_png}' != 'None':
    tex_illum = nodes.new('ShaderNodeTexImage')
    tex_illum.image = bpy.data.images.load(r'{illum_png}')
    links.new(tex_illum.outputs['Color'], bsdf.inputs['Emission Color'])
    bsdf.inputs['Emission Strength'].default_value = 3.0

obj.data.materials.clear()
obj.data.materials.append(mat)

bpy.ops.export_scene.gltf(
    filepath=r'{out_glb_path}',
    export_format='GLB',
    export_image_format='AUTO'
)
print('SUCCESS_GLB')
"""
    with open(blender_script, 'w') as f:
        f.write(script_content)

    res = subprocess.run([BLENDER_EXE, "--background", "--python", blender_script], capture_output=True, text=True)
    if "SUCCESS_GLB" not in res.stdout:
        print("Blender error:", res.stderr)
        return False
    return True

def main():
    print("==================================================")
    print(" JarBees: Building Hall of Armors Models for Auren")
    print("==================================================")
    
    catalog = []
    for suit in SUITS:
        sid = suit["id"]
        print(f"\n[Suit] {suit['name']} ({sid})...")
        vvd = suit["mdl_base"] + ".vvd"
        vtx = suit["mdl_base"] + ".dx90.vtx"
        
        if not os.path.exists(vvd) or not os.path.exists(vtx):
            print(f"  [Error] VVD or VTX missing for {sid}")
            continue
            
        obj_path = os.path.join(TEMP_DIR, f"{sid}.obj")
        nv, nf = extract_mesh_to_obj(vvd, vtx, obj_path)
        print(f"  Extracted mesh: {nv} verts, {nf} faces")
        
        diff_vtf = os.path.join(suit["tex_base"], suit["diffuse"])
        diff_png = os.path.join(TEMP_DIR, f"{sid}_diff.png")
        extract_vtf_to_png(diff_vtf, diff_png)
        print(f"  Decoded diffuse: {diff_png}")
        
        norm_png = None
        if suit["normal"]:
            norm_vtf = os.path.join(suit["tex_base"], suit["normal"])
            norm_png = os.path.join(TEMP_DIR, f"{sid}_norm.png")
            if not extract_vtf_to_png(norm_vtf, norm_png):
                norm_png = None
            else:
                print(f"  Decoded normal map: {norm_png}")
                
        illum_png = None
        if suit["illum"]:
            illum_vtf = os.path.join(suit["tex_base"], suit["illum"])
            illum_png = os.path.join(TEMP_DIR, f"{sid}_illum.png")
            if not extract_vtf_to_png(illum_vtf, illum_png):
                illum_png = None
            else:
                print(f"  Decoded illum map: {illum_png}")
                
        out_glb = os.path.join(MODELS_DIR, f"{sid}.glb")
        ok = build_glb_with_blender(sid, obj_path, diff_png, norm_png, illum_png, out_glb)
        if ok and os.path.exists(out_glb):
            size_kb = os.path.getsize(out_glb) / 1024
            print(f"  [SUCCESS] Generated {sid}.glb ({size_kb:.1f} KB)")
            catalog.append({
                "id": sid,
                "name": suit["name"],
                "file": f"/models/{sid}.glb",
                "size_kb": round(size_kb, 1),
                "verts": nv,
                "faces": nf
            })
            
    print("\n==================================================")
    print(f" Finished generating {len(catalog)} armors!")
    for c in catalog:
        print(f"  - {c['name']} -> {c['file']} ({c['size_kb']} KB)")
    print("==================================================")

if __name__ == "__main__":
    main()
