import bpy
import bmesh
import math
import mathutils
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, 'assets_source', 'models')
SRC_GLB = os.path.join(MODELS_DIR, 'iron_man.glb')
DST_GLB = os.path.join(MODELS_DIR, 'jarbees_suit.glb')

def create_jarbees_suit():
    print('\n=============================================================')
    print('🐝 CREATING JARBEES SUIT (BEE-01 VESPER) - SWARM PROTOCOL')
    print('=============================================================')

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=SRC_GLB)

    arm = [o for o in bpy.context.scene.objects if o.type == 'ARMATURE'][0]
    bpy.context.view_layer.objects.active = arm

    # -------------------------------------------------------------
    # 1. CREACIÓN DE LA NUEVA PALETA DE MATERIALES PBR JARBEES
    # -------------------------------------------------------------
    # Paleta oficial:
    # - Azul Petróleo (#102D46, 60%): Estructura y carrocería principal
    # - Violeta Profundo (#35205B, 20%): Placas secundarias, hombreras y acentos
    # - Titanio Frío (#A8C4D5, 15%): Juntas mecánicas, biseles y exoesqueleto
    # - Cian Energético (#55F0FF, 5%): Reactor hexagonal, visor y propulsores
    def hex_to_rgb(hex_str):
        hex_str = hex_str.lstrip('#')
        r = int(hex_str[0:2], 16) / 255.0
        g = int(hex_str[2:4], 16) / 255.0
        b = int(hex_str[4:6], 16) / 255.0
        # Conversión a linear sRGB aproximado para Blender
        return (r ** 2.2, g ** 2.2, b ** 2.2, 1.0)

    COL_PETROLEUM = hex_to_rgb('#102D46')
    COL_VIOLET = hex_to_rgb('#35205B')
    COL_TITANIUM = hex_to_rgb('#A8C4D5')
    COL_CYAN = hex_to_rgb('#55F0FF')
    COL_STEALTH_BLACK = hex_to_rgb('#08080C')
    COL_CARBON_BLACK = hex_to_rgb('#060608')

    def get_or_create_mat(name, base_col, roughness=0.25, metallic=0.85, is_emissive=False, emissive_strength=1.0):
        mat = bpy.data.materials.get(name)
        if not mat:
            mat = bpy.data.materials.new(name=name)
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
    mat_stealth_black = get_or_create_mat('JarBees_StealthBlack', COL_STEALTH_BLACK, roughness=0.12, metallic=0.92, is_emissive=False)
    mat_carbon_black = get_or_create_mat('JarBees_CarbonBlack', COL_CARBON_BLACK, roughness=0.22, metallic=0.85, is_emissive=False)

    # Reasignar materiales en los objetos originales
    for obj in bpy.context.scene.objects:
        if obj.type == 'MESH':
            for i, slot in enumerate(obj.material_slots):
                old_name = slot.material.name if slot.material else ''
                if 'Red' in old_name:
                    slot.material = mat_petroleum
                elif 'Gold' in old_name:
                    slot.material = mat_violet
                elif 'Silver' in old_name:
                    slot.material = mat_titanium
                elif 'Arc_Reactor' in old_name or 'Glass' in old_name:
                    # El reactor de Iron Man queda completamente en Negro Carbón Stealth
                    slot.material = mat_carbon_black
                elif 'Lights' in old_name:
                    slot.material = mat_cyan_glow

    # Transformación Stealth Black en Cara/Ojos y Reactor (eliminación total de Iron Man)
    # 1. En Object_13 (antigua máscara/faceplate dorada de Iron Man), reasignar polígonos faciales a Stealth Black
    obj_13 = bpy.data.objects.get('Object_13')
    if obj_13 and 'mixamorig:Head_06' in obj_13.vertex_groups:
        obj_13.data.materials.append(mat_stealth_black)
        black_idx13 = len(obj_13.data.materials) - 1
        vg_head_13 = obj_13.vertex_groups['mixamorig:Head_06'].index
        for p in obj_13.data.polygons:
            if any(any(g.group == vg_head_13 and g.weight > 0.5 for g in obj_13.data.vertices[v].groups) for v in p.vertices):
                p.material_index = black_idx13

    # 2. En Object_18 (luces), reasignar ojos (Head_06) y núcleo del pecho (Spine1_03) a Stealth Black (dejando propulsores en cian)
    obj_18 = bpy.data.objects.get('Object_18')
    if obj_18:
        obj_18.data.materials.append(mat_stealth_black)
        black_idx18 = len(obj_18.data.materials) - 1
        vg_head_18 = obj_18.vertex_groups.get('mixamorig:Head_06')
        vg_spine_18 = obj_18.vertex_groups.get('mixamorig:Spine1_03')
        head_idx = vg_head_18.index if vg_head_18 else -1
        spine_idx = vg_spine_18.index if vg_spine_18 else -1
        for p in obj_18.data.polygons:
            is_eye_or_chest = any(
                any((g.group == head_idx or g.group == spine_idx) and g.weight > 0.5 for g in obj_18.data.vertices[v].groups)
                for v in p.vertices
            )
            if is_eye_or_chest:
                p.material_index = black_idx18

    # -------------------------------------------------------------
    # 2. MODELADO GEOMÉTRICO EXCLUSIVO: VISOR Y ANTENAS EN CASCO
    # -------------------------------------------------------------
    # Visor angular estilizado en V sobre el rostro frontal
    # Centro en X=0, Y=-0.118, Z=0.770 (escala métrica)
    mesh_visor = bpy.data.meshes.new('JarBees_Helmet_Visor_Mesh')
    bm_v = bmesh.new()
    
    # 8 vértices en forma de escudo angular aerodinámico en V
    v_top_center = bm_v.verts.new((0.000, -0.114, 0.812))
    v_top_l      = bm_v.verts.new((-0.065, -0.108, 0.806))
    v_top_r      = bm_v.verts.new((0.065, -0.108, 0.806))
    v_mid_l      = bm_v.verts.new((-0.076, -0.116, 0.775))
    v_mid_r      = bm_v.verts.new((0.076, -0.116, 0.775))
    v_bot_l      = bm_v.verts.new((-0.042, -0.126, 0.738))
    v_bot_r      = bm_v.verts.new((0.042, -0.126, 0.738))
    v_bot_center = bm_v.verts.new((0.000, -0.128, 0.724))
    
    # Crear caras del visor
    bm_v.faces.new((v_top_center, v_top_l, v_mid_l))
    bm_v.faces.new((v_top_center, v_mid_l, v_bot_l, v_bot_center))
    bm_v.faces.new((v_top_center, v_mid_r, v_top_r))
    bm_v.faces.new((v_top_center, v_bot_center, v_bot_r, v_mid_r))
    bmesh.ops.recalc_face_normals(bm_v, faces=bm_v.faces)
    
    # Extruir ligeramente para darle grosor de placa de blindaje
    r = bmesh.ops.extrude_face_region(bm_v, geom=bm_v.faces)
    extrude_verts = [e for e in r['geom'] if isinstance(e, bmesh.types.BMVert)]
    for v in extrude_verts:
        v.co.y -= 0.006 # hacia adelante
    
    bm_v.to_mesh(mesh_visor)
    bm_v.free()
    
    obj_visor = bpy.data.objects.new('JarBees_Helmet_Visor', mesh_visor)
    bpy.context.scene.collection.objects.link(obj_visor)
    obj_visor.data.materials.append(mat_stealth_black)

    # Antenas / sensores laterales de abeja en los costados del casco
    mesh_ant = bpy.data.meshes.new('JarBees_Antennae_Mesh')
    bm_a = bmesh.new()

    for side in [-1, 1]:
        # Base lateral de la antena
        bx = side * 0.086
        b_root_f = bm_a.verts.new((bx, -0.015, 0.800))
        b_root_b = bm_a.verts.new((bx + side * 0.005, 0.040, 0.805))
        # Punta aerodinámica orientada hacia atrás y arriba
        tx = side * 0.104
        b_tip_f = bm_a.verts.new((tx, 0.045, 0.915))
        b_tip_b = bm_a.verts.new((tx + side * 0.005, 0.095, 0.935))

        bm_a.faces.new((b_root_f, b_root_b, b_tip_b, b_tip_f))

    # Extruir grosor de antena
    r_ant = bmesh.ops.extrude_face_region(bm_a, geom=bm_a.faces)
    for v in [e for e in r_ant['geom'] if isinstance(e, bmesh.types.BMVert)]:
        v.co.x += (0.005 if v.co.x > 0 else -0.005)

    bm_a.to_mesh(mesh_ant)
    bm_a.free()

    obj_ant = bpy.data.objects.new('JarBees_Helmet_Antennae', mesh_ant)
    bpy.context.scene.collection.objects.link(obj_ant)
    obj_ant.data.materials.append(mat_titanium)

    # -------------------------------------------------------------
    # 3. NÚCLEO HEXAGONAL DE COLMENA EN EL PECHO (HEX-CORE)
    # -------------------------------------------------------------
    # Centro en X=0.003, Y=-0.176, Z=0.416
    cx, cy, cz = 0.003, -0.176, 0.416
    mesh_hex = bpy.data.meshes.new('JarBees_HexCore_Mesh')
    bm_h = bmesh.new()

    # Hexágono exterior de titanio
    R_OUT = 0.052
    R_IN = 0.038
    hex_out_verts = []
    hex_in_verts = []

    for i in range(6):
        ang = math.radians(60 * i + 30) # Vértice arriba
        hx = cx + R_OUT * math.cos(ang)
        hz = cz + R_OUT * math.sin(ang)
        hex_out_verts.append(bm_h.verts.new((hx, cy - 0.008, hz)))

        ix = cx + R_IN * math.cos(ang)
        iz = cz + R_IN * math.sin(ang)
        hex_in_verts.append(bm_h.verts.new((ix, cy - 0.012, iz)))

    # Cara central del núcleo energético
    face_core = bm_h.faces.new(hex_in_verts)

    # Anillo biselado de titanio
    for i in range(6):
        next_i = (i + 1) % 6
        bm_h.faces.new((hex_out_verts[i], hex_out_verts[next_i], hex_in_verts[next_i], hex_in_verts[i]))

    # Extrusión hacia adentro para sellar los costados
    r_hex = bmesh.ops.extrude_face_region(bm_h, geom=[face_core])
    for v in [e for e in r_hex['geom'] if isinstance(e, bmesh.types.BMVert)]:
        v.co.y += 0.015 # hacia el interior del pecho

    bm_h.to_mesh(mesh_hex)
    bm_h.free()

    obj_hex = bpy.data.objects.new('JarBees_Chest_HexCore', mesh_hex)
    bpy.context.scene.collection.objects.link(obj_hex)
    obj_hex.data.materials.append(mat_carbon_black)
    obj_hex.data.materials.append(mat_carbon_black)
    # Ambas caras y bisel en Negro Carbón Stealth
    for poly in obj_hex.data.polygons:
        poly.material_index = 0

    # -------------------------------------------------------------
    # 4. ESTABILIZADORES DORSALES GEMELOS (ALETAS DE ENJAMBRE)
    # -------------------------------------------------------------
    # Montadas en la espalda alta (Z=0.44 a 0.58, Y=+0.13 a +0.22)
    mesh_wings = bpy.data.meshes.new('JarBees_DorsalWings_Mesh')
    bm_w = bmesh.new()

    for side in [-1, 1]:
        # Raíz en la espalda
        w_root_top = bm_w.verts.new((side * 0.055, 0.125, 0.540))
        w_root_bot = bm_w.verts.new((side * 0.045, 0.120, 0.450))
        # Punta de aleta estabilizadora
        w_tip_top  = bm_w.verts.new((side * 0.145, 0.225, 0.590))
        w_tip_bot  = bm_w.verts.new((side * 0.115, 0.185, 0.440))

        bm_w.faces.new((w_root_top, w_tip_top, w_tip_bot, w_root_bot))

    # Grosor de aleta
    r_w = bmesh.ops.extrude_face_region(bm_w, geom=bm_w.faces)
    for v in [e for e in r_w['geom'] if isinstance(e, bmesh.types.BMVert)]:
        v.co.x += (0.006 if v.co.x > 0 else -0.006)

    bm_w.to_mesh(mesh_wings)
    bm_w.free()

    obj_wings = bpy.data.objects.new('JarBees_DorsalWings', mesh_wings)
    bpy.context.scene.collection.objects.link(obj_wings)
    obj_wings.data.materials.append(mat_petroleum)

    # -------------------------------------------------------------
    # 5. ASIGNACIÓN RIGGING DE LAS NUEVAS PIEZAS AL ESQUELETO MIXAMO
    # -------------------------------------------------------------
    # Vincular al Armature con pesos 1.0 a sus respectivos huesos
    pieces = [
        (obj_visor, 'mixamorig:Head_06'),
        (obj_ant,   'mixamorig:Head_06'),
        (obj_hex,   'mixamorig:Spine1_03'),
        (obj_wings, 'mixamorig:Spine1_03'),
    ]

    for obj_piece, bone_name in pieces:
        obj_piece.parent = arm
        mod = obj_piece.modifiers.new(name='Armature', type='ARMATURE')
        mod.object = arm
        vg = obj_piece.vertex_groups.new(name=bone_name)
        all_indices = [v.index for v in obj_piece.data.vertices]
        vg.add(all_indices, 1.0, 'REPLACE')

    print('✅ Nuevas piezas geométricas JarBees añadidas y riggeadas con éxito!')

    # -------------------------------------------------------------
    # 6. CONFIGURACIÓN Y HORNEADO DE ANIMACIONES FLUIDAS ('hover' y 'flight')
    # -------------------------------------------------------------
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='POSE')

    for pb in arm.pose.bones:
        pb.rotation_mode = 'XYZ'

    # Huesos clave
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

    # ACCIÓN 1: 'hover' (6s / 180 frames) con curva de campana cosenoidal y pies hacia la tierra
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

        # Mirada suave con campana cosenoidal pura (cero tirones)
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

        # Hombros y brazos abiertos en porte heroico
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

        # Piernas con flexión atlética y pies apuntando firmemente hacia la tierra
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

        # Pies apuntando directamente a la tierra (-65° y -68°)
        if l_foot:
            l_foot.rotation_euler = (math.radians(-65.0), 0, 0)
            l_foot.keyframe_insert(data_path='rotation_euler', frame=frame)
        if r_foot:
            r_foot.rotation_euler = (math.radians(-68.0), 0, 0)
            r_foot.keyframe_insert(data_path='rotation_euler', frame=frame)

    print('✅ Acción "hover" creada')

    # ACCIÓN 2: 'flight' (2s / 60 frames) Vuelo supersónico horizontal torpedo
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

        # En vuelo supersónico, las suelas quedan perpendiculares mirando de cara hacia la cámara
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
    # 7. EXPORTACIÓN GLTF CON DRACO COMPRESIÓN
    # -------------------------------------------------------------
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
        export_image_format='AUTO'
    )
    print(f'🎉 Armadura JarBees (BEE-01 Vesper) creada y exportada a {DST_GLB} ({os.path.getsize(DST_GLB)/(1024*1024):.2f} MB)!')

if __name__ == '__main__':
    create_jarbees_suit()
