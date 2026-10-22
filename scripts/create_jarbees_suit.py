import bpy
import bmesh
import math
import mathutils
import numpy as np
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, 'assets_source', 'models')
SRC_GLB = os.path.join(MODELS_DIR, 'iron_man.glb')
SRC_HELMET = os.path.join(MODELS_DIR, 'crude_gladiator_helmet.glb')
ARMOR_DIR = os.path.join(MODELS_DIR, 'berserker-orc-armor-cosplay')
CUIRASS_GLB = os.path.join(MODELS_DIR, 'armor_plate.glb')
DST_GLB = os.path.join(MODELS_DIR, 'jarbees_suit.glb')

ARTIFACT_DIR = r"C:\Users\xiphos-pc1\.gemini\antigravity-ide\brain\18f5acca-df42-4178-b673-a7768ece91ac"
os.makedirs(ARTIFACT_DIR, exist_ok=True)
os.makedirs('temp_render', exist_ok=True)

# -------------------------------------------------------------
# PALETA MONOLÍTICA JARBEES & AUREN (FORGED ANTIQUE SILVER & STEEL)
# -------------------------------------------------------------
# Inspirada exactamente en el acabado, reflectividad PBR y micro-textura
# de la Placa Pechera Medieval Reliquia (armor_plate / DefaultMaterial):
# - Acero Plateado Forjado Satinado (#9EA4AA): Placas principales del cuerpo, muslos, hombros y casco
# - Plata Pulida Reforzada (#C8CED4): Biseles, relieves, cresta y remaches reflectivos
# - Acero Grafito y Juntas (#3E4248): Uniones mecánicas, tendones y acentos profundos
# - Remaches Latón/Bronce Antiguo (#B88E48): Puntos de anclaje de la armadura
# - Circuitería Fotónica Cian (#36DBE8): Visor cibernético brillante y canales cognitivos
PALETTE_SRGB = {
    'forged_silver':    np.array([0x9E / 255.0, 0xA4 / 255.0, 0xAA / 255.0], dtype=np.float32),
    'polished_silver':  np.array([0xC8 / 255.0, 0xCE / 255.0, 0xD4 / 255.0], dtype=np.float32),
    'gunmetal_steel':   np.array([0x3E / 255.0, 0x42 / 255.0, 0x48 / 255.0], dtype=np.float32),
    'relic_brass':      np.array([0xB8 / 255.0, 0x8E / 255.0, 0x48 / 255.0], dtype=np.float32),
    'photonic_cyan':    (0x36 / 255.0, 0xDB / 255.0, 0xE8 / 255.0, 1.0),
    'stealth_black':    (0x08 / 255.0, 0x08 / 255.0, 0x0C / 255.0, 1.0),
}

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

def load_and_scale_stl(filename, target_h, decimate_ratio=0.25):
    filepath = os.path.join(ARMOR_DIR, filename)
    if hasattr(bpy.ops.wm, 'stl_import'):
        bpy.ops.wm.stl_import(filepath=filepath)
    elif hasattr(bpy.ops.import_mesh, 'stl'):
        bpy.ops.import_mesh.stl(filepath=filepath)
    obj = bpy.context.selected_objects[0]
    obj.name = filename.replace('.stl', '')
    
    if decimate_ratio < 1.0 and len(obj.data.vertices) > 1000:
        mod_dec = obj.modifiers.new(name='Decimate', type='DECIMATE')
        mod_dec.ratio = decimate_ratio
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier='Decimate')
        print(f"⚡ Decimated {filename}: {len(obj.data.vertices)} vertices remaining")

    xs = [v.co.x for v in obj.data.vertices]
    ys = [v.co.y for v in obj.data.vertices]
    zs = [v.co.z for v in obj.data.vertices]
    cx = (min(xs) + max(xs)) / 2.0
    cy = (min(ys) + max(ys)) / 2.0
    cz = (min(zs) + max(zs)) / 2.0
    h_orig = max(zs) - min(zs)
    scale = target_h / h_orig
    
    for v in obj.data.vertices:
        v.co.x = (v.co.x - cx) * scale
        v.co.y = (v.co.y - cy) * scale
        v.co.z = (v.co.z - cz) * scale
        
    return obj

