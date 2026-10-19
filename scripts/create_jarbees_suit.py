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
DST_GLB = os.path.join(MODELS_DIR, 'jarbees_suit.glb')
ARTIFACT_DIR = r"C:\Users\xiphos-pc1\.gemini\antigravity-ide\brain\7ce7f652-8277-4aad-ba7b-7a2a0ec8cd62"

# -------------------------------------------------------------
# PALETA OFICIAL JARBEES (BEE-01 VESPER - EDICIÓN GLADIADOR)
# -------------------------------------------------------------
# - Azul Petróleo (#102D46, 60%): Estructura, carrocería y domo del casco
# - Violeta Profundo (#35205B, 20%): Placas secundarias, hombreras y máscara facial gladiador
# - Titanio Frío (#A8C4D5, 15%): Biseles, cresta guerrera, escudo T y remaches
# - Cian Energético (#55F0FF, 5%): Reactor hexagonal y propulsores
# - Stealth Black (#08080C) / Carbon Black (#060608): Interior y juntas
PALETTE_SRGB = {
    'petroleum': np.array([0x10 / 255.0, 0x2D / 255.0, 0x46 / 255.0], dtype=np.float32),
    'violet':    np.array([0x35 / 255.0, 0x20 / 255.0, 0x5B / 255.0], dtype=np.float32),
    'titanium':  np.array([0xA8 / 255.0, 0xC4 / 255.0, 0xD5 / 255.0], dtype=np.float32),
    'cyan':      np.array([0x55 / 255.0, 0xF0 / 255.0, 0xFF / 255.0], dtype=np.float32),
    'black':     np.array([0x08 / 255.0, 0x08 / 255.0, 0x0C / 255.0], dtype=np.float32),
    'carbon':    np.array([0x06 / 255.0, 0x06 / 255.0, 0x08 / 255.0], dtype=np.float32),
}

def hex_to_linear(hex_str):
    hex_str = hex_str.lstrip('#')
    r = int(hex_str[0:2], 16) / 255.0
    g = int(hex_str[2:4], 16) / 255.0
    b = int(hex_str[4:6], 16) / 255.0
    return (r ** 2.2, g ** 2.2, b ** 2.2, 1.0)

