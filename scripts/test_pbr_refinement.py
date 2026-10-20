import bpy
import bmesh
import math
import mathutils
import numpy as np
import os

bpy.ops.wm.read_factory_settings(use_empty=True)

BASE_DIR = r'c:\Projects\Jarbees_the_game'
MODELS_DIR = os.path.join(BASE_DIR, 'assets_source', 'models')
SRC_GLB = os.path.join(MODELS_DIR, 'iron_man.glb')
SRC_HELMET = os.path.join(MODELS_DIR, 'crude_gladiator_helmet.glb')
ARMOR_DIR = os.path.join(MODELS_DIR, 'berserker-orc-armor-cosplay')
CUIRASS_GLB = os.path.join(MODELS_DIR, 'armor_plate.glb')

# 1. Import base suit
bpy.ops.import_scene.gltf(filepath=SRC_GLB)
arm = [o for o in bpy.context.scene.objects if o.type == 'ARMATURE'][0]
bpy.context.view_layer.objects.active = arm

# -------------------------------------------------------------------
# AUREN / NEXO: SYNTHETIC CERAMIC & GRAPHITE MATERIAL SYSTEM
# -------------------------------------------------------------------
def tint_existing_texture(img, target_rgb, contrast=1.1, brightness=1.3):
    if not img or img.size[0] == 0:
        return
    w, h = img.size
    arr = np.zeros(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(arr)
    rgb = arr.reshape(-1, 4)[:, :3]
    lum = 0.299 * rgb[:, 0] + 0.587 * rgb[:, 1] + 0.114 * rgb[:, 2]
    mean_lum = max(float(np.mean(lum)), 0.001)
    norm_lum = np.power(np.maximum(lum / mean_lum, 0.0), contrast) * brightness
    tinted = norm_lum[:, None] * target_rgb[None, :]
    np.clip(tinted, 0.0, 1.0, out=tinted)
    arr.reshape(-1, 4)[:, :3] = tinted
    img.pixels.foreach_set(arr)
    img.update()

# Target colors (Linear sRGB)
# Primary: Pearlescent Synthetic Ceramic / Satin Deep Petroleum (#132A3E)
col_ceramic_petroleum = np.array([0x13 / 255.0, 0x2A / 255.0, 0x3E / 255.0], dtype=np.float32)
# Secondary: Deep Satin Amethyst / Violet Composite (#2E1C4B)
col_violet_composite  = np.array([0x2E / 255.0, 0x1C / 255.0, 0x4B / 255.0], dtype=np.float32)
# Mechanics: Dark Graphite & Brushed Cold Titanium (#202428 & #A4C0D2)
col_graphite          = np.array([0x22 / 255.0, 0x26 / 255.0, 0x2C / 255.0], dtype=np.float32)
col_titanium          = np.array([0xA4 / 255.0, 0xC0 / 255.0, 0xD2 / 255.0], dtype=np.float32)
# Photonic Circuitry: Cognitive Pulse Cyan (#36DBE8)
col_photonic_cyan     = (0x36 / 255.0, 0xDB / 255.0, 0xE8 / 255.0, 1.0)

# Process Red_Part -> Pearlescent Synthetic Ceramic
mat_red = bpy.data.materials.get('Red_Part')
if mat_red and mat_red.node_tree:
    bsdf = mat_red.node_tree.nodes.get('Principled BSDF')
    tex_node = [n for n in mat_red.node_tree.nodes if n.type == 'TEX_IMAGE' and n.name == 'Image Texture']
    if tex_node and tex_node[0].image:
        tint_existing_texture(tex_node[0].image, col_ceramic_petroleum, contrast=1.12, brightness=1.35)
    if bsdf:
        # Synthetic ceramic: semi-metallic satin sheen (not cheap chrome)
        bsdf.inputs['Metallic'].default_value = 0.32
        bsdf.inputs['Roughness'].default_value = 0.30

# Process Gold_Part -> Deep Satin Amethyst Composite
mat_gold = bpy.data.materials.get('Gold_Part')
if mat_gold and mat_gold.node_tree:
    bsdf = mat_gold.node_tree.nodes.get('Principled BSDF')
    tex_node = [n for n in mat_gold.node_tree.nodes if n.type == 'TEX_IMAGE' and n.name == 'Image Texture']
    if tex_node and tex_node[0].image:
        tint_existing_texture(tex_node[0].image, col_violet_composite, contrast=1.15, brightness=1.45)
    if bsdf:
        bsdf.inputs['Metallic'].default_value = 0.40
        bsdf.inputs['Roughness'].default_value = 0.28

# Process Silver_Part -> Mechanical Graphite & Cold Titanium Chassis
mat_silver = bpy.data.materials.get('Silver_Part')
if mat_silver and mat_silver.node_tree:
    bsdf = mat_silver.node_tree.nodes.get('Principled BSDF')
    tex_node = [n for n in mat_silver.node_tree.nodes if n.type == 'TEX_IMAGE' and n.name == 'Image Texture']
    if tex_node and tex_node[0].image:
        tint_existing_texture(tex_node[0].image, col_titanium, contrast=1.05, brightness=1.20)
    if bsdf:
        bsdf.inputs['Metallic'].default_value = 0.88
        bsdf.inputs['Roughness'].default_value = 0.22

# Process Arc_Reactor -> Hidden/Encapsulated Mechanical Core (Dark Graphite)
mat_reactor = bpy.data.materials.get('Arc_Reactor')
if mat_reactor and mat_reactor.node_tree:
    bsdf = mat_reactor.node_tree.nodes.get('Principled BSDF')
    if bsdf:
        bsdf.inputs['Base Color'].default_value = (0.05, 0.05, 0.07, 1.0)
        bsdf.inputs['Metallic'].default_value = 0.85
        bsdf.inputs['Roughness'].default_value = 0.35

# Process Lights -> Subtle Photonic Cognitive Illumination (No harsh glare)
mat_lights = bpy.data.materials.get('Lights')
if mat_lights and mat_lights.node_tree:
    bsdf = mat_lights.node_tree.nodes.get('Principled BSDF')
    if bsdf:
        bsdf.inputs['Base Color'].default_value = col_photonic_cyan
        if 'Emission Color' in bsdf.inputs:
            bsdf.inputs['Emission Color'].default_value = col_photonic_cyan
        if 'Emission Strength' in bsdf.inputs:
            bsdf.inputs['Emission Strength'].default_value = 2.2

# 2. Retract original Iron Man head into skull cavity
head_vg_name = 'mixamorig:Head_06'
head_verts = []
for obj in bpy.context.scene.objects:
    if obj.type == 'MESH' and head_vg_name in obj.vertex_groups:
        vg_idx = obj.vertex_groups[head_vg_name].index
        mat = obj.matrix_world
        for v in obj.data.vertices:
            for g in v.groups:
                if g.group == vg_idx and g.weight > 0.4:
                    head_verts.append((obj, v, mat @ v.co))

head_center = sum([co for _, _, co in head_verts], mathutils.Vector()) / len(head_verts)
for obj, v, co in head_verts:
    delta = (co - head_center) * 0.35
    v.co = obj.matrix_world.inverted() @ (head_center + delta)

# 3. Import and fit Gladiator Helmet + Cyber Visor
existing_objs = set(bpy.context.scene.objects)
bpy.ops.import_scene.gltf(filepath=SRC_HELMET)
helmet_imported = [o for o in bpy.context.scene.objects if o not in existing_objs]
helmet_meshes = [o for o in helmet_imported if o.type == 'MESH']
for o in helmet_meshes:
    mw = o.matrix_world.copy()
    o.parent = None
    o.matrix_world = mw
for o in helmet_imported:
    if o.type == 'EMPTY':
        bpy.data.objects.remove(o, do_unlink=True)

# Unify helmet
bpy.ops.object.select_all(action='DESELECT')
for o in helmet_meshes:
    o.select_set(True)
bpy.context.view_layer.objects.active = helmet_meshes[0]
bpy.ops.object.join()
helmet_obj = bpy.context.view_layer.objects.active
helmet_obj.name = "JarBees_Gladiator_Helmet"

SCALE = 0.098
mat_rot = mathutils.Matrix.Rotation(math.radians(-90.0), 4, 'Z') @ mathutils.Matrix.Rotation(math.radians(-5.0), 4, 'X')
mat_scale = mathutils.Matrix.Scale(SCALE, 4)
helmet_obj.data.transform(mat_scale @ mat_rot)
helmet_obj.matrix_world = mathutils.Matrix.Identity(4)

xs = [v.co.x for v in helmet_obj.data.vertices]
ys = [v.co.y for v in helmet_obj.data.vertices]
zs = [v.co.z for v in helmet_obj.data.vertices]
actual_center_x = (min(xs) + max(xs)) / 2.0
actual_center_y = (min(ys) + max(ys)) / 2.0
actual_center_z = (min(zs) + max(zs)) / 2.0

mat_trans = mathutils.Matrix.Translation(mathutils.Vector((
    head_center.x - actual_center_x,
    (head_center.y - 0.022) - actual_center_y,
    (head_center.z - 0.062) - actual_center_z
)))
helmet_obj.data.transform(mat_trans)

# Tint helmet materials with synthetic ceramic & titanium
for mat in bpy.data.materials:
    if 'SkullC' in mat.name or mat.name == 'material' or 'material.' in mat.name:
        for node in getattr(mat.node_tree, 'nodes', []):
            if node.type == 'TEX_IMAGE' and node.image:
                tint_existing_texture(node.image, col_ceramic_petroleum, contrast=1.1, brightness=1.5)
        bsdf = mat.node_tree.nodes.get('Principled BSDF')
        if bsdf:
            bsdf.inputs['Metallic'].default_value = 0.35
            bsdf.inputs['Roughness'].default_value = 0.28
    elif 'FaceP' in mat.name and 'TFaceP' not in mat.name:
        for node in getattr(mat.node_tree, 'nodes', []):
            if node.type == 'TEX_IMAGE' and node.image:
                tint_existing_texture(node.image, col_violet_composite, contrast=1.15, brightness=1.6)
        bsdf = mat.node_tree.nodes.get('Principled BSDF')
        if bsdf:
            bsdf.inputs['Metallic'].default_value = 0.40
            bsdf.inputs['Roughness'].default_value = 0.26
    elif 'TFaceP' in mat.name or 'TopSpike' in mat.name or 'Rivet' in mat.name:
        for node in getattr(mat.node_tree, 'nodes', []):
            if node.type == 'TEX_IMAGE' and node.image:
                tint_existing_texture(node.image, col_titanium, contrast=1.05, brightness=1.3)
        bsdf = mat.node_tree.nodes.get('Principled BSDF')
        if bsdf:
            bsdf.inputs['Metallic'].default_value = 0.90
            bsdf.inputs['Roughness'].default_value = 0.18

# Cyber Visor HUD behind T-face opening
mesh_visor = bpy.data.meshes.new('JarBees_CyberVisor_Mesh')
bm_v = bmesh.new()
vx_center, vy_center, vz_center = head_center.x, head_center.y - 0.065, head_center.z - 0.020
h_vis = 0.022
for ang_deg in range(-35, 40, 10):
    rad = math.radians(ang_deg)
    r = 0.062
    x = vx_center + r * math.sin(rad)
    y = vy_center - r * (1.0 - math.cos(rad)) * 0.5
    top = bm_v.verts.new((x, y, vz_center + h_vis / 2.0))
    bot = bm_v.verts.new((x, y, vz_center - h_vis / 2.0))
bm_v.verts.ensure_lookup_table()
for i in range(0, len(bm_v.verts) - 2, 2):
    bm_v.faces.new((bm_v.verts[i], bm_v.verts[i+2], bm_v.verts[i+3], bm_v.verts[i+1]))
bm_v.to_mesh(mesh_visor)
bm_v.free()
obj_visor = bpy.data.objects.new('JarBees_CyberVisor', mesh_visor)
bpy.context.scene.collection.objects.link(obj_visor)

mat_visor = bpy.data.materials.new(name="JarBees_Visor_Cyan")
mat_visor.use_nodes = True
b_vis = mat_visor.node_tree.nodes.get('Principled BSDF')
b_vis.inputs['Base Color'].default_value = col_photonic_cyan
b_vis.inputs['Roughness'].default_value = 0.08
b_vis.inputs['Metallic'].default_value = 0.05
if 'Emission Color' in b_vis.inputs:
    b_vis.inputs['Emission Color'].default_value = col_photonic_cyan
if 'Emission Strength' in b_vis.inputs:
    b_vis.inputs['Emission Strength'].default_value = 3.2
obj_visor.data.materials.append(mat_visor)

# 4. Import Berserker add-on plates (Belts, Gauntlets, Greaves)
def load_stl(filename, target_h, decimate=0.25):
    filepath = os.path.join(ARMOR_DIR, filename)
    if hasattr(bpy.ops.wm, 'stl_import'):
        bpy.ops.wm.stl_import(filepath=filepath)
    else:
        bpy.ops.import_mesh.stl(filepath=filepath)
    o = bpy.context.selected_objects[0]
    if decimate < 1.0 and len(o.data.vertices) > 1000:
        mod = o.modifiers.new(name='Dec', type='DECIMATE')
        mod.ratio = decimate
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.modifier_apply(modifier='Dec')
    xs = [v.co.x for v in o.data.vertices]
    ys = [v.co.y for v in o.data.vertices]
    zs = [v.co.z for v in o.data.vertices]
    cx, cy, cz = (min(xs)+max(xs))/2, (min(ys)+max(ys))/2, (min(zs)+max(zs))/2
    scale = target_h / (max(zs) - min(zs))
    for v in o.data.vertices:
        v.co.x = (v.co.x - cx) * scale
        v.co.y = (v.co.y - cy) * scale
        v.co.z = (v.co.z - cz) * scale
    return o

mat_titanium_pbr = bpy.data.materials.new(name="JarBees_Titanium_Armor")
mat_titanium_pbr.use_nodes = True
b = mat_titanium_pbr.node_tree.nodes.get('Principled BSDF')
b.inputs['Base Color'].default_value = (col_titanium[0], col_titanium[1], col_titanium[2], 1.0)
b.inputs['Metallic'].default_value = 0.90
b.inputs['Roughness'].default_value = 0.20

mat_violet_pbr = bpy.data.materials.new(name="JarBees_Violet_Armor")
mat_violet_pbr.use_nodes = True
b = mat_violet_pbr.node_tree.nodes.get('Principled BSDF')
b.inputs['Base Color'].default_value = (col_violet_composite[0], col_violet_composite[1], col_violet_composite[2], 1.0)
b.inputs['Metallic'].default_value = 0.40
b.inputs['Roughness'].default_value = 0.28

mat_petroleum_pbr = bpy.data.materials.new(name="JarBees_Petroleum_Armor")
mat_petroleum_pbr.use_nodes = True
b = mat_petroleum_pbr.node_tree.nodes.get('Principled BSDF')
b.inputs['Base Color'].default_value = (col_ceramic_petroleum[0], col_ceramic_petroleum[1], col_ceramic_petroleum[2], 1.0)
b.inputs['Metallic'].default_value = 0.35
b.inputs['Roughness'].default_value = 0.30

# Pelvic belt buckle
obj_belt = load_stl('Belt_Buckle.stl', 0.14)
obj_belt.data.transform(mathutils.Matrix.Translation(mathutils.Vector((0, -0.155, 0.065))) @ mathutils.Matrix.Rotation(math.radians(-6.0), 4, 'X'))
obj_belt.data.materials.append(mat_titanium_pbr)

# Gauntlets
obj_hand_l = load_stl('Hand_Guard_-_left.stl', 0.18)
obj_hand_l.data.transform(mathutils.Matrix.Translation(mathutils.Vector((0.445, 0.020, 0.195))) @ mathutils.Euler((math.radians(45.0), math.radians(-50.0), math.radians(40.0))).to_matrix().to_4x4())
obj_hand_l.data.materials.append(mat_titanium_pbr)

obj_hand_r = load_stl('Hand_Guard_-_Right.stl', 0.18)
obj_hand_r.data.transform(mathutils.Matrix.Translation(mathutils.Vector((-0.445, 0.020, 0.195))) @ mathutils.Euler((math.radians(45.0), math.radians(50.0), math.radians(-40.0))).to_matrix().to_4x4())
obj_hand_r.data.materials.append(mat_titanium_pbr)

# Biceps
obj_bicep_l = load_stl('shin_-_left.stl', 0.20)
obj_bicep_l.data.transform(mathutils.Matrix.Translation(mathutils.Vector((0.325, 0.060, 0.420))) @ mathutils.Euler((math.radians(20.0), math.radians(-40.0), math.radians(15.0))).to_matrix().to_4x4())
obj_bicep_l.data.materials.append(mat_violet_pbr)

obj_bicep_r = load_stl('shin_-_right.stl', 0.20)
obj_bicep_r.data.transform(mathutils.Matrix.Translation(mathutils.Vector((-0.325, 0.060, 0.420))) @ mathutils.Euler((math.radians(20.0), math.radians(40.0), math.radians(-15.0))).to_matrix().to_4x4())
obj_bicep_r.data.materials.append(mat_violet_pbr)

# Elbows
obj_elbow_l = load_stl('elbow_cap_-_left.stl', 0.09)
obj_elbow_l.data.transform(mathutils.Matrix.Translation(mathutils.Vector((0.330, 0.045, 0.300))) @ mathutils.Euler((math.radians(-15), math.radians(20), math.radians(-25))).to_matrix().to_4x4())
obj_elbow_l.data.materials.append(mat_violet_pbr)

obj_elbow_r = load_stl('elbow_cap_-_right.stl', 0.09)
obj_elbow_r.data.transform(mathutils.Matrix.Translation(mathutils.Vector((-0.330, 0.045, 0.300))) @ mathutils.Euler((math.radians(-15), math.radians(-20), math.radians(25))).to_matrix().to_4x4())
obj_elbow_r.data.materials.append(mat_violet_pbr)

# Boots
obj_boot_l = load_stl('foot_-_left.stl', 0.52)
obj_boot_l.data.transform(mathutils.Matrix.Translation(mathutils.Vector((0.132, 0.025, -0.680))) @ mathutils.Euler((math.radians(-4), 0, 0)).to_matrix().to_4x4())
obj_boot_l.data.materials.append(mat_petroleum_pbr)

obj_boot_r = load_stl('foot_-_right.stl', 0.52)
obj_boot_r.data.transform(mathutils.Matrix.Translation(mathutils.Vector((-0.132, 0.025, -0.680))) @ mathutils.Euler((math.radians(-4), 0, 0)).to_matrix().to_4x4())
obj_boot_r.data.materials.append(mat_petroleum_pbr)

# Dorsal Stabilizer Wings
mesh_wings = bpy.data.meshes.new('JarBees_DorsalWings_Mesh')
bm_w = bmesh.new()
for side in [-1, 1]:
    w_root_top = bm_w.verts.new((side * 0.055, 0.125, 0.540))
    w_root_bot = bm_w.verts.new((side * 0.045, 0.120, 0.450))
    w_tip_top  = bm_w.verts.new((side * 0.145, 0.225, 0.590))
    w_tip_bot  = bm_w.verts.new((side * 0.115, 0.185, 0.440))
    bm_w.faces.new((w_root_top, w_tip_top, w_tip_bot, w_root_bot))
r_w = bmesh.ops.extrude_face_region(bm_w, geom=bm_w.faces)
for v in [e for e in r_w['geom'] if isinstance(e, bmesh.types.BMVert)]:
    v.co.x += (0.006 if v.co.x > 0 else -0.006)
bm_w.to_mesh(mesh_wings)
bm_w.free()
obj_wings = bpy.data.objects.new('JarBees_DorsalWings', mesh_wings)
bpy.context.scene.collection.objects.link(obj_wings)
obj_wings.data.materials.append(mat_petroleum_pbr)

# -------------------------------------------------------------------
# 5. IMPORT AND FIT THE MEDIEVAL TIME-TRAVEL ANGEL CUIRASS
# -------------------------------------------------------------------
existing_objs = set(bpy.context.scene.objects)
bpy.ops.import_scene.gltf(filepath=CUIRASS_GLB)
cuirass_imported = [o for o in bpy.context.scene.objects if o not in existing_objs]
cuirass_mesh = [o for o in cuirass_imported if o.type == 'MESH'][0]

mw = cuirass_mesh.matrix_world.copy()
cuirass_mesh.parent = None
cuirass_mesh.matrix_world = mw

for o in cuirass_imported:
    if o.type == 'EMPTY':
        bpy.data.objects.remove(o, do_unlink=True)

cuirass_mesh.name = "JarBees_Medieval_Angel_Cuirass"

xs = [(cuirass_mesh.matrix_world @ v.co).x for v in cuirass_mesh.data.vertices]
ys = [(cuirass_mesh.matrix_world @ v.co).y for v in cuirass_mesh.data.vertices]
zs = [(cuirass_mesh.matrix_world @ v.co).z for v in cuirass_mesh.data.vertices]

w_orig = max(xs) - min(xs)
d_orig = max(ys) - min(ys)
h_orig = max(zs) - min(zs)
cx = (min(xs) + max(xs)) / 2.0
cy = (min(ys) + max(ys)) / 2.0
cz = (min(zs) + max(zs)) / 2.0

# Calibrated dimensions:
# Width across pectorals = 0.355 m
# Height = 0.405 m
# Depth = 0.220 m
scale_x = 0.355 / w_orig
scale_z = 0.405 / h_orig
scale_y = 0.220 / d_orig

for v in cuirass_mesh.data.vertices:
    p = cuirass_mesh.matrix_world @ v.co
    v.co.x = (p.x - cx) * scale_x
    v.co.y = (p.y - cy) * scale_y
    v.co.z = (p.z - cz) * scale_z

cuirass_mesh.matrix_world = mathutils.Matrix.Identity(4)

# Pitch rotation (forward tilt) and alignment flush over sternum and neck
m_rot = mathutils.Euler((math.radians(9.5), 0, 0)).to_matrix().to_4x4()
m_trans = mathutils.Matrix.Translation(mathutils.Vector((0.000, -0.078, 0.365)))
cuirass_mesh.data.transform(m_trans @ m_rot)
cuirass_mesh.matrix_world = mathutils.Matrix.Identity(4)

# Enhance the Cuirass Material PBR parameters:
# Relic hand-forged antique steel with brass rivets
mat_cuirass = cuirass_mesh.data.materials[0] if cuirass_mesh.data.materials else None
if mat_cuirass and mat_cuirass.node_tree:
    bsdf_c = mat_cuirass.node_tree.nodes.get('Principled BSDF')
    if bsdf_c:
        # Metallic steel relic
        bsdf_c.inputs['Metallic'].default_value = 0.90
        bsdf_c.inputs['Roughness'].default_value = 0.28

# -------------------------------------------------------------------
# 6. RIGGING INTEGRAL TO MIXAMO ARMATURE
# -------------------------------------------------------------------
inv_arm_mat = arm.matrix_world.inverted()

single_rig = [
    (helmet_obj,   'mixamorig:Head_06'),
    (obj_visor,    'mixamorig:Head_06'),
    (obj_wings,    'mixamorig:Spine1_03'),
    (cuirass_mesh, 'mixamorig:Spine1_03'),
    (obj_belt,     'mixamorig:Hips_01'),
    (obj_bicep_l,  'mixamorig:LeftArm_09'),
    (obj_bicep_r,  'mixamorig:RightArm_033'),
    (obj_elbow_l,  'mixamorig:LeftForeArm_010'),
    (obj_elbow_r,  'mixamorig:RightForeArm_034'),
    (obj_hand_l,   'mixamorig:LeftForeArm_010'),
    (obj_hand_r,   'mixamorig:RightForeArm_034'),
]

for obj_piece, bone_name in single_rig:
    obj_piece.data.transform(inv_arm_mat)
    obj_piece.parent = arm
    obj_piece.matrix_local = mathutils.Matrix.Identity(4)
    mod = obj_piece.modifiers.new(name='Armature', type='ARMATURE')
    mod.object = arm
    vg = obj_piece.vertex_groups.new(name=bone_name)
    vg.add([v.index for v in obj_piece.data.vertices], 1.0, 'REPLACE')

boot_rig = [
    (obj_boot_l, 'mixamorig:LeftLeg_056', 'mixamorig:LeftFoot_057'),
    (obj_boot_r, 'mixamorig:RightLeg_061', 'mixamorig:RightFoot_062'),
]

for obj_boot, leg_bone, foot_bone in boot_rig:
    vg_leg = obj_boot.vertex_groups.new(name=leg_bone)
    vg_foot = obj_boot.vertex_groups.new(name=foot_bone)
    for v in obj_boot.data.vertices:
        z = v.co.z
        if z > -0.76:
            w_leg, w_foot = 1.0, 0.0
        elif z < -0.84:
            w_leg, w_foot = 0.0, 1.0
        else:
            factor = (z - (-0.84)) / (-0.76 - (-0.84))
            w_leg = factor
            w_foot = 1.0 - factor
        vg_leg.add([v.index], w_leg, 'REPLACE')
        vg_foot.add([v.index], w_foot, 'REPLACE')
    obj_boot.data.transform(inv_arm_mat)
    obj_boot.parent = arm
    obj_boot.matrix_local = mathutils.Matrix.Identity(4)
    mod = obj_boot.modifiers.new(name='Armature', type='ARMATURE')
    mod.object = arm

# -------------------------------------------------------------------
# 7. CINEMATIC RENDERING (FRONT, ANGLE, CLOSEUP, PROFILE)
# -------------------------------------------------------------------
scene = bpy.context.scene
scene.render.resolution_x = 1024
scene.render.resolution_y = 1024

if not scene.world:
    scene.world = bpy.data.worlds.new("World")
scene.world.color = (0.015, 0.018, 0.025)

# High Quality Studio Lighting
key_light = bpy.data.lights.new(name="KeyLight", type='AREA')
key_light.energy = 160
key_light.size = 1.6
key_light.color = (1.0, 0.97, 0.94)
key_obj = bpy.data.objects.new("KeyLight", key_light)
key_obj.location = (1.2, -1.9, 0.9)
scene.collection.objects.link(key_obj)

fill_light = bpy.data.lights.new(name="FillLight", type='AREA')
fill_light.energy = 85
fill_light.size = 2.4
fill_light.color = (0.42, 0.70, 1.0)
fill_obj = bpy.data.objects.new("FillLight", fill_light)
fill_obj.location = (-1.4, -1.6, 0.3)
scene.collection.objects.link(fill_obj)

rim_light = bpy.data.lights.new(name="RimLight", type='AREA')
rim_light.energy = 140
rim_light.size = 1.8
rim_light.color = (0.85, 0.92, 1.0)
rim_obj = bpy.data.objects.new("RimLight", rim_light)
rim_obj.location = (0.0, 2.0, 1.3)
scene.collection.objects.link(rim_obj)

cam_data = bpy.data.cameras.new("Cam")
cam_data.lens = 65
cam_obj = bpy.data.objects.new("Cam", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

os.makedirs('temp_render', exist_ok=True)

# 1. Front Full Body / Upper Torso
cam_obj.location = (0.0, -2.1, 0.25)
cam_obj.rotation_euler = (math.radians(90.0), 0, 0)
scene.render.filepath = os.path.abspath('temp_render/nexo_auren_pbr_front.png')
bpy.ops.render.render(write_still=True)

# 2. Hero 3/4 Perspective Angle
cam_obj.location = (1.1, -1.8, 0.35)
dir_vec = (mathutils.Vector((0, 0, 0.28)) - cam_obj.location).normalized()
cam_obj.rotation_euler = dir_vec.to_track_quat('-Z', 'Y').to_euler()
scene.render.filepath = os.path.abspath('temp_render/nexo_auren_pbr_angle.png')
bpy.ops.render.render(write_still=True)

# 3. Torso / Medieval Cuirass Close-Up
cam_obj.location = (0.0, -1.05, 0.37)
cam_obj.rotation_euler = (math.radians(90.0), 0, 0)
scene.render.filepath = os.path.abspath('temp_render/nexo_auren_cuirass_closeup.png')
bpy.ops.render.render(write_still=True)

print("All cinematic renders completed successfully!")