def create_jarbees_suit():
    print('\n========================================================================')
    print('🐝 CREATING JARBEES SUIT (AUREN / NEXO-01) — UNIFIED FORGED SILVER ARMOR')
    print('========================================================================')

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=SRC_GLB)

    arm = [o for o in bpy.context.scene.objects if o.type == 'ARMATURE'][0]
    bpy.context.view_layer.objects.active = arm

    # -------------------------------------------------------------
    # 1. TRATAMIENTO PBR MONOLÍTICO: INTEGRACIÓN CON LA PECHERA MEDIEVAL
    # -------------------------------------------------------------
    # Red_Part -> Acero Plateado Forjado (idéntico al acabado y brillo de la pechera)
    mat_red = bpy.data.materials.get('Red_Part')
    if mat_red and mat_red.node_tree:
        tex_node = [n for n in mat_red.node_tree.nodes if n.type == 'TEX_IMAGE' and n.name == 'Image Texture']
        if tex_node and tex_node[0].image:
            tint_existing_texture(tex_node[0].image, PALETTE_SRGB['forged_silver'], contrast=1.08, brightness=1.35)
        bsdf = mat_red.node_tree.nodes.get('Principled BSDF')
        if bsdf:
            bsdf.inputs['Metallic'].default_value = 0.90
            bsdf.inputs['Roughness'].default_value = 0.28

    # Gold_Part -> Plata Pulida Reforzada (armonizando con relieves y biseles)
    mat_gold = bpy.data.materials.get('Gold_Part')
    if mat_gold and mat_gold.node_tree:
        tex_node = [n for n in mat_gold.node_tree.nodes if n.type == 'TEX_IMAGE' and n.name == 'Image Texture']
        if tex_node and tex_node[0].image:
            tint_existing_texture(tex_node[0].image, PALETTE_SRGB['polished_silver'], contrast=1.12, brightness=1.40)
        bsdf = mat_gold.node_tree.nodes.get('Principled BSDF')
        if bsdf:
            bsdf.inputs['Metallic'].default_value = 0.92
            bsdf.inputs['Roughness'].default_value = 0.24

    # Silver_Part -> Acero Grafito y Juntas Mecánicas
    mat_silver = bpy.data.materials.get('Silver_Part')
    if mat_silver and mat_silver.node_tree:
        tex_node = [n for n in mat_silver.node_tree.nodes if n.type == 'TEX_IMAGE' and n.name == 'Image Texture']
        if tex_node and tex_node[0].image:
            tint_existing_texture(tex_node[0].image, PALETTE_SRGB['gunmetal_steel'], contrast=1.10, brightness=1.20)
        bsdf = mat_silver.node_tree.nodes.get('Principled BSDF')
        if bsdf:
            bsdf.inputs['Metallic'].default_value = 0.92
            bsdf.inputs['Roughness'].default_value = 0.22

    # Arc_Reactor -> Núcleo Sub-Pectoral Encapsulado en Grafito
    mat_reactor = bpy.data.materials.get('Arc_Reactor')
    if mat_reactor and mat_reactor.node_tree:
        bsdf = mat_reactor.node_tree.nodes.get('Principled BSDF')
        if bsdf:
            bsdf.inputs['Base Color'].default_value = (0.05, 0.05, 0.07, 1.0)
            bsdf.inputs['Metallic'].default_value = 0.88
            bsdf.inputs['Roughness'].default_value = 0.32

    # Lights -> Canales Fotónicos Cognitivos Discretos
    mat_lights = bpy.data.materials.get('Lights')
    if mat_lights and mat_lights.node_tree:
        bsdf = mat_lights.node_tree.nodes.get('Principled BSDF')
        if bsdf:
            bsdf.inputs['Base Color'].default_value = PALETTE_SRGB['photonic_cyan']
            if 'Emission Color' in bsdf.inputs:
                bsdf.inputs['Emission Color'].default_value = PALETTE_SRGB['photonic_cyan']
            if 'Emission Strength' in bsdf.inputs:
                bsdf.inputs['Emission Strength'].default_value = 2.4

    # Materiales PBR dedicados para placas de armadura agregadas (Forjadas en Plata)
    mat_forged_silver_pbr = bpy.data.materials.new(name="JarBees_Forged_Silver")
    b = mat_forged_silver_pbr.node_tree.nodes.get('Principled BSDF')
    b.inputs['Base Color'].default_value = (PALETTE_SRGB['forged_silver'][0], PALETTE_SRGB['forged_silver'][1], PALETTE_SRGB['forged_silver'][2], 1.0)
    b.inputs['Metallic'].default_value = 0.90
    b.inputs['Roughness'].default_value = 0.28

    mat_polished_silver_pbr = bpy.data.materials.new(name="JarBees_Polished_Silver")
    b = mat_polished_silver_pbr.node_tree.nodes.get('Principled BSDF')
    b.inputs['Base Color'].default_value = (PALETTE_SRGB['polished_silver'][0], PALETTE_SRGB['polished_silver'][1], PALETTE_SRGB['polished_silver'][2], 1.0)
    b.inputs['Metallic'].default_value = 0.94
    b.inputs['Roughness'].default_value = 0.20

    # -------------------------------------------------------------
    # 2. ENCASTE Y OCULTAMIENTO DE CABEZA BASE
    # -------------------------------------------------------------
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

    # -------------------------------------------------------------
    # 3. IMPORTACIÓN Y TRANSFORMACIÓN DEL CASCO GLADIADOR EN PLATA FORJADA
    # -------------------------------------------------------------
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

    for mat in bpy.data.materials:
        if 'SkullC' in mat.name or mat.name == 'material' or 'material.' in mat.name:
            for node in getattr(mat.node_tree, 'nodes', []):
                if node.type == 'TEX_IMAGE' and node.image:
                    tint_existing_texture(node.image, PALETTE_SRGB['forged_silver'], contrast=1.08, brightness=1.35)
            bsdf = mat.node_tree.nodes.get('Principled BSDF')
            if bsdf:
                bsdf.inputs['Metallic'].default_value = 0.90
                bsdf.inputs['Roughness'].default_value = 0.28
        elif 'FaceP' in mat.name and 'TFaceP' not in mat.name:
            for node in getattr(mat.node_tree, 'nodes', []):
                if node.type == 'TEX_IMAGE' and node.image:
                    tint_existing_texture(node.image, PALETTE_SRGB['forged_silver'], contrast=1.08, brightness=1.35)
            bsdf = mat.node_tree.nodes.get('Principled BSDF')
            if bsdf:
                bsdf.inputs['Metallic'].default_value = 0.90
                bsdf.inputs['Roughness'].default_value = 0.28
        elif 'TFaceP' in mat.name or 'TopSpike' in mat.name:
            for node in getattr(mat.node_tree, 'nodes', []):
                if node.type == 'TEX_IMAGE' and node.image:
                    tint_existing_texture(node.image, PALETTE_SRGB['polished_silver'], contrast=1.10, brightness=1.35)
            bsdf = mat.node_tree.nodes.get('Principled BSDF')
            if bsdf:
                bsdf.inputs['Metallic'].default_value = 0.94
                bsdf.inputs['Roughness'].default_value = 0.18
        elif 'Rivet' in mat.name:
            for node in getattr(mat.node_tree, 'nodes', []):
                if node.type == 'TEX_IMAGE' and node.image:
                    tint_existing_texture(node.image, PALETTE_SRGB['relic_brass'], contrast=1.15, brightness=1.45)
            bsdf = mat.node_tree.nodes.get('Principled BSDF')
            if bsdf:
                bsdf.inputs['Metallic'].default_value = 0.92
                bsdf.inputs['Roughness'].default_value = 0.22

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

    # Visor HUD Detrás de la Abertura en T
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
    b_vis = mat_visor.node_tree.nodes.get('Principled BSDF')
    b_vis.inputs['Base Color'].default_value = PALETTE_SRGB['photonic_cyan']
    b_vis.inputs['Roughness'].default_value = 0.08
    b_vis.inputs['Metallic'].default_value = 0.05
    if 'Emission Color' in b_vis.inputs:
        b_vis.inputs['Emission Color'].default_value = PALETTE_SRGB['photonic_cyan']
    if 'Emission Strength' in b_vis.inputs:
        b_vis.inputs['Emission Strength'].default_value = 3.2
    obj_visor.data.materials.append(mat_visor)

    # -------------------------------------------------------------
    # 4. INCORPORACIÓN DE LA PECHERA MEDIEVAL RELIQUIA (ARMOR_PLATE)
    # -------------------------------------------------------------
    print("🛡️ Integrando la Pechera Medieval Reliquia de Auren (Nexo Viajero del Tiempo)...")
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

    # Dimensionamiento anatómico calibrado:
    # Ancho pectoral: 0.355 m, Alto de esternón: 0.405 m, Espesor de caja: 0.220 m
    scale_x = 0.355 / w_orig
    scale_z = 0.405 / h_orig
    scale_y = 0.220 / d_orig

    for v in cuirass_mesh.data.vertices:
        p = cuirass_mesh.matrix_world @ v.co
        v.co.x = (p.x - cx) * scale_x
        v.co.y = (p.y - cy) * scale_y
        v.co.z = (p.z - cz) * scale_z

    cuirass_mesh.matrix_world = mathutils.Matrix.Identity(4)

    # Inclinación de postura (9.5°) y ajuste milimétrico rasante sobre el torso
    m_rot = mathutils.Euler((math.radians(9.5), 0, 0)).to_matrix().to_4x4()
    m_trans = mathutils.Matrix.Translation(mathutils.Vector((0.000, -0.078, 0.365)))
    cuirass_mesh.data.transform(m_trans @ m_rot)
    cuirass_mesh.matrix_world = mathutils.Matrix.Identity(4)

    # Ajuste de reflectividad PBR para acero histórico forjado con remaches de bronce
    mat_cuirass = cuirass_mesh.data.materials[0] if cuirass_mesh.data.materials else None
    if mat_cuirass and mat_cuirass.node_tree:
        bsdf_c = mat_cuirass.node_tree.nodes.get('Principled BSDF')
        if bsdf_c:
            bsdf_c.inputs['Metallic'].default_value = 0.90
            bsdf_c.inputs['Roughness'].default_value = 0.28

    # -------------------------------------------------------------
    # 5. ALETAS DORSALES Y PLACAS BERSERKER (BRAZOS, ANTEBRAZOS, PIERNAS)
    # -------------------------------------------------------------
    # Aletas Estabilizadoras Dorsales
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
    obj_wings.data.materials.append(mat_forged_silver_pbr)

    # Placa Pélvica Inferior (Plata Pulida)
    obj_belt = load_and_scale_stl('Belt_Buckle.stl', 0.14)
    obj_belt.name = "JarBees_Armor_BeltBuckle"
    mat_belt_trans = mathutils.Matrix.Translation(mathutils.Vector((0.000, -0.155, 0.065)))
    mat_belt_rot = mathutils.Matrix.Rotation(math.radians(-6.0), 4, 'X')
    obj_belt.data.transform(mat_belt_trans @ mat_belt_rot)
    obj_belt.matrix_world = mathutils.Matrix.Identity(4)
    obj_belt.data.materials.append(mat_polished_silver_pbr)

    # NOTA: Las placas laterales de brazos (bíceps, coderas y guanteletes) fueron
    # retiradas a pedido del usuario para mantener los brazos estilizados y limpios.

    # Botas Blindadas (Acero Plateado Forjado)
    obj_boot_l = load_and_scale_stl('foot_-_left.stl', 0.52)
    obj_boot_l.name = "JarBees_Armor_Boot_L"
    m_bt_l = mathutils.Matrix.Translation(mathutils.Vector((0.132, 0.025, -0.680))) @ \
             mathutils.Euler((math.radians(-4), 0, 0)).to_matrix().to_4x4()
    obj_boot_l.data.transform(m_bt_l)
    obj_boot_l.matrix_world = mathutils.Matrix.Identity(4)
    obj_boot_l.data.materials.append(mat_forged_silver_pbr)

    obj_boot_r = load_and_scale_stl('foot_-_right.stl', 0.52)
    obj_boot_r.name = "JarBees_Armor_Boot_R"
    m_bt_r = mathutils.Matrix.Translation(mathutils.Vector((-0.132, 0.025, -0.680))) @ \
             mathutils.Euler((math.radians(-4), 0, 0)).to_matrix().to_4x4()
    obj_boot_r.data.transform(m_bt_r)
    obj_boot_r.matrix_world = mathutils.Matrix.Identity(4)
    obj_boot_r.data.materials.append(mat_forged_silver_pbr)

    # -------------------------------------------------------------
    # 6. RIGGING INTEGRAL AL ESQUELETO MIXAMO
    # -------------------------------------------------------------
    inv_arm_mat = arm.matrix_world.inverted()

    single_attachments = [
        (helmet_obj,   'mixamorig:Head_06'),
        (obj_visor,    'mixamorig:Head_06'),
        (obj_wings,    'mixamorig:Spine1_03'),
        (cuirass_mesh, 'mixamorig:Spine1_03'),
        (obj_belt,     'mixamorig:Hips_01'),
    ]

    for obj_piece, bone_name in single_attachments:
        obj_piece.data.transform(inv_arm_mat)
        obj_piece.parent = arm
        obj_piece.matrix_local = mathutils.Matrix.Identity(4)

        mod = obj_piece.modifiers.new(name='Armature', type='ARMATURE')
        mod.object = arm
        vg = obj_piece.vertex_groups.new(name=bone_name)
        all_indices = [v.index for v in obj_piece.data.vertices]
        vg.add(all_indices, 1.0, 'REPLACE')

    boot_attachments = [
        (obj_boot_l, 'mixamorig:LeftLeg_056', 'mixamorig:LeftFoot_057'),
        (obj_boot_r, 'mixamorig:RightLeg_061', 'mixamorig:RightFoot_062'),
    ]

    for obj_boot, leg_bone, foot_bone in boot_attachments:
        vg_leg = obj_boot.vertex_groups.new(name=leg_bone)
        vg_foot = obj_boot.vertex_groups.new(name=foot_bone)

        for v in obj_boot.data.vertices:
            z = v.co.z
            if z > -0.76:
                w_leg = 1.0
                w_foot = 0.0
            elif z < -0.84:
                w_leg = 0.0
                w_foot = 1.0
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

    print('✅ Armadura completa y Pechera Medieval riggeadas con éxito!')

    # -------------------------------------------------------------
    # 7. HORNEADO DE TODAS LAS ANIMACIONES JARBEES
    # -------------------------------------------------------------
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='POSE')

    import sys
    scripts_dir = os.path.dirname(os.path.abspath(__file__))
    if scripts_dir not in sys.path:
        sys.path.append(scripts_dir)
    from generate_nexo_animations import generate_all_nexo_animations
    generate_all_nexo_animations(arm)

    bpy.ops.object.mode_set(mode='OBJECT')

    # -------------------------------------------------------------
    # 8. RENDERIZADO DE VERIFICACIÓN CINEMATOGRÁFICA
    # -------------------------------------------------------------
    print("📸 Renderizando vistas de verificación fotorrealistas...")
    scene = bpy.context.scene
    scene.render.resolution_x = 1024
    scene.render.resolution_y = 1024

    if not scene.world:
        scene.world = bpy.data.worlds.new("World")
    scene.world.color = (0.015, 0.018, 0.025)

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

    shots = [
        ("nexo_auren_final_front", (0.0, -2.2, 0.22), (0.0, 0.0, 0.22)),
        ("nexo_auren_final_angle", (1.2, -1.9, 0.35), (0.0, 0.0, 0.25)),
        ("nexo_auren_cuirass_closeup", (0.0, -1.05, 0.37), (0.0, -0.05, 0.37)),
        ("nexo_auren_helmet_closeup", (0.0, -1.05, 0.65), (0.0, -0.01, 0.65)),
        ("nexo_auren_back_wings", (-1.2, 2.2, 0.35), (0.0, 0.0, 0.3)),
    ]

    for name, loc, look_at in shots:
        cam_obj.location = loc
        dir_vec = (mathutils.Vector(look_at) - mathutils.Vector(loc)).normalized()
        rot_quat = dir_vec.to_track_quat('-Z', 'Y')
        cam_obj.rotation_euler = rot_quat.to_euler()
        
        filepath_art = os.path.join(ARTIFACT_DIR, f"{name}.png")
        filepath_temp = os.path.join('temp_render', f"{name}.png")
        scene.render.filepath = filepath_art
        bpy.ops.render.render(write_still=True)
        # Also copy to temp_render
        scene.render.filepath = filepath_temp
        bpy.ops.render.render(write_still=True)
        print(f"🖼️ Render guardado: {filepath_art}")

    for obj_temp in [key_obj, fill_obj, rim_obj, cam_obj]:
        bpy.data.objects.remove(obj_temp, do_unlink=True)

    # -------------------------------------------------------------
    # 9. EXPORTACIÓN GLTF CON DRACO COMPRESIÓN
    # -------------------------------------------------------------
    print(f'📦 Exportando Armadura JarBees (Auren / Nexo) a {DST_GLB}...')
    bpy.ops.export_scene.gltf(
        filepath=DST_GLB,
        export_format='GLB',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=7,
        export_draco_position_quantization=14,
        export_draco_normal_quantization=10,
        export_draco_texcoord_quantization=12,
        export_animations=True,
        export_skins=True,
        export_materials='EXPORT',
        export_image_format='AUTO',
        export_cameras=False,
        export_lights=False
    )
    size_mb = os.path.getsize(DST_GLB) / (1024 * 1024)
    print(f'🎉 Armadura Auren / Nexo con Pechera Medieval exportada con éxito: {DST_GLB} ({size_mb:.2f} MB)!')

if __name__ == '__main__':
    create_jarbees_suit()