COL_PETROLEUM = hex_to_linear('#102D46')
COL_VIOLET = hex_to_linear('#35205B')
COL_TITANIUM = hex_to_linear('#A8C4D5')
COL_CYAN = hex_to_linear('#55F0FF')
COL_STEALTH_BLACK = hex_to_linear('#08080C')
COL_CARBON_BLACK = hex_to_linear('#060608')

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
        print(f"⚡ Decimated {filename}: {len(obj.data.vertices)} vertices remaining (75% faster WebGL rendering)")

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
    print('\n=============================================================')
    print('🐝 CREATING JARBEES SUIT (BEE-01 VESPER) - GLADIATOR PROTOCOL')
    print('=============================================================')

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=SRC_GLB)

    arm = [o for o in bpy.context.scene.objects if o.type == 'ARMATURE'][0]
    bpy.context.view_layer.objects.active = arm

    # -------------------------------------------------------------
    # 1. CREACIÓN Y APLICACIÓN DE MATERIALES EN EL TRAJE
    # -------------------------------------------------------------
    def get_or_create_mat(name, base_col, roughness=0.25, metallic=0.85, is_emissive=False, emissive_strength=1.0):
        mat = bpy.data.materials.get(name) or bpy.data.materials.new(name=name)
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes.get('Principled BSDF')
        if bsdf:
            bsdf.inputs['Base Color'].default_value = base_col
            bsdf.inputs['Roughness'].default_value = roughness
            bsdf.inputs['Metallic'].default_value = metallic
            if is_emissive:
                bsdf.inputs['Emission Color'].default_value = base_col
                bsdf.inputs['Emission Strength'].default_value = emissive_strength
            else:
                if 'Emission Color' in bsdf.inputs:
                    bsdf.inputs['Emission Color'].default_value = (0.0, 0.0, 0.0, 1.0)
                if 'Emission Strength' in bsdf.inputs:
                    bsdf.inputs['Emission Strength'].default_value = 0.0
        return mat

    mat_petroleum = get_or_create_mat('JarBees_PetroleumBlue', COL_PETROLEUM, roughness=0.26, metallic=0.82)
    mat_violet = get_or_create_mat('JarBees_DeepViolet', COL_VIOLET, roughness=0.22, metallic=0.78)
    mat_titanium = get_or_create_mat('JarBees_ColdTitanium', COL_TITANIUM, roughness=0.18, metallic=0.88)
    mat_cyan_glow = get_or_create_mat('JarBees_CyanEnergy', COL_CYAN, roughness=0.10, metallic=0.0, is_emissive=True, emissive_strength=3.5)
    mat_stealth_black = get_or_create_mat('JarBees_StealthBlack', COL_STEALTH_BLACK, roughness=0.12, metallic=0.92)
    mat_carbon_black = get_or_create_mat('JarBees_CarbonBlack', COL_CARBON_BLACK, roughness=0.22, metallic=0.85)

    # Reasignar materiales en objetos originales del cuerpo
    for obj in bpy.context.scene.objects:
        if obj.type == 'MESH':
            for slot in obj.material_slots:
                old_name = slot.material.name if slot.material else ''
                if 'Red' in old_name:
                    slot.material = mat_petroleum
                elif 'Gold' in old_name:
                    slot.material = mat_violet
                elif 'Silver' in old_name:
                    slot.material = mat_titanium
                elif 'Arc_Reactor' in old_name or 'Glass' in old_name:
                    slot.material = mat_carbon_black
                elif 'Lights' in old_name:
                    slot.material = mat_cyan_glow

    # -------------------------------------------------------------
    # 2. ENCASTE Y OCULTAMIENTO TOTAL DE LA CABEZA DE IRON MAN
    # -------------------------------------------------------------
    # Calculamos el centro de la cabeza del esqueleto original
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
    print(f"📍 Centro métrico de cabeza Mixamo: {head_center}")

    # Retraer vértices de la cabeza de Iron Man hacia el interior del casco gladiador (radio 35%)
    # Esto garantiza al 100% que la cara/ojos de Iron Man queden completamente dentro del casco sin asomar nunca
    for obj, v, co in head_verts:
        delta = (co - head_center) * 0.35
        new_world = head_center + delta
        v.co = obj.matrix_world.inverted() @ new_world

    print("🛡️ Cabeza original de Iron Man encajada y replegada dentro de la cavidad craneal.")

    # -------------------------------------------------------------
    # 3. IMPORTACIÓN Y TRANSFORMACIÓN DEL CASCO GLADIADOR
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

    # -------------------------------------------------------------
    # 4. COLORACIÓN PBR Y TINTADO DE TEXTURAS DEL CASCO
    # -------------------------------------------------------------
    def tint_material_texture(mat, target_srgb, contrast=1.1, brightness_boost=1.4):
        if not mat or not mat.node_tree:
            return
        bsdf = mat.node_tree.nodes.get('Principled BSDF')
        if not bsdf:
            return
        base_color_input = bsdf.inputs.get('Base Color')
        if not base_color_input or not base_color_input.is_linked:
            return
        from_node = base_color_input.links[0].from_node
        if from_node.type != 'TEX_IMAGE' or not from_node.image:
            return

        img = from_node.image
        w, h = img.size
        arr = np.zeros(w * h * 4, dtype=np.float32)
        img.pixels.foreach_get(arr)

        rgb = arr.reshape(-1, 4)[:, :3]
        lum = 0.299 * rgb[:, 0] + 0.587 * rgb[:, 1] + 0.114 * rgb[:, 2]
        mean_lum = max(float(np.mean(lum)), 0.001)

        norm_lum = np.power(np.maximum(lum / mean_lum, 0.0), contrast) * brightness_boost
        tinted = norm_lum[:, None] * target_srgb[None, :]
        np.clip(tinted, 0.0, 1.0, out=tinted)

        arr.reshape(-1, 4)[:, :3] = tinted
        img.pixels.foreach_set(arr)
        img.update()

    # Asignación de paleta a los componentes del casco:
    for mat in bpy.data.materials:
        if 'SkullC' in mat.name or mat.name == 'material' or 'material.' in mat.name:
            # Domo y cubre-nuca en Azul Petróleo (#102D46)
            tint_material_texture(mat, PALETTE_SRGB['petroleum'], contrast=1.1, brightness_boost=1.5)
            mat.name = 'JarBees_Helmet_Petroleum'
            bsdf = mat.node_tree.nodes.get('Principled BSDF')
            if bsdf:
                bsdf.inputs['Metallic'].default_value = 0.84
                bsdf.inputs['Roughness'].default_value = 0.25
        elif 'FaceP' in mat.name and 'TFaceP' not in mat.name:
            # Máscara facial gladiador en Violeta Profundo (#35205B)
            tint_material_texture(mat, PALETTE_SRGB['violet'], contrast=1.15, brightness_boost=1.6)
            mat.name = 'JarBees_Helmet_Violet'
            bsdf = mat.node_tree.nodes.get('Principled BSDF')
            if bsdf:
                bsdf.inputs['Metallic'].default_value = 0.80
                bsdf.inputs['Roughness'].default_value = 0.22
        elif 'TFaceP' in mat.name:
            # Escudo T frontal en Titanio Frío (#A8C4D5)
            tint_material_texture(mat, PALETTE_SRGB['titanium'], contrast=1.0, brightness_boost=1.2)
            mat.name = 'JarBees_Helmet_Titanium_Visor'
            bsdf = mat.node_tree.nodes.get('Principled BSDF')
            if bsdf:
                bsdf.inputs['Metallic'].default_value = 0.88
                bsdf.inputs['Roughness'].default_value = 0.18
        elif 'TopSpike' in mat.name:
            # Cresta guerrera con púas en Titanio Frío (#A8C4D5)
            tint_material_texture(mat, PALETTE_SRGB['titanium'], contrast=1.1, brightness_boost=1.3)
            mat.name = 'JarBees_Helmet_Titanium_Crest'
            bsdf = mat.node_tree.nodes.get('Principled BSDF')
            if bsdf:
                bsdf.inputs['Metallic'].default_value = 0.90
                bsdf.inputs['Roughness'].default_value = 0.16
        elif 'Rivet' in mat.name:
            # Remaches y biseles en Titanio Frío (#A8C4D5)
            tint_material_texture(mat, PALETTE_SRGB['titanium'], contrast=1.0, brightness_boost=1.4)
            mat.name = 'JarBees_Helmet_Titanium_Rivets'
            bsdf = mat.node_tree.nodes.get('Principled BSDF')
            if bsdf:
                bsdf.inputs['Metallic'].default_value = 0.92
                bsdf.inputs['Roughness'].default_value = 0.12

    # Unificar las partes del casco en un solo objeto para rigging óptimo
    bpy.ops.object.select_all(action='DESELECT')
    for o in helmet_meshes:
        o.select_set(True)
    bpy.context.view_layer.objects.active = helmet_meshes[0]
    bpy.ops.object.join()
    helmet_obj = bpy.context.view_layer.objects.active
    helmet_obj.name = "JarBees_Gladiator_Helmet"

    # -------------------------------------------------------------
    # 5. ESCALADO, ROTACIÓN Y ALINEACIÓN MILIMÉTRICA DEL CASCO
    # -------------------------------------------------------------
    SCALE = 0.098
    mat_rot = mathutils.Matrix.Rotation(math.radians(-90.0), 4, 'Z') @ mathutils.Matrix.Rotation(math.radians(-5.0), 4, 'X')
    mat_scale = mathutils.Matrix.Scale(SCALE, 4)
    helmet_obj.data.transform(mat_scale @ mat_rot)
    helmet_obj.matrix_world = mathutils.Matrix.Identity(4)

    # Centro real de vértices del casco
    xs = [v.co.x for v in helmet_obj.data.vertices]
    ys = [v.co.y for v in helmet_obj.data.vertices]
    zs = [v.co.z for v in helmet_obj.data.vertices]
    actual_center_x = (min(xs) + max(xs)) / 2.0
    actual_center_y = (min(ys) + max(ys)) / 2.0
    actual_center_z = (min(zs) + max(zs)) / 2.0

    target_x_offset = head_center.x - actual_center_x
    target_y_offset = (head_center.y - 0.022) - actual_center_y
    target_z_offset = (head_center.z - 0.062) - actual_center_z

    mat_trans = mathutils.Matrix.Translation(mathutils.Vector((target_x_offset, target_y_offset, target_z_offset)))
    helmet_obj.data.transform(mat_trans)

    # Visor HUD Cibernético detrás de la abertura T del casco gladiador
    mesh_visor = bpy.data.meshes.new('JarBees_Helmet_CyberVisor_Mesh')
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
    obj_visor = bpy.data.objects.new('JarBees_Helmet_CyberVisor', mesh_visor)
    bpy.context.scene.collection.objects.link(obj_visor)
    obj_visor.data.materials.append(mat_cyan_glow)

    # -------------------------------------------------------------
    # 6. ACCESORIOS EXCLUSIVOS JARBEES: HEX-CORE Y ALETAS DORSALES
    # -------------------------------------------------------------
    # Núcleo Hexagonal de Enjambre en el Pecho
    cx, cy, cz = 0.003, -0.176, 0.416
    mesh_hex = bpy.data.meshes.new('JarBees_Chest_HexCore_Mesh')
    bm_h = bmesh.new()
    R_OUT, R_IN = 0.052, 0.038
    hex_out, hex_in = [], []
    for i in range(6):
        ang = math.radians(60 * i + 30)
        hex_out.append(bm_h.verts.new((cx + R_OUT * math.cos(ang), cy - 0.008, cz + R_OUT * math.sin(ang))))
        hex_in.append(bm_h.verts.new((cx + R_IN * math.cos(ang), cy - 0.012, cz + R_IN * math.sin(ang))))
    face_core = bm_h.faces.new(hex_in)
    for i in range(6):
        bm_h.faces.new((hex_out[i], hex_out[(i+1)%6], hex_in[(i+1)%6], hex_in[i]))
    r_hex = bmesh.ops.extrude_face_region(bm_h, geom=[face_core])
    for v in [e for e in r_hex['geom'] if isinstance(e, bmesh.types.BMVert)]:
        v.co.y += 0.015
    bm_h.to_mesh(mesh_hex)
    bm_h.free()
    obj_hex = bpy.data.objects.new('JarBees_Chest_HexCore', mesh_hex)
    bpy.context.scene.collection.objects.link(obj_hex)
    obj_hex.data.materials.append(mat_cyan_glow)

    # Aletas Estabilizadoras Dorsales de Enjambre
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
    obj_wings.data.materials.append(mat_petroleum)

    # -------------------------------------------------------------
    # 7. PLACAS DE ARMADURA FUTURISTA ADICIONAL (BERSERKER COSPLAY)
    # -------------------------------------------------------------
    print("⚔️ Incorporando placas de armadura futurista personalizadas...")

    # A) Escudo Pectoral del Plexo Solar & Gancho Táctico Central (Titanio Frío)
    obj_plexus = load_and_scale_stl('Belt_Buckle_thick.stl', 0.18)
    obj_plexus.name = "JarBees_Armor_PlexusShield"
    m_plex = mathutils.Matrix.Translation(mathutils.Vector((0.000, -0.182, 0.300))) @ \
             mathutils.Euler((math.radians(12.0), 0, 0)).to_matrix().to_4x4()
    obj_plexus.data.transform(m_plex)
    obj_plexus.matrix_world = mathutils.Matrix.Identity(4)
    obj_plexus.data.materials.append(mat_titanium)

    obj_hook = load_and_scale_stl('belt_arm_hook.stl', 0.07)
    obj_hook.name = "JarBees_Armor_PlexusHook"
    m_hook = mathutils.Matrix.Translation(mathutils.Vector((0.000, -0.202, 0.305))) @ \
             mathutils.Euler((math.radians(12.0), 0, 0)).to_matrix().to_4x4()
    obj_hook.data.transform(m_hook)
    obj_hook.matrix_world = mathutils.Matrix.Identity(4)
    obj_hook.data.materials.append(mat_titanium)

    # B) Hebilla / Placa Pélvica Inferior (Titanio Frío)
    obj_belt = load_and_scale_stl('Belt_Buckle.stl', 0.14)
    obj_belt.name = "JarBees_Armor_BeltBuckle"
    mat_belt_trans = mathutils.Matrix.Translation(mathutils.Vector((0.000, -0.155, 0.065)))
    mat_belt_rot = mathutils.Matrix.Rotation(math.radians(-6.0), 4, 'X')
    obj_belt.data.transform(mat_belt_trans @ mat_belt_rot)
    obj_belt.matrix_world = mathutils.Matrix.Identity(4)
    obj_belt.data.materials.append(mat_titanium)

    # C) Guanteletes y Cuchillas de Antebrazo (Titanio Frío - Calibración Angular Prominente)
    obj_hand_l = load_and_scale_stl('Hand_Guard_-_left.stl', 0.18)
    obj_hand_l.name = "JarBees_Armor_Gauntlet_L"
    m_hg_l = mathutils.Matrix.Translation(mathutils.Vector((0.445, 0.020, 0.195))) @ \
             mathutils.Euler((math.radians(45.0), math.radians(-50.0), math.radians(40.0))).to_matrix().to_4x4()
    obj_hand_l.data.transform(m_hg_l)
    obj_hand_l.matrix_world = mathutils.Matrix.Identity(4)
    obj_hand_l.data.materials.append(mat_titanium)

    obj_hand_r = load_and_scale_stl('Hand_Guard_-_Right.stl', 0.18)
    obj_hand_r.name = "JarBees_Armor_Gauntlet_R"
    m_hg_r = mathutils.Matrix.Translation(mathutils.Vector((-0.445, 0.020, 0.195))) @ \
             mathutils.Euler((math.radians(45.0), math.radians(50.0), math.radians(-40.0))).to_matrix().to_4x4()
    obj_hand_r.data.transform(m_hg_r)
    obj_hand_r.matrix_world = mathutils.Matrix.Identity(4)
    obj_hand_r.data.materials.append(mat_titanium)

    # D) Placas de Bíceps / Brazo Superior (Violeta Profundo)
    obj_bicep_l = load_and_scale_stl('shin_-_left.stl', 0.20)
    obj_bicep_l.name = "JarBees_Armor_Bicep_L"
    m_bi_l = mathutils.Matrix.Translation(mathutils.Vector((0.325, 0.060, 0.420))) @ \
             mathutils.Euler((math.radians(20.0), math.radians(-40.0), math.radians(15.0))).to_matrix().to_4x4()
    obj_bicep_l.data.transform(m_bi_l)
    obj_bicep_l.matrix_world = mathutils.Matrix.Identity(4)
    obj_bicep_l.data.materials.append(mat_violet)

    obj_bicep_r = load_and_scale_stl('shin_-_right.stl', 0.20)
    obj_bicep_r.name = "JarBees_Armor_Bicep_R"
    m_bi_r = mathutils.Matrix.Translation(mathutils.Vector((-0.325, 0.060, 0.420))) @ \
             mathutils.Euler((math.radians(20.0), math.radians(40.0), math.radians(-15.0))).to_matrix().to_4x4()
    obj_bicep_r.data.transform(m_bi_r)
    obj_bicep_r.matrix_world = mathutils.Matrix.Identity(4)
    obj_bicep_r.data.materials.append(mat_violet)

    # E) Coderas Articuladas (Violeta Profundo)
    obj_elbow_l = load_and_scale_stl('elbow_cap_-_left.stl', 0.09)
    obj_elbow_l.name = "JarBees_Armor_Elbow_L"
    m_el_l = mathutils.Matrix.Translation(mathutils.Vector((0.330, 0.045, 0.300))) @ \
             mathutils.Euler((math.radians(-15), math.radians(20), math.radians(-25))).to_matrix().to_4x4()
    obj_elbow_l.data.transform(m_el_l)
    obj_elbow_l.matrix_world = mathutils.Matrix.Identity(4)
    obj_elbow_l.data.materials.append(mat_violet)

    obj_elbow_r = load_and_scale_stl('elbow_cap_-_right.stl', 0.09)
    obj_elbow_r.name = "JarBees_Armor_Elbow_R"
    m_el_r = mathutils.Matrix.Translation(mathutils.Vector((-0.330, 0.045, 0.300))) @ \
             mathutils.Euler((math.radians(-15), math.radians(-20), math.radians(25))).to_matrix().to_4x4()
    obj_elbow_r.data.transform(m_el_r)
    obj_elbow_r.matrix_world = mathutils.Matrix.Identity(4)
    obj_elbow_r.data.materials.append(mat_violet)

    # F) Botas y Greaves Blindadas de Pierna (Azul Petróleo con Refuerzos de Titanio)
    obj_boot_l = load_and_scale_stl('foot_-_left.stl', 0.52)
    obj_boot_l.name = "JarBees_Armor_Boot_L"
    m_bt_l = mathutils.Matrix.Translation(mathutils.Vector((0.132, 0.025, -0.680))) @ \
             mathutils.Euler((math.radians(-4), 0, 0)).to_matrix().to_4x4()
    obj_boot_l.data.transform(m_bt_l)
    obj_boot_l.matrix_world = mathutils.Matrix.Identity(4)
    obj_boot_l.data.materials.append(mat_petroleum)

    obj_boot_r = load_and_scale_stl('foot_-_right.stl', 0.52)
    obj_boot_r.name = "JarBees_Armor_Boot_R"
    m_bt_r = mathutils.Matrix.Translation(mathutils.Vector((-0.132, 0.025, -0.680))) @ \
             mathutils.Euler((math.radians(-4), 0, 0)).to_matrix().to_4x4()
    obj_boot_r.data.transform(m_bt_r)
    obj_boot_r.matrix_world = mathutils.Matrix.Identity(4)
    obj_boot_r.data.materials.append(mat_petroleum)

    # -------------------------------------------------------------
    # 8. RIGGING INTEGRAL Y TRANSFORMACIÓN AL ESPACIO LOCAL DE ARMATURE
    # -------------------------------------------------------------
    # Crucial: Convertimos todas las coordenadas del mundo métrico al espacio local
    # del Armature de Mixamo (escala ~0.0278), para que queden con transform Identity
    # y los vértices se deformen en 100% sincronía con el esqueleto.
    inv_arm_mat = arm.matrix_world.inverted()

    # Acoples rígidos mono-hueso:
    single_attachments = [
        (helmet_obj,   'mixamorig:Head_06'),
        (obj_visor,    'mixamorig:Head_06'),
        (obj_hex,      'mixamorig:Spine1_03'),
        (obj_wings,    'mixamorig:Spine1_03'),
        (obj_plexus,   'mixamorig:Spine1_03'),
        (obj_hook,     'mixamorig:Spine1_03'),
        (obj_belt,     'mixamorig:Hips_01'),
        (obj_bicep_l,  'mixamorig:LeftArm_09'),
        (obj_bicep_r,  'mixamorig:RightArm_033'),
        (obj_elbow_l,  'mixamorig:LeftForeArm_010'),
        (obj_elbow_r,  'mixamorig:RightForeArm_034'),
        (obj_hand_l,   'mixamorig:LeftForeArm_010'),
        (obj_hand_r,   'mixamorig:RightForeArm_034'),
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

    # Acople bi-hueso con mezcla orgánica en el tobillo para las botas pesadas:
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

    print('✅ Armadura completa (Casco Gladiador, Visor HUD, HexCore, Aletas y Placas Berserker) riggeada con éxito!')

    # -------------------------------------------------------------
    # 8. HORNEADO DE ANIMACIONES CINEMÁTICAS ('hover' y 'flight')
    # -------------------------------------------------------------
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='POSE')

    for pb in arm.pose.bones:
        pb.rotation_mode = 'XYZ'

    spine = arm.pose.bones.get('mixamorig:Spine_02')
    chest = arm.pose.bones.get('mixamorig:Spine1_03')
    neck = arm.pose.bones.get('mixamorig:Neck_05')
    head = arm.pose.bones.get('mixamorig:Head_06')
    l_sh = arm.pose.bones.get('mixamorig:LeftShoulder_08')
    r_sh = arm.pose.bones.get('mixamorig:RightShoulder_032')
    l_arm = arm.pose.bones.get('mixamorig:LeftArm_09')
    r_arm = arm.pose.bones.get('mixamorig:RightArm_033')
    l_forearm = arm.pose.bones.get('mixamorig:LeftForeArm_010')
    r_forearm = arm.pose.bones.get('mixamorig:RightForeArm_034')
    l_hand = arm.pose.bones.get('mixamorig:LeftHand_011')
    r_hand = arm.pose.bones.get('mixamorig:RightHand_035')
    l_upleg = arm.pose.bones.get('mixamorig:LeftUpLeg_00')
    r_upleg = arm.pose.bones.get('mixamorig:RightUpLeg_060')
    l_leg = arm.pose.bones.get('mixamorig:LeftLeg_056')
    r_leg = arm.pose.bones.get('mixamorig:RightLeg_061')
    l_foot = arm.pose.bones.get('mixamorig:LeftFoot_057')
    r_foot = arm.pose.bones.get('mixamorig:RightFoot_062')

    for act in list(bpy.data.actions):
        bpy.data.actions.remove(act, do_unlink=True)
    if arm.animation_data:
        arm.animation_data_clear()

    # ACCIÓN 1: 'hover' (180 frames / 6s)
    action_hover = bpy.data.actions.new(name='hover')
    arm.animation_data_create()
    arm.animation_data.action = action_hover

    TOTAL_HOVER_FRAMES = 180
    for frame in range(TOTAL_HOVER_FRAMES + 1):
        norm_t = frame / float(TOTAL_HOVER_FRAMES)
        breath = math.sin(norm_t * 4 * math.pi) * math.radians(2.5)
        sway = math.cos(norm_t * 2 * math.pi) * math.radians(1.5)

        if chest:
            chest.rotation_euler = (breath, 0, sway)
            chest.keyframe_insert(data_path='rotation_euler', frame=frame)
        if spine:
            spine.rotation_euler = (breath * 0.5, 0, sway * 0.5)
            spine.keyframe_insert(data_path='rotation_euler', frame=frame)

        look_yaw = 0.0
        head_pitch = math.sin(norm_t * 4 * math.pi) * math.radians(1.5)
        if 0.15 <= norm_t <= 0.38:
            phase = (norm_t - 0.15) / 0.23
            smooth_bell = 0.5 * (1.0 - math.cos(phase * 2.0 * math.pi))
            look_yaw = smooth_bell * math.radians(22.0)
        elif 0.55 <= norm_t <= 0.78:
            phase = (norm_t - 0.55) / 0.23
            smooth_bell = 0.5 * (1.0 - math.cos(phase * 2.0 * math.pi))
            look_yaw = -smooth_bell * math.radians(22.0)

        if head:
            head.rotation_euler = (head_pitch, look_yaw * 0.70, 0)
            head.keyframe_insert(data_path='rotation_euler', frame=frame)
        if neck:
            neck.rotation_euler = (head_pitch * 0.5, look_yaw * 0.30, 0)
            neck.keyframe_insert(data_path='rotation_euler', frame=frame)

        arm_breath = math.sin(norm_t * 4 * math.pi) * math.radians(1.5)
        if l_sh:
            l_sh.rotation_euler = (0, math.radians(-12.0), math.radians(-4.0))
            l_sh.keyframe_insert(data_path='rotation_euler', frame=frame)
        if r_sh:
            r_sh.rotation_euler = (0, math.radians(12.0), math.radians(4.0))
            r_sh.keyframe_insert(data_path='rotation_euler', frame=frame)
        if l_arm:
            l_arm.rotation_euler = (math.radians(10.0) + arm_breath, math.radians(-12.0), math.radians(-2.0))
            l_arm.keyframe_insert(data_path='rotation_euler', frame=frame)
        if r_arm:
            r_arm.rotation_euler = (math.radians(10.0) + arm_breath, math.radians(12.0), math.radians(2.0))
            r_arm.keyframe_insert(data_path='rotation_euler', frame=frame)

        elbow_pulse = math.sin(norm_t * 4 * math.pi) * math.radians(1.5)
        if l_forearm:
            l_forearm.rotation_euler = (math.radians(-14.0) - elbow_pulse, 0, math.radians(-4.0))
            l_forearm.keyframe_insert(data_path='rotation_euler', frame=frame)
        if r_forearm:
            r_forearm.rotation_euler = (math.radians(-14.0) - elbow_pulse, 0, math.radians(4.0))
            r_forearm.keyframe_insert(data_path='rotation_euler', frame=frame)

        wrist_vibe = math.sin(norm_t * 8 * math.pi) * math.radians(1.2)
        if l_hand:
            l_hand.rotation_euler = (math.radians(8.0) + wrist_vibe, math.radians(-6.0), math.radians(2.0))
            l_hand.keyframe_insert(data_path='rotation_euler', frame=frame)
        if r_hand:
            r_hand.rotation_euler = (math.radians(8.0) + wrist_vibe, math.radians(6.0), math.radians(-2.0))
            r_hand.keyframe_insert(data_path='rotation_euler', frame=frame)

        leg_pulse = math.sin(norm_t * 4 * math.pi) * math.radians(1.5)
        if l_upleg:
            l_upleg.rotation_euler = (math.radians(-10.0) + leg_pulse, 0, math.radians(-3.0))
            l_upleg.keyframe_insert(data_path='rotation_euler', frame=frame)
        if r_upleg:
            r_upleg.rotation_euler = (math.radians(6.0) - leg_pulse, 0, math.radians(3.0))
            r_upleg.keyframe_insert(data_path='rotation_euler', frame=frame)
        if l_leg:
            l_leg.rotation_euler = (math.radians(28.0) + leg_pulse, 0, 0)
            l_leg.keyframe_insert(data_path='rotation_euler', frame=frame)
        if r_leg:
            r_leg.rotation_euler = (math.radians(22.0) - leg_pulse, 0, 0)
            r_leg.keyframe_insert(data_path='rotation_euler', frame=frame)

        if l_foot:
            l_foot.rotation_euler = (math.radians(-65.0), 0, 0)
            l_foot.keyframe_insert(data_path='rotation_euler', frame=frame)
        if r_foot:
            r_foot.rotation_euler = (math.radians(-68.0), 0, 0)
            r_foot.keyframe_insert(data_path='rotation_euler', frame=frame)

    print('✅ Acción "hover" creada')

    # ACCIÓN 2: 'flight' (60 frames / 2s - Supersónico)
    action_flight = bpy.data.actions.new(name='flight')
    arm.animation_data.action = action_flight

    TOTAL_FLIGHT_FRAMES = 60
    for frame in range(TOTAL_FLIGHT_FRAMES + 1):
        norm_t = frame / float(TOTAL_FLIGHT_FRAMES)
        vibe = math.sin(norm_t * 8 * math.pi) * math.radians(1.0)

        if chest:
            chest.rotation_euler = (math.radians(8.0) + vibe, 0, 0)
            chest.keyframe_insert(data_path='rotation_euler', frame=frame)
        if spine:
            spine.rotation_euler = (math.radians(4.0) + vibe * 0.5, 0, 0)
            spine.keyframe_insert(data_path='rotation_euler', frame=frame)
        if neck:
            neck.rotation_euler = (math.radians(-18.0), 0, 0)
            neck.keyframe_insert(data_path='rotation_euler', frame=frame)
        if head:
            head.rotation_euler = (math.radians(-48.0) + vibe, 0, 0)
            head.keyframe_insert(data_path='rotation_euler', frame=frame)

        if l_sh:
            l_sh.rotation_euler = (0, 0, 0)
            l_sh.keyframe_insert(data_path='rotation_euler', frame=frame)
        if r_sh:
            r_sh.rotation_euler = (0, 0, 0)
            r_sh.keyframe_insert(data_path='rotation_euler', frame=frame)

        if l_arm:
            l_arm.rotation_euler = (math.radians(18.0) + vibe * 0.5, math.radians(-8.0), math.radians(22.0))
            l_arm.keyframe_insert(data_path='rotation_euler', frame=frame)
        if r_arm:
            r_arm.rotation_euler = (math.radians(18.0) + vibe * 0.5, math.radians(8.0), math.radians(-22.0))
            r_arm.keyframe_insert(data_path='rotation_euler', frame=frame)

        if l_forearm:
            l_forearm.rotation_euler = (math.radians(-12.0), 0, math.radians(6.0))
            l_forearm.keyframe_insert(data_path='rotation_euler', frame=frame)
        if r_forearm:
            r_forearm.rotation_euler = (math.radians(-12.0), 0, math.radians(-6.0))
            r_forearm.keyframe_insert(data_path='rotation_euler', frame=frame)

        hand_twist = math.sin(norm_t * 6 * math.pi) * math.radians(2.0)
        if l_hand:
            l_hand.rotation_euler = (math.radians(-15.0), math.radians(18.0) + hand_twist, math.radians(-10.0))
            l_hand.keyframe_insert(data_path='rotation_euler', frame=frame)
        if r_hand:
            r_hand.rotation_euler = (math.radians(-15.0), math.radians(-18.0) - hand_twist, math.radians(10.0))
            r_hand.keyframe_insert(data_path='rotation_euler', frame=frame)

        if l_upleg:
            l_upleg.rotation_euler = (math.radians(-8.0), 0, math.radians(-2.0))
            l_upleg.keyframe_insert(data_path='rotation_euler', frame=frame)
        if r_upleg:
            r_upleg.rotation_euler = (math.radians(-5.0), 0, math.radians(2.0))
            r_upleg.keyframe_insert(data_path='rotation_euler', frame=frame)

        if l_leg:
            l_leg.rotation_euler = (math.radians(24.0) + vibe, 0, 0)
            l_leg.keyframe_insert(data_path='rotation_euler', frame=frame)
        if r_leg:
            r_leg.rotation_euler = (math.radians(18.0) + vibe, 0, 0)
            r_leg.keyframe_insert(data_path='rotation_euler', frame=frame)

        if l_foot:
            l_foot.rotation_euler = (math.radians(-14.0), 0, 0)
            l_foot.keyframe_insert(data_path='rotation_euler', frame=frame)
        if r_foot:
            r_foot.rotation_euler = (math.radians(-14.0), 0, 0)
            r_foot.keyframe_insert(data_path='rotation_euler', frame=frame)

    print('✅ Acción "flight" creada')

    # NLA Tracks para exportación glTF
    arm.animation_data.use_nla = True
    track1 = arm.animation_data.nla_tracks.new()
    track1.name = 'Track_Hover'
    track1.strips.new('hover', 0, action_hover)

    track2 = arm.animation_data.nla_tracks.new()
    track2.name = 'Track_Flight'
    track2.strips.new('flight', 0, action_flight)

    bpy.ops.object.mode_set(mode='OBJECT')

    # -------------------------------------------------------------
    # 9. RENDERIZADO DE VERIFICACIÓN (ARTIFACTS)
    # -------------------------------------------------------------
    print("📸 Renderizando vistas de verificación fotorrealistas...")
    scene = bpy.context.scene
    scene.render.resolution_x = 1024
    scene.render.resolution_y = 1024

    if not scene.world:
        scene.world = bpy.data.worlds.new("World")
    scene.world.color = (0.02, 0.025, 0.035)

    key_light = bpy.data.lights.new(name="KeyLight", type='AREA')
    key_light.energy = 100
    key_light.size = 1.4
    key_light.color = (1.0, 0.96, 0.92)
    key_obj = bpy.data.objects.new("KeyLight", key_light)
    key_obj.location = (0.9, -2.0, 1.2)
    scene.collection.objects.link(key_obj)

    fill_light = bpy.data.lights.new(name="FillLight", type='AREA')
    fill_light.energy = 60
    fill_light.size = 2.2
    fill_light.color = (0.35, 0.65, 1.0)
    fill_obj = bpy.data.objects.new("FillLight", fill_light)
    fill_obj.location = (-1.2, -1.8, 0.4)
    scene.collection.objects.link(fill_obj)

    rim_light = bpy.data.lights.new(name="RimLight", type='AREA')
    rim_light.energy = 90
    rim_light.size = 1.5
    rim_light.color = (0.8, 0.9, 1.0)
    rim_obj = bpy.data.objects.new("RimLight", rim_light)
    rim_obj.location = (0.0, 2.0, 1.5)
    scene.collection.objects.link(rim_obj)

    cam_data = bpy.data.cameras.new("Cam")
    cam_data.lens = 55
    cam_obj = bpy.data.objects.new("Cam", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    shots = [
        ("vesper_final_gladiator_front", (0.0, -2.7, -0.05), (0.0, 0.0, -0.05)),
        ("vesper_final_gladiator_angle", (1.3, -2.4, 0.1), (0.0, 0.0, -0.05)),
        ("vesper_final_helmet_closeup", (0.0, -1.1, 0.65), (0.0, -0.01, 0.65)),
        ("vesper_final_boots_belt", (0.0, -1.7, -0.45), (0.0, 0.0, -0.45)),
        ("vesper_final_back_wings", (-1.2, 2.2, 0.35), (0.0, 0.0, 0.3)),
    ]

    for name, loc, look_at in shots:
        cam_obj.location = loc
        dir_vec = (mathutils.Vector(look_at) - mathutils.Vector(loc)).normalized()
        rot_quat = dir_vec.to_track_quat('-Z', 'Y')
        cam_obj.rotation_euler = rot_quat.to_euler()
        
        filepath = os.path.join(ARTIFACT_DIR, f"{name}.png")
        scene.render.filepath = filepath
        bpy.ops.render.render(write_still=True)
        print(f"🖼️ Render guardado: {filepath}")

    # Limpiar luces y cámara para un glTF ligero y puro
    for obj_temp in [key_obj, fill_obj, rim_obj, cam_obj]:
        bpy.data.objects.remove(obj_temp, do_unlink=True)

    # -------------------------------------------------------------
    # 10. EXPORTACIÓN GLTF CON DRACO COMPRESIÓN
    # -------------------------------------------------------------
    print(f'📦 Exportando Armadura JarBees Gladiator a {DST_GLB}...')
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
    print(f'🎉 Armadura JarBees (BEE-01 Vesper) creada y exportada con éxito: {DST_GLB} ({size_mb:.2f} MB)!')

if __name__ == '__main__':
    create_jarbees_suit()
