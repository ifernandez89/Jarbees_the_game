"""
JarBees: NEXO-01 Animation Generator for Blender 5.x
Genera el set completo de animaciones de Fase 1 (Tierra y reposo) y Fase 3 (Vuelo)
sobre el esqueleto de Mixamo para exportación glTF multi-acción.
"""

import bpy
import math
import mathutils

def euler_to_quat(rx, ry, rz):
    return mathutils.Euler((math.radians(rx), math.radians(ry), math.radians(rz)), 'XYZ').to_quaternion()

def key_bone_rot(pbone, rx, ry, rz, frame):
    pbone.rotation_mode = 'QUATERNION'
    pbone.rotation_quaternion = euler_to_quat(rx, ry, rz)
    pbone.keyframe_insert(data_path='rotation_quaternion', frame=frame)

def key_bone_loc(pbone, x, y, z, frame):
    pbone.location = mathutils.Vector((x, y, z))
    pbone.keyframe_insert(data_path='location', frame=frame)

def key_hips_offset(hips, wx, wy, wz, frame):
    if not hips: return
    # Mapeo de espacio mundo a espacio local de mixamorig:Hips_01 (escala 1/36 = 0.027778):
    # Local X = World X * 36
    # Local Y = World Z (vertical) * 36
    # Local Z = -World Y (adelante/atrás) * 36
    hips.location = mathutils.Vector((wx * 36.0, wz * 36.0, -wy * 36.0))
    hips.keyframe_insert(data_path='location', frame=frame)

def reset_pose(arm):
    for b in arm.pose.bones:
        b.rotation_mode = 'QUATERNION'
        b.rotation_quaternion = mathutils.Quaternion((1, 0, 0, 0))
        b.location = mathutils.Vector((0, 0, 0))

def create_action(arm, name, frame_start, frame_end):
    # Crear o recuperar la acción
    action = bpy.data.actions.get(name)
    if action:
        bpy.data.actions.remove(action)
    action = bpy.data.actions.new(name=name)
    action.use_fake_user = True
    
    if not arm.animation_data:
        arm.animation_data_create()
    arm.animation_data.action = action
    
    reset_pose(arm)
    return action

# =============================================================================
# FASE 1: DARLE VIDA (LOCOMOCIÓN EN TIERRA Y REPOSO)
# =============================================================================

def build_idle(arm):
    """
    nexo_idle (60 frames / 2.0s a 30 FPS):
    Respiración mecánica con expansión del pecho, oscilación sutil de pelvis y balanceo de brazos.
    """
    create_action(arm, 'nexo_idle', 0, 60)
    bones = arm.pose.bones
    
    spine1 = bones.get('mixamorig:Spine1_03')
    spine2 = bones.get('mixamorig:Spine2_04')
    hips = bones.get('mixamorig:Hips_01')
    l_arm = bones.get('mixamorig:LeftArm_09')
    r_arm = bones.get('mixamorig:RightArm_033')
    l_fore = bones.get('mixamorig:LeftForeArm_010')
    r_fore = bones.get('mixamorig:RightForeArm_034')
    neck = bones.get('mixamorig:Neck_05')
    head = bones.get('mixamorig:Head_06')
    l_upleg = bones.get('mixamorig:LeftUpLeg_00')
    r_upleg = bones.get('mixamorig:RightUpLeg_060')
    
    # Postura base erguida
    for f in [0, 15, 30, 45, 60]:
        t = (f / 60.0) * math.pi * 2.0
        breath = math.sin(t)
        
        # Hips: suave respiración vertical (0.008m)
        if hips:
            key_bone_loc(hips, 0, 0, breath * 0.008, f)
            key_bone_rot(hips, breath * 0.5, 0, 0, f)
            
        # Spine: expansión de caja torácica
        if spine1:
            key_bone_rot(spine1, breath * 1.8, 0, 0, f)
        if spine2:
            key_bone_rot(spine2, breath * 1.2, 0, 0, f)
            
        # Cuello y cabeza: balanceo sutil
        if neck:
            key_bone_rot(neck, -breath * 0.8, 0, 0, f)
        if head:
            key_bone_rot(head, breath * 0.5, math.sin(t * 0.5) * 1.0, 0, f)
            
        # Brazos: caída relajada con codos flexionados 12°
        if l_arm:
            key_bone_rot(l_arm, 4.0 + breath * 1.0, 0, -6.0 - breath * 0.5, f)
        if r_arm:
            key_bone_rot(r_arm, 4.0 + breath * 1.0, 0, 6.0 + breath * 0.5, f)
        if l_fore:
            key_bone_rot(l_fore, -14.0 + breath * 1.0, 0, 0, f)
        if r_fore:
            key_bone_rot(r_fore, -14.0 + breath * 1.0, 0, 0, f)
            
        # Piernas: firmes en el suelo
        if l_upleg:
            key_bone_rot(l_upleg, -1.0, 0, -2.0, f)
        if r_upleg:
            key_bone_rot(r_upleg, -1.0, 0, 2.0, f)

def build_walk(arm):
    """
    nexo_walk (36 frames / 1.2s a 30 FPS):
    Ciclo de caminata pesada con paso rotundo de armadura, braceo en contrapeso y balanceo pélvico.
    """
    create_action(arm, 'nexo_walk', 0, 36)
    b = arm.pose.bones
    
    hips = b.get('mixamorig:Hips_01')
    spine = b.get('mixamorig:Spine_02')
    spine1 = b.get('mixamorig:Spine1_03')
    l_upleg = b.get('mixamorig:LeftUpLeg_00')
    r_upleg = b.get('mixamorig:RightUpLeg_060')
    l_leg = b.get('mixamorig:LeftLeg_056')
    r_leg = b.get('mixamorig:RightLeg_061')
    l_foot = b.get('mixamorig:LeftFoot_057')
    r_foot = b.get('mixamorig:RightFoot_062')
    l_arm = b.get('mixamorig:LeftArm_09')
    r_arm = b.get('mixamorig:RightArm_033')
    l_fore = b.get('mixamorig:LeftForeArm_010')
    r_fore = b.get('mixamorig:RightForeArm_034')
    
    # 36 frames: ciclo completo de 2 pasos
    frames = [0, 9, 18, 27, 36]
    for f in frames:
        phase = (f / 36.0) * math.pi * 2.0
        s = math.sin(phase)
        c = math.cos(phase)
        
        # Hips: rebote vertical doble (2x frecuencia) y torsión lateral
        if hips:
            bounce = math.cos(phase * 2.0) * -0.018
            key_bone_loc(hips, s * 0.015, 0, bounce, f)
            key_bone_rot(hips, -3.0, s * 3.5, -s * 2.0, f)
            
        # Torso: contra-torsión armónica
        if spine:
            key_bone_rot(spine, 2.0, -s * 3.0, s * 1.5, f)
        if spine1:
            key_bone_rot(spine1, 1.5, -s * 2.0, 0, f)
            
        # Piernas: paso alternado
        # Izquierda
        l_pitch = s * 24.0
        l_knee = max(0.0, -c * 38.0) if s > -0.2 else 6.0
        l_ankle = -s * 12.0
        if l_upleg:
            key_bone_rot(l_upleg, l_pitch, 0, -2.0, f)
        if l_leg:
            key_bone_rot(l_leg, l_knee, 0, 0, f)
        if l_foot:
            key_bone_rot(l_foot, l_ankle, 0, 0, f)
            
        # Derecha (fase invertida)
        r_pitch = -s * 24.0
        r_knee = max(0.0, c * 38.0) if s < 0.2 else 6.0
        r_ankle = s * 12.0
        if r_upleg:
            key_bone_rot(r_upleg, r_pitch, 0, 2.0, f)
        if r_leg:
            key_bone_rot(r_leg, r_knee, 0, 0, f)
        if r_foot:
            key_bone_rot(r_foot, r_ankle, 0, 0, f)
            
        # Braceo (opuesto a piernas)
        if l_arm:
            key_bone_rot(l_arm, -s * 22.0, 0, -8.0, f)
        if r_arm:
            key_bone_rot(r_arm, s * 22.0, 0, 8.0, f)
        if l_fore:
            key_bone_rot(l_fore, -18.0 + max(0.0, -s * 15.0), 0, 0, f)
        if r_fore:
            key_bone_rot(r_fore, -18.0 + max(0.0, s * 15.0), 0, 0, f)

def build_run(arm):
    """
    nexo_run (22 frames / 0.73s a 30 FPS):
    Carrera atlética de alta potencia con inclinación frontal de 14°, zancadas amplias y braceo enérgico.
    """
    create_action(arm, 'nexo_run', 0, 22)
    b = arm.pose.bones
    
    hips = b.get('mixamorig:Hips_01')
    spine = b.get('mixamorig:Spine_02')
    spine1 = b.get('mixamorig:Spine1_03')
    l_upleg = b.get('mixamorig:LeftUpLeg_00')
    r_upleg = b.get('mixamorig:RightUpLeg_060')
    l_leg = b.get('mixamorig:LeftLeg_056')
    r_leg = b.get('mixamorig:RightLeg_061')
    l_foot = b.get('mixamorig:LeftFoot_057')
    r_foot = b.get('mixamorig:RightFoot_062')
    l_arm = b.get('mixamorig:LeftArm_09')
    r_arm = b.get('mixamorig:RightArm_033')
    l_fore = b.get('mixamorig:LeftForeArm_010')
    r_fore = b.get('mixamorig:RightForeArm_034')
    
    frames = [0, 5, 11, 16, 22]
    for f in frames:
        phase = (f / 22.0) * math.pi * 2.0
        s = math.sin(phase)
        c = math.cos(phase)
        
        if hips:
            bounce = math.cos(phase * 2.0) * -0.035
            key_bone_loc(hips, s * 0.02, -0.04, bounce, f)
            key_bone_rot(hips, -14.0, s * 5.0, -s * 3.0, f)
            
        if spine:
            key_bone_rot(spine, 6.0, -s * 4.5, s * 2.0, f)
        if spine1:
            key_bone_rot(spine1, 5.0, -s * 3.0, 0, f)
            
        # Zancada amplia
        l_pitch = s * 42.0
        l_knee = max(5.0, -c * 68.0) if s > -0.2 else 8.0
        if l_upleg:
            key_bone_rot(l_upleg, l_pitch, 0, -3.0, f)
        if l_leg:
            key_bone_rot(l_leg, l_knee, 0, 0, f)
        if l_foot:
            key_bone_rot(l_foot, -s * 20.0, 0, 0, f)
            
        r_pitch = -s * 42.0
        r_knee = max(5.0, c * 68.0) if s < 0.2 else 8.0
        if r_upleg:
            key_bone_rot(r_upleg, r_pitch, 0, 3.0, f)
        if r_leg:
            key_bone_rot(r_leg, r_knee, 0, 0, f)
        if r_foot:
            key_bone_rot(r_foot, s * 20.0, 0, 0, f)
            
        # Braceo dinámico
        if l_arm:
            key_bone_rot(l_arm, -s * 45.0, 0, -10.0, f)
        if r_arm:
            key_bone_rot(r_arm, s * 45.0, 0, 10.0, f)
        if l_fore:
            key_bone_rot(l_fore, -45.0 + max(0.0, -s * 35.0), 0, 0, f)
        if r_fore:
            key_bone_rot(r_fore, -45.0 + max(0.0, s * 35.0), 0, 0, f)

def build_turn(arm, direction='left'):
    """
    nexo_turn_left / right (18 frames / 0.6s):
    Giro en el sitio pivotando con pasos firmes sin foot-sliding.
    """
    sign = 1.0 if direction == 'left' else -1.0
    act_name = f'nexo_turn_{direction}'
    create_action(arm, act_name, 0, 18)
    b = arm.pose.bones
    
    hips = b.get('mixamorig:Hips_01')
    spine = b.get('mixamorig:Spine1_03')
    head = b.get('mixamorig:Head_06')
    l_foot = b.get('mixamorig:LeftFoot_057')
    r_foot = b.get('mixamorig:RightFoot_062')
    l_leg = b.get('mixamorig:LeftLeg_056')
    r_leg = b.get('mixamorig:RightLeg_061')
    
    keyframes = [
        (0,  0.0,  0.0,  0.0),
        (5,  0.4,  0.0,  0.0),
        (10, 0.8,  0.0,  0.0),
        (18, 0.0,  0.0,  0.0)
    ]
    for f, rot_factor, l_lift, r_lift in keyframes:
        if hips:
            key_bone_rot(hips, 0, sign * rot_factor * 25.0, 0, f)
        if spine:
            key_bone_rot(spine, 0, sign * rot_factor * 15.0, 0, f)
        if head:
            key_bone_rot(head, 0, sign * rot_factor * 30.0, 0, f)
            
        # Elevación y plantado de pies
        lift = math.sin((f / 18.0) * math.pi) * 15.0
        if direction == 'left':
            if l_leg: key_bone_rot(l_leg, lift, 0, 0, f)
            if l_foot: key_bone_rot(l_foot, -lift * 0.5, sign * lift * 0.8, 0, f)
        else:
            if r_leg: key_bone_rot(r_leg, lift, 0, 0, f)
            if r_foot: key_bone_rot(r_foot, -lift * 0.5, sign * lift * 0.8, 0, f)

def build_look_around(arm):
    """
    nexo_look_around (75 frames / 2.5s):
    Movimientos precisos y mecánicos del casco gladiador evaluando el horizonte.
    """
    create_action(arm, 'nexo_look_around', 0, 75)
    b = arm.pose.bones
    neck = b.get('mixamorig:Neck_05')
    head = b.get('mixamorig:Head_06')
    spine = b.get('mixamorig:Spine1_03')
    
    # 0: centro, 20: mira izq, 35: pausa izq, 55: mira der, 75: centro
    kfs = [
        (0,  0.0,  0.0),
        (20, 2.0,  28.0),
        (35, 1.0,  30.0),
        (55, -1.0, -28.0),
        (65, -0.5, -26.0),
        (75, 0.0,  0.0),
    ]
    for f, pitch, yaw in kfs:
        if spine:
            key_bone_rot(spine, 0, yaw * 0.25, 0, f)
        if neck:
            key_bone_rot(neck, pitch * 0.4, yaw * 0.35, 0, f)
        if head:
            key_bone_rot(head, pitch * 0.6, yaw * 0.65, 0, f)

# =============================================================================
# FASE 2: PESO E IMPACTO (ASCENSO, DESCENSO, CAÍDA Y GESTOS)
# =============================================================================

def build_jump_start(arm):
    """
    nexo_jump_start (16 frames / 0.53s):
    Anticipación con compresión de rodillas, balanceo de brazos hacia atrás e impulso explosivo vertical.
    """
    create_action(arm, 'nexo_jump_start', 0, 16)
    b = arm.pose.bones
    hips = b.get('mixamorig:Hips_01')
    spine = b.get('mixamorig:Spine1_03')
    l_upleg = b.get('mixamorig:LeftUpLeg_00')
    r_upleg = b.get('mixamorig:RightUpLeg_060')
    l_leg = b.get('mixamorig:LeftLeg_056')
    r_leg = b.get('mixamorig:RightLeg_061')
    l_foot = b.get('mixamorig:LeftFoot_057')
    r_foot = b.get('mixamorig:RightFoot_062')
    l_arm = b.get('mixamorig:LeftArm_09')
    r_arm = b.get('mixamorig:RightArm_033')
    
    kfs = [
        # f, hip_z, hip_pitch, knee_bend, arm_angle
        (0,   0.00,   0.0,   0.0,   0.0),
        (6,  -0.09,  14.0,  36.0, -22.0), # Compresión y brazos atrás
        (12,  0.06,  -6.0,   4.0,  28.0), # Impulso hacia arriba
        (16,  0.10,  -3.0,   8.0,  18.0), # Despegue completo
    ]
    for f, hz, hp, kb, aa in kfs:
        if hips:
            key_bone_loc(hips, 0, 0, hz, f)
            key_bone_rot(hips, hp, 0, 0, f)
        if spine: key_bone_rot(spine, -hp * 0.4, 0, 0, f)
        if l_upleg: key_bone_rot(l_upleg, -kb * 0.6, 0, -3.0, f)
        if r_upleg: key_bone_rot(r_upleg, -kb * 0.6, 0, 3.0, f)
        if l_leg: key_bone_rot(l_leg, kb, 0, 0, f)
        if r_leg: key_bone_rot(r_leg, kb, 0, 0, f)
        if l_foot: key_bone_rot(l_foot, -kb * 0.3 if f < 10 else 20.0, 0, 0, f)
        if r_foot: key_bone_rot(r_foot, -kb * 0.3 if f < 10 else 20.0, 0, 0, f)
        if l_arm: key_bone_rot(l_arm, aa, 0, -aa * 0.3, f)
        if r_arm: key_bone_rot(r_arm, aa, 0, aa * 0.3, f)

def build_jump_loop(arm):
    """
    nexo_jump_loop (24 frames / 0.8s loop):
    Fase aérea de salto / caída balística: piernas semiflexionadas, brazos estabilizadores.
    """
    create_action(arm, 'nexo_jump_loop', 0, 24)
    b = arm.pose.bones
    hips = b.get('mixamorig:Hips_01')
    spine = b.get('mixamorig:Spine1_03')
    l_upleg = b.get('mixamorig:LeftUpLeg_00')
    r_upleg = b.get('mixamorig:RightUpLeg_060')
    l_leg = b.get('mixamorig:LeftLeg_056')
    r_leg = b.get('mixamorig:RightLeg_061')
    l_foot = b.get('mixamorig:LeftFoot_057')
    r_foot = b.get('mixamorig:RightFoot_062')
    l_arm = b.get('mixamorig:LeftArm_09')
    r_arm = b.get('mixamorig:RightArm_033')

    for f in [0, 8, 16, 24]:
        t = (f / 24.0) * math.pi * 2.0
        vibe = math.sin(t) * 1.5
        if hips: key_bone_rot(hips, -4.0 + vibe * 0.5, 0, 0, f)
        if spine: key_bone_rot(spine, 4.0, 0, 0, f)
        if l_upleg: key_bone_rot(l_upleg, -12.0 + vibe, 0, -3.0, f)
        if r_upleg: key_bone_rot(r_upleg, -12.0 - vibe, 0, 3.0, f)
        if l_leg: key_bone_rot(l_leg, 24.0, 0, 0, f)
        if r_leg: key_bone_rot(r_leg, 24.0, 0, 0, f)
        if l_foot: key_bone_rot(l_foot, 16.0, 0, 0, f)
        if r_foot: key_bone_rot(r_foot, 16.0, 0, 0, f)
        if l_arm: key_bone_rot(l_arm, 15.0 + vibe, 0, -18.0, f)
        if r_arm: key_bone_rot(r_arm, 15.0 - vibe, 0, 18.0, f)

def build_jump_land(arm):
    """
    nexo_jump_land (18 frames / 0.6s):
    Aterrizaje estándar de salto: contacto con suelo, compresión de rodillas (38°) y absorción elástica.
    """
    create_action(arm, 'nexo_jump_land', 0, 18)
    b = arm.pose.bones
    hips = b.get('mixamorig:Hips_01')
    spine = b.get('mixamorig:Spine1_03')
    l_upleg = b.get('mixamorig:LeftUpLeg_00')
    r_upleg = b.get('mixamorig:RightUpLeg_060')
    l_leg = b.get('mixamorig:LeftLeg_056')
    r_leg = b.get('mixamorig:RightLeg_061')
    l_foot = b.get('mixamorig:LeftFoot_057')
    r_foot = b.get('mixamorig:RightFoot_062')
    l_arm = b.get('mixamorig:LeftArm_09')
    r_arm = b.get('mixamorig:RightArm_033')

    kfs = [
        # f, hip_z, hip_pitch, knee_bend, arm_angle
        (0,   0.04,  -2.0,  12.0,  12.0),
        (6,  -0.08,  12.0,  38.0, -16.0), # Compresión
        (12, -0.02,   4.0,  14.0,  -6.0),
        (18,  0.00,   0.0,   0.0,   0.0), # Totalmente nivelado
    ]
    for f, hz, hp, kb, aa in kfs:
        if hips:
            key_bone_loc(hips, 0, 0, hz, f)
            key_bone_rot(hips, hp, 0, 0, f)
        if spine: key_bone_rot(spine, -hp * 0.4, 0, 0, f)
        if l_upleg: key_bone_rot(l_upleg, -kb * 0.6, 0, -3.0, f)
        if r_upleg: key_bone_rot(r_upleg, -kb * 0.6, 0, 3.0, f)
        if l_leg: key_bone_rot(l_leg, kb, 0, 0, f)
        if r_leg: key_bone_rot(r_leg, kb, 0, 0, f)
        if l_foot: key_bone_rot(l_foot, -kb * 0.25, 0, 0, f)
        if r_foot: key_bone_rot(r_foot, -kb * 0.25, 0, 0, f)
        if l_arm: key_bone_rot(l_arm, aa, 0, -aa * 0.3, f)
        if r_arm: key_bone_rot(r_arm, aa, 0, aa * 0.3, f)

def build_heavy_fall(arm):
    """
    nexo_heavy_fall (24 frames / 0.8s loop):
    Caída vertical libre desde gran altura: resistencia de viento, brazos abiertos en micro-aleteo y piernas extendidas.
    """
    create_action(arm, 'nexo_heavy_fall', 0, 24)
    b = arm.pose.bones
    hips = b.get('mixamorig:Hips_01')
    spine = b.get('mixamorig:Spine1_03')
    head = b.get('mixamorig:Head_06')
    l_upleg = b.get('mixamorig:LeftUpLeg_00')
    r_upleg = b.get('mixamorig:RightUpLeg_060')
    l_leg = b.get('mixamorig:LeftLeg_056')
    r_leg = b.get('mixamorig:RightLeg_061')
    l_foot = b.get('mixamorig:LeftFoot_057')
    r_foot = b.get('mixamorig:RightFoot_062')
    l_arm = b.get('mixamorig:LeftArm_09')
    r_arm = b.get('mixamorig:RightArm_033')
    l_fore = b.get('mixamorig:LeftForeArm_010')
    r_fore = b.get('mixamorig:RightForeArm_034')

    for f in [0, 8, 16, 24]:
        t = (f / 24.0) * math.pi * 2.0
        shake = math.sin(t) * 2.5
        if hips: key_bone_rot(hips, -10.0 + shake * 0.4, 0, 0, f)
        if spine: key_bone_rot(spine, 8.0, 0, 0, f)
        if head: key_bone_rot(head, -18.0 + shake * 0.5, 0, 0, f) # Mira al suelo
        # Brazos abiertos vibrando por la resistencia del aire
        if l_arm: key_bone_rot(l_arm, 18.0 + shake, 0, -32.0, f)
        if r_arm: key_bone_rot(r_arm, 18.0 - shake, 0, 32.0, f)
        if l_fore: key_bone_rot(l_fore, -14.0, 0, 0, f)
        if r_fore: key_bone_rot(r_fore, -14.0, 0, 0, f)
        # Piernas tensas hacia abajo
        if l_upleg: key_bone_rot(l_upleg, 8.0, 0, -2.0, f)
        if r_upleg: key_bone_rot(r_upleg, 8.0, 0, 2.0, f)
        if l_leg: key_bone_rot(l_leg, 8.0, 0, 0, f)
        if r_leg: key_bone_rot(r_leg, 8.0, 0, 0, f)
        if l_foot: key_bone_rot(l_foot, 28.0 + shake * 0.5, 0, 0, f)
        if r_foot: key_bone_rot(r_foot, 28.0 - shake * 0.5, 0, 0, f)

def build_heavy_land(arm):
    """
    nexo_heavy_land (28 frames / 0.93s):
    Aterrizaje pesado de superhéroe ("Three-Point Strikedown"):
    Descenso profundo del centro de gravedad (-0.42m), torso inclinado +40°, cabeza alzada con visor al horizonte,
    brazo derecho en impacto cinético hacia el suelo y brazo izquierdo desplegado atrás como estabilizador aerodinámico.
    """
    create_action(arm, 'nexo_heavy_land', 0, 28)
    b = arm.pose.bones
    hips = b.get('mixamorig:Hips_01')
    spine = b.get('mixamorig:Spine_02')
    spine1 = b.get('mixamorig:Spine1_03')
    neck = b.get('mixamorig:Neck_05')
    head = b.get('mixamorig:Head_06')
    l_upleg = b.get('mixamorig:LeftUpLeg_00')
    r_upleg = b.get('mixamorig:RightUpLeg_060')
    l_leg = b.get('mixamorig:LeftLeg_056')
    r_leg = b.get('mixamorig:RightLeg_061')
    l_foot = b.get('mixamorig:LeftFoot_057')
    r_foot = b.get('mixamorig:RightFoot_062')
    r_shoulder = b.get('mixamorig:RightShoulder_032')
    l_shoulder = b.get('mixamorig:LeftShoulder_08')
    l_arm = b.get('mixamorig:LeftArm_09')
    r_arm = b.get('mixamorig:RightArm_033')
    l_fore = b.get('mixamorig:LeftForeArm_010')
    r_fore = b.get('mixamorig:RightForeArm_034')
    l_hand = b.get('mixamorig:LeftHand_011')
    r_hand = b.get('mixamorig:RightHand_035')

    # f, wx, wy, wz, hip_pitch, r_knee, l_knee
    kfs = [
        (0,   0.0,  0.00,  0.00,   0.0,  15.0, 15.0),
        (6,   0.0, -0.04, -0.22,  22.0,  68.0, 52.0),
        (14,  0.0, -0.09, -0.42,  40.0, 105.0, 82.0), # Pico máximo de impacto / shockwave
        (20,  0.0, -0.09, -0.42,  40.0, 105.0, 82.0), # Retención heroica del impacto
        (28,  0.0, -0.06, -0.32,  32.0,  90.0, 70.0), # Inicio de amortiguación
    ]
    for f, wx, wy, wz, hp, rk, lk in kfs:
        if hips:
            key_hips_offset(hips, wx, wy, wz, f)
            key_bone_rot(hips, hp, 8.0 if f > 3 else 0, -4.0 if f > 3 else 0, f)
        if spine: key_bone_rot(spine, -hp * 0.22, 0, 0, f)
        if spine1: key_bone_rot(spine1, -hp * 0.16, 0, 0, f)
        if neck: key_bone_rot(neck, -12.0 if f > 3 else 0, 0, 0, f)
        if head: key_bone_rot(head, -30.0 if f > 3 else 0, 0, 0, f) # Cabeza alzada heroica al horizonte
        
        # Pierna derecha: arrodillada hacia atrás como amortiguador
        if r_upleg: key_bone_rot(r_upleg, 22.0 if f > 3 else 0, 8.0 if f > 3 else 0, 16.0 if f > 3 else 0, f)
        if r_leg: key_bone_rot(r_leg, rk, 0, 0, f)
        if r_foot: key_bone_rot(r_foot, 36.0 if f > 3 else 0, 0, 0, f)
        
        # Pierna izquierda: pilar delantero flexionado
        if l_upleg: key_bone_rot(l_upleg, -64.0 if f > 3 else 0, -10.0 if f > 3 else 0, -18.0 if f > 3 else 0, f)
        if l_leg: key_bone_rot(l_leg, lk, 0, 0, f)
        if l_foot: key_bone_rot(l_foot, -20.0 if f > 3 else 0, 0, 0, f)
        
        # Brazo derecho: impacto cinético hacia el suelo por delante
        if r_shoulder: key_bone_rot(r_shoulder, 18.0 if f > 3 else 0, 0, -32.0 if f > 3 else 0, f)
        if r_arm: key_bone_rot(r_arm, 36.0 if f > 3 else 4.0, -15.0 if f > 3 else 0, -46.0 if f > 3 else 6.0, f)
        if r_fore: key_bone_rot(r_fore, -32.0 if f > 3 else -10.0, 10.0 if f > 3 else 0, 5.0 if f > 3 else 0, f)
        if r_hand: key_bone_rot(r_hand, 20.0 if f > 3 else 0, 0, 0, f)
        
        # Brazo izquierdo: alzado atrás como alerón estabilizador aerodinámico
        if l_shoulder: key_bone_rot(l_shoulder, -10.0 if f > 3 else 0, 0, 15.0 if f > 3 else 0, f)
        if l_arm: key_bone_rot(l_arm, -36.0 if f > 3 else 4.0, -12.0 if f > 3 else 0, -52.0 if f > 3 else -6.0, f)
        if l_fore: key_bone_rot(l_fore, -52.0 if f > 3 else -10.0, 0, -10.0 if f > 3 else 0, f)
        if l_hand: key_bone_rot(l_hand, 15.0 if f > 3 else 0, 0, 0, f)

def build_recovery(arm):
    """
    nexo_recovery (30 frames / 1.0s):
    Recuperación épica desde el aterrizaje pesado (puño en tierra) levantándose erguido hacia guardia/idle.
    """
    create_action(arm, 'nexo_recovery', 0, 30)
    b = arm.pose.bones
    hips = b.get('mixamorig:Hips_01')
    spine = b.get('mixamorig:Spine_02')
    spine1 = b.get('mixamorig:Spine1_03')
    neck = b.get('mixamorig:Neck_05')
    head = b.get('mixamorig:Head_06')
    l_upleg = b.get('mixamorig:LeftUpLeg_00')
    r_upleg = b.get('mixamorig:RightUpLeg_060')
    l_leg = b.get('mixamorig:LeftLeg_056')
    r_leg = b.get('mixamorig:RightLeg_061')
    l_foot = b.get('mixamorig:LeftFoot_057')
    r_foot = b.get('mixamorig:RightFoot_062')
    l_arm = b.get('mixamorig:LeftArm_09')
    r_arm = b.get('mixamorig:RightArm_033')
    l_fore = b.get('mixamorig:LeftForeArm_010')
    r_fore = b.get('mixamorig:RightForeArm_034')

    kfs = [
        # f, wx, wy, wz, hip_pitch, r_knee, l_knee
        (0,   0.0, -0.06, -0.32,  32.0,  90.0,  70.0), # Inicio desde fin de heavy_land
        (10,  0.0, -0.04, -0.18,  20.0,  55.0,  42.0), # Mano despega del suelo, torso se alza
        (20,  0.0, -0.02, -0.06,   8.0,  20.0,  15.0), # Incorporación atlética
        (30,  0.0,  0.00,  0.00,   0.0,   0.0,   0.0), # Totalmente erguido
    ]
    for f, wx, wy, wz, hp, rk, lk in kfs:
        if hips:
            key_hips_offset(hips, wx, wy, wz, f)
            key_bone_rot(hips, hp, 4.0 if f < 20 else 0, -2.0 if f < 20 else 0, f)
        if spine: key_bone_rot(spine, -hp * 0.22, 0, 0, f)
        if spine1: key_bone_rot(spine1, -hp * 0.16, 0, 0, f)
        if neck: key_bone_rot(neck, -8.0 if f < 20 else 0, 0, 0, f)
        if head: key_bone_rot(head, -18.0 if f < 20 else 0, 0, 0, f)
        
        if r_upleg: key_bone_rot(r_upleg, 14.0 * (1.0 - f / 30.0), 0, 4.0, f)
        if r_leg: key_bone_rot(r_leg, rk, 0, 0, f)
        if r_foot: key_bone_rot(r_foot, 20.0 * (1.0 - f / 30.0), 0, 0, f)
        
        if l_upleg: key_bone_rot(l_upleg, -40.0 * (1.0 - f / 30.0), 0, -4.0, f)
        if l_leg: key_bone_rot(l_leg, lk, 0, 0, f)
        if l_foot: key_bone_rot(l_foot, 0, 0, 0, f)
        
        if r_arm: key_bone_rot(r_arm, 18.0 * (1.0 - f / 30.0) + 4.0, 0, -25.0 * (1.0 - f / 30.0) + 6.0, f)
        if r_fore: key_bone_rot(r_fore, -14.0, 0, 0, f)
        if l_arm: key_bone_rot(l_arm, -20.0 * (1.0 - f / 30.0) + 4.0, 0, -30.0 * (1.0 - f / 30.0) - 6.0, f)
        if l_fore: key_bone_rot(l_fore, -14.0, 0, 0, f)

def build_crouch(arm):
    """
    nexo_crouch (24 frames / 0.8s):
    Agacharse (sigilo / compresión de perfil bajo): rodillas a 65°, torso a 22°, silueta reducida.
    """
    create_action(arm, 'nexo_crouch', 0, 24)
    b = arm.pose.bones
    hips = b.get('mixamorig:Hips_01')
    spine = b.get('mixamorig:Spine1_03')
    head = b.get('mixamorig:Head_06')
    l_upleg = b.get('mixamorig:LeftUpLeg_00')
    r_upleg = b.get('mixamorig:RightUpLeg_060')
    l_leg = b.get('mixamorig:LeftLeg_056')
    r_leg = b.get('mixamorig:RightLeg_061')
    l_foot = b.get('mixamorig:LeftFoot_057')
    r_foot = b.get('mixamorig:RightFoot_062')
    l_arm = b.get('mixamorig:LeftArm_09')
    r_arm = b.get('mixamorig:RightArm_033')

    kfs = [
        (0,   0.00,  0.0,  0.0),
        (12, -0.10, 14.0, 42.0),
        (24, -0.15, 22.0, 65.0), # Agachado completo
    ]
    for f, hz, hp, kb in kfs:
        if hips:
            key_bone_loc(hips, 0, 0, hz, f)
            key_bone_rot(hips, hp, 0, 0, f)
        if spine: key_bone_rot(spine, -hp * 0.35, 0, 0, f)
        if head: key_bone_rot(head, 12.0 if f > 10 else 0, 0, 0, f)
        if l_upleg: key_bone_rot(l_upleg, -kb * 0.6, 0, -4.0, f)
        if r_upleg: key_bone_rot(r_upleg, -kb * 0.6, 0, 4.0, f)
        if l_leg: key_bone_rot(l_leg, kb, 0, 0, f)
        if r_leg: key_bone_rot(r_leg, kb, 0, 0, f)
        if l_foot: key_bone_rot(l_foot, -kb * 0.25, 0, 0, f)
        if r_foot: key_bone_rot(r_foot, -kb * 0.25, 0, 0, f)
        if l_arm: key_bone_rot(l_arm, 14.0, 0, -12.0, f)
        if r_arm: key_bone_rot(r_arm, 14.0, 0, 12.0, f)

def build_crouch_stand(arm):
    """
    nexo_crouch_stand (20 frames / 0.66s):
    Levantarse desde la agachada de vuelta a postura erguida.
    """
    create_action(arm, 'nexo_crouch_stand', 0, 20)
    b = arm.pose.bones
    hips = b.get('mixamorig:Hips_01')
    spine = b.get('mixamorig:Spine1_03')
    head = b.get('mixamorig:Head_06')
    l_upleg = b.get('mixamorig:LeftUpLeg_00')
    r_upleg = b.get('mixamorig:RightUpLeg_060')
    l_leg = b.get('mixamorig:LeftLeg_056')
    r_leg = b.get('mixamorig:RightLeg_061')
    l_foot = b.get('mixamorig:LeftFoot_057')
    r_foot = b.get('mixamorig:RightFoot_062')
    l_arm = b.get('mixamorig:LeftArm_09')
    r_arm = b.get('mixamorig:RightArm_033')

    kfs = [
        (0,  -0.15, 22.0, 65.0),
        (10, -0.06, 10.0, 28.0),
        (20,  0.00,  0.0,  0.0),
    ]
    for f, hz, hp, kb in kfs:
        if hips:
            key_bone_loc(hips, 0, 0, hz, f)
            key_bone_rot(hips, hp, 0, 0, f)
        if spine: key_bone_rot(spine, -hp * 0.35, 0, 0, f)
        if head: key_bone_rot(head, 0, 0, 0, f)
        if l_upleg: key_bone_rot(l_upleg, -kb * 0.6, 0, -2.0, f)
        if r_upleg: key_bone_rot(r_upleg, -kb * 0.6, 0, 2.0, f)
        if l_leg: key_bone_rot(l_leg, kb, 0, 0, f)
        if r_leg: key_bone_rot(r_leg, kb, 0, 0, f)
        if l_foot: key_bone_rot(l_foot, 0, 0, 0, f)
        if r_foot: key_bone_rot(r_foot, 0, 0, 0, f)
        if l_arm: key_bone_rot(l_arm, 4.0, 0, -6.0, f)
        if r_arm: key_bone_rot(r_arm, 4.0, 0, 6.0, f)

def build_emote_salute(arm):
    """
    nexo_emote_salute (45 frames / 1.5s):
    Saludo militar / gladiador honorable: brazo derecho se alza por DELANTE del torso hasta la sien/casco.
    """
    create_action(arm, 'nexo_emote_salute', 0, 45)
    b = arm.pose.bones
    spine = b.get('mixamorig:Spine1_03')
    head = b.get('mixamorig:Head_06')
    r_arm = b.get('mixamorig:RightArm_033')
    r_fore = b.get('mixamorig:RightForeArm_034')
    r_hand = b.get('mixamorig:RightHand_035')
    l_arm = b.get('mixamorig:LeftArm_09')
    l_fore = b.get('mixamorig:LeftForeArm_010')

    # Keyframes: brazo por delante del torso (Z negativo en rotación de brazo mueve hacia el frente)
    kfs = [
        # f, ax, ay, az, fx, fy, fz, hand_p
        (0,    4.0,   0.0,   6.0,  -10.0, 0.0,   0.0,   0.0),
        (12, -50.0, -25.0, -55.0, -110.0, 0.0,  25.0,  15.0), # Mano al visor por delante de la sien
        (30, -50.0, -25.0, -55.0, -110.0, 0.0,  25.0,  15.0), # Pausa solemne erguida
        (45,   4.0,   0.0,   6.0,  -10.0, 0.0,   0.0,   0.0), # Retorno a reposo
    ]
    for f, ax, ay, az, fx, fy, fz, hp in kfs:
        if spine: key_bone_rot(spine, 0.0, 0, 0, f) # Espalda completamente recta
        if head: key_bone_rot(head, 0.0, 0, 0, f)
        if r_arm: key_bone_rot(r_arm, ax, ay, az, f)
        if r_fore: key_bone_rot(r_fore, fx, fy, fz, f)
        if r_hand: key_bone_rot(r_hand, hp, 0, 0, f)
        if l_arm: key_bone_rot(l_arm, 4.0, 0, -8.0, f)
        if l_fore: key_bone_rot(l_fore, -12.0, 0, 0, f)

def build_emote_thumbs_up(arm):
    """
    nexo_emote_thumbs_up (40 frames / 1.33s):
    Gesto de aprobación táctico: brazo derecho alzado por DELANTE del pecho con pulgar erguido y asentimiento firme.
    """
    create_action(arm, 'nexo_emote_thumbs_up', 0, 40)
    b = arm.pose.bones
    head = b.get('mixamorig:Head_06')
    r_arm = b.get('mixamorig:RightArm_033')
    r_fore = b.get('mixamorig:RightForeArm_034')
    r_hand = b.get('mixamorig:RightHand_035')
    r_thumb1 = b.get('mixamorig:RightHandThumb1_036')
    r_thumb2 = b.get('mixamorig:RightHandThumb2_037')
    l_arm = b.get('mixamorig:LeftArm_09')
    l_fore = b.get('mixamorig:LeftForeArm_010')

    kfs = [
        # f, ax, az, fx, fz, th1, th2, head_p
        (0,    4.0,   6.0,  -10.0,  0.0,   0.0,   0.0, 0.0),
        (12,  15.0, -45.0,  -55.0, 10.0, -35.0, -25.0, 6.0), # Pulgar alzado al frente del pecho
        (28,  15.0, -45.0,  -55.0, 10.0, -35.0, -25.0, 6.0), # Mantener aprobación
        (40,   4.0,   6.0,  -10.0,  0.0,   0.0,   0.0, 0.0), # Retorno
    ]
    for f, ax, az, fx, fz, th1, th2, hp in kfs:
        if head: key_bone_rot(head, hp, 0, 0, f) # Asentimiento afirmativo
        if r_arm: key_bone_rot(r_arm, ax, 0, az, f)
        if r_fore: key_bone_rot(r_fore, fx, 0, fz, f)
        if r_hand: key_bone_rot(r_hand, 20.0 if 12 <= f <= 28 else 0, 0, 0, f)
        if r_thumb1: key_bone_rot(r_thumb1, th1, 0, 0, f)
        if r_thumb2: key_bone_rot(r_thumb2, th2, 0, 0, f)
        if l_arm: key_bone_rot(l_arm, 4.0, 0, -8.0, f)
        if l_fore: key_bone_rot(l_fore, -12.0, 0, 0, f)

def build_emote_point(arm):
    """
    nexo_emote_point (45 frames / 1.5s):
    Señalamiento táctico hacia el objetivo: brazo derecho totalmente extendido al frente (-Y) por delante del torso.
    """
    create_action(arm, 'nexo_emote_point', 0, 45)
    b = arm.pose.bones
    spine = b.get('mixamorig:Spine1_03')
    head = b.get('mixamorig:Head_06')
    r_arm = b.get('mixamorig:RightArm_033')
    r_fore = b.get('mixamorig:RightForeArm_034')
    r_hand = b.get('mixamorig:RightHand_035')
    r_index1 = b.get('mixamorig:RightHandIndex1_040')
    l_arm = b.get('mixamorig:LeftArm_09')
    l_fore = b.get('mixamorig:LeftForeArm_010')

    kfs = [
        # f, ax, az, fx, spine_y, head_y
        (0,    4.0,   6.0, -10.0, 0.0, 0.0),
        (12,  10.0, -85.0, -10.0, 6.0, 8.0), # Brazo apuntando al horizonte al frente
        (32,  10.0, -85.0, -10.0, 6.0, 8.0), # Firmeza
        (45,   4.0,   6.0, -10.0, 0.0, 0.0), # Retorno
    ]
    for f, ax, az, fx, sy, hy in kfs:
        if spine: key_bone_rot(spine, 0, sy, 0, f)
        if head: key_bone_rot(head, 0, hy, 0, f)
        if r_arm: key_bone_rot(r_arm, ax, 0, az, f)
        if r_fore: key_bone_rot(r_fore, fx, 0, 0, f)
        if r_hand: key_bone_rot(r_hand, 0, 0, 0, f)
        if r_index1: key_bone_rot(r_index1, 0, 0, 0, f)
        if l_arm: key_bone_rot(l_arm, 4.0, 0, -8.0, f)
        if l_fore: key_bone_rot(l_fore, -12.0, 0, 0, f)

def build_emote_beckon(arm):
    """
    nexo_emote_beckon (50 frames / 1.66s):
    Gesto táctico de llamada ("Ven aquí" / Follow me):
    Brazo derecho alzado por DELANTE del pecho, antebrazo ejecutando doble ondulación de llamada hacia el pecho y cabeza ladeada.
    """
    create_action(arm, 'nexo_emote_beckon', 0, 50)
    b = arm.pose.bones
    spine = b.get('mixamorig:Spine1_03')
    head = b.get('mixamorig:Head_06')
    r_arm = b.get('mixamorig:RightArm_033')
    r_fore = b.get('mixamorig:RightForeArm_034')
    r_hand = b.get('mixamorig:RightHand_035')
    l_arm = b.get('mixamorig:LeftArm_09')
    l_fore = b.get('mixamorig:LeftForeArm_010')

    # Keyframes con brazo por DELANTE del torso (az = -55° empuja el brazo al frente)
    kfs = [
        # f, rap, ray, rar, rfp, rhp, hy, hp
        (0,    4.0, 0.0,   6.0,  -10.0,   0.0, 0.0, 0.0),
        (10,  15.0, 0.0, -55.0,  -45.0,  12.0, 6.0, 2.0), # Alza brazo por delante del pecho
        (18,  16.0, 0.0, -55.0,  -95.0,  28.0, 8.0, 3.0), # Tirón 1: flexiona mano hacia el pecho
        (26,  15.0, 0.0, -55.0,  -50.0,  12.0, 6.0, 2.0), # Relaja leve al frente
        (34,  16.0, 0.0, -55.0, -100.0,  30.0, 8.0, 4.0), # Tirón 2: llamada enérgica hacia sí
        (42,  10.0, 0.0, -30.0,  -35.0,  10.0, 3.0, 1.0), # Descendiendo
        (50,   4.0, 0.0,   6.0,  -10.0,   0.0, 0.0, 0.0), # Retorno neutro
    ]
    for f, rap, ray, rar, rfp, rhp, hy, hp in kfs:
        if spine: key_bone_rot(spine, 0, hy * 0.3, 0, f)
        if head: key_bone_rot(head, hp, hy, 0, f)
        if r_arm: key_bone_rot(r_arm, rap, ray, rar, f)
        if r_fore: key_bone_rot(r_fore, rfp, 0, 0, f)
        if r_hand: key_bone_rot(r_hand, rhp, 0, 0, f)
        if l_arm: key_bone_rot(l_arm, 4.0, 0, -8.0, f)
        if l_fore: key_bone_rot(l_fore, -12.0, 0, 0, f)

def build_emote_cheer(arm):
    """
    nexo_emote_cheer (55 frames / 1.83s):
    Celebración épica de victoria: flexión preparatoria y puñetazo explosivo al cielo por delante y arriba de la cabeza.
    """
    create_action(arm, 'nexo_emote_cheer', 0, 55)
    b = arm.pose.bones
    hips = b.get('mixamorig:Hips_01')
    spine = b.get('mixamorig:Spine_02')
    spine1 = b.get('mixamorig:Spine1_03')
    head = b.get('mixamorig:Head_06')
    r_arm = b.get('mixamorig:RightArm_033')
    r_fore = b.get('mixamorig:RightForeArm_034')
    r_hand = b.get('mixamorig:RightHand_035')
    l_arm = b.get('mixamorig:LeftArm_09')
    l_fore = b.get('mixamorig:LeftForeArm_010')
    l_hand = b.get('mixamorig:LeftHand_011')
    l_upleg = b.get('mixamorig:LeftUpLeg_00')
    r_upleg = b.get('mixamorig:RightUpLeg_060')
    l_leg = b.get('mixamorig:LeftLeg_056')
    r_leg = b.get('mixamorig:RightLeg_061')

    # Keyframes: 0 (idle), 8 (agachada carga), 18 (fist pump explosivo al cielo), 36 (mantener victoria), 46 (descenso), 55 (idle)
    kfs = [
        # f, hip_z, ax, az, fx, head_p, knee
        (0,   0.00,    4.0,   6.0, -10.0,   0.0,  0.0),
        (8,  -0.07,   15.0, -35.0, -65.0,   6.0, 26.0), # Compresión preparatoria
        (18,  0.03, -120.0, -20.0, -20.0, -16.0,  4.0), # ¡Puño derecho directo al cielo!
        (28,  0.03, -120.0, -20.0, -20.0, -18.0,  4.0), # Pico de gloria
        (38,  0.02, -115.0, -20.0, -25.0, -14.0,  4.0), # Manteniendo el festejo
        (46, -0.01,  -40.0, -40.0, -45.0,  -4.0,  8.0), # Descendiendo
        (55,  0.00,    4.0,   6.0, -10.0,   0.0,  0.0), # Retorno
    ]
    for f, hz, ax, az, fx, hp, kn in kfs:
        if hips:
            key_bone_loc(hips, 0, 0, hz, f)
            key_bone_rot(hips, 0.0, 0, 0, f)
        if spine: key_bone_rot(spine, -6.0 if 18 <= f <= 38 else 0, 0, 0, f) # Pecho alzado de triunfo
        if spine1: key_bone_rot(spine1, -6.0 if 18 <= f <= 38 else 0, 0, 0, f)
        if head: key_bone_rot(head, hp, 0, 0, f) # Cabeza alzada mirando el puño victorioso
        if r_arm: key_bone_rot(r_arm, ax, 0, az, f)
        if r_fore: key_bone_rot(r_fore, fx, 0, 0, f)
        if r_hand: key_bone_rot(r_hand, 20.0 if 18 <= f <= 38 else 0, 0, 0, f) # Puño cerrado
        if l_arm: key_bone_rot(l_arm, 15.0 if 18 <= f <= 38 else 4.0, 0, -25.0 if 18 <= f <= 38 else -8.0, f)
        if l_fore: key_bone_rot(l_fore, -30.0 if 18 <= f <= 38 else -12.0, 0, 0, f)
        if l_hand: key_bone_rot(l_hand, 15.0 if 18 <= f <= 38 else 0, 0, 0, f)
        if l_upleg: key_bone_rot(l_upleg, -kn * 0.5, 0, -2.0, f)
        if r_upleg: key_bone_rot(r_upleg, -kn * 0.5, 0, 2.0, f)
        if l_leg: key_bone_rot(l_leg, kn, 0, 0, f)
        if r_leg: key_bone_rot(r_leg, kn, 0, 0, f)

# =============================================================================
# FASE 3: EL VUELO COMO MECÁNICA CENTRAL
# =============================================================================

def build_takeoff(arm):
    """
    nexo_takeoff (24 frames / 0.8s):
    Flexión anticipatoria previa (crouch), ignición de propulsores y despegue explosivo.
    """
    create_action(arm, 'nexo_takeoff', 0, 24)
    b = arm.pose.bones
    hips = b.get('mixamorig:Hips_01')
    spine = b.get('mixamorig:Spine1_03')
    l_leg = b.get('mixamorig:LeftLeg_056')
    r_leg = b.get('mixamorig:RightLeg_061')
    l_upleg = b.get('mixamorig:LeftUpLeg_00')
    r_upleg = b.get('mixamorig:RightUpLeg_060')
    l_arm = b.get('mixamorig:LeftArm_09')
    r_arm = b.get('mixamorig:RightArm_033')
    
    # Frames:
    # 0..8: Agachada / compresión
    # 9..16: Extensión explosiva vertical
    # 17..24: Estabilización en suspensión
    kfs = [
        # f, hip_z, hip_pitch, knee_bend, arm_angle
        (0,   0.0,    0.0,   0.0,   0.0),
        (7,  -0.08,   12.0,  42.0, -18.0),  # Compresión máxima
        (13,  0.06,  -6.0,   6.0,   25.0),  # Impulso hacia arriba
        (18,  0.10,  -4.0,  12.0,   18.0),  # Flotabilidad
        (24,  0.08,  -2.0,  16.0,   12.0),  # Enlace con hover
    ]
    for f, hz, hp, kb, aa in kfs:
        if hips:
            key_bone_loc(hips, 0, 0, hz, f)
            key_bone_rot(hips, hp, 0, 0, f)
        if spine:
            key_bone_rot(spine, -hp * 0.5, 0, 0, f)
        if l_upleg: key_bone_rot(l_upleg, -kb * 0.6, 0, -3.0, f)
        if r_upleg: key_bone_rot(r_upleg, -kb * 0.6, 0, 3.0, f)
        if l_leg: key_bone_rot(l_leg, kb, 0, 0, f)
        if r_leg: key_bone_rot(r_leg, kb, 0, 0, f)
        if l_arm: key_bone_rot(l_arm, aa, 0, -aa * 0.4, f)
        if r_arm: key_bone_rot(r_arm, aa, 0, aa * 0.4, f)

def build_hover(arm):
    """
    nexo_hover (60 frames / 2.0s):
    Suspensión vertical totalmente erguida con espalda recta y postura firme:
    Cuerpo vertical (0°), columna recta, brazos cayendo relajados a los lados y piernas extendidas.
    """
    create_action(arm, 'nexo_hover', 0, 60)
    b = arm.pose.bones
    hips = b.get('mixamorig:Hips_01')
    spine = b.get('mixamorig:Spine1_03')
    head = b.get('mixamorig:Head_06')
    l_arm = b.get('mixamorig:LeftArm_09')
    r_arm = b.get('mixamorig:RightArm_033')
    l_fore = b.get('mixamorig:LeftForeArm_010')
    r_fore = b.get('mixamorig:RightForeArm_034')
    l_upleg = b.get('mixamorig:LeftUpLeg_00')
    r_upleg = b.get('mixamorig:RightUpLeg_060')
    l_leg = b.get('mixamorig:LeftLeg_056')
    r_leg = b.get('mixamorig:RightLeg_061')
    l_foot = b.get('mixamorig:LeftFoot_057')
    r_foot = b.get('mixamorig:RightFoot_062')
    
    for f in [0, 15, 30, 45, 60]:
        t = (f / 60.0) * math.pi * 2.0
        bob = math.sin(t)
        
        # Hips: postura estrictamente recta y erguida con suave oscilación vertical
        if hips:
            key_bone_loc(hips, 0, 0, bob * 0.015, f)
            key_bone_rot(hips, 0.0, 0, 0, f)
        if spine:
            key_bone_rot(spine, 0.0, 0, 0, f)
        if head:
            key_bone_rot(head, 0.0, 0, 0, f)
            
        # Brazos descansando rectos y relajados a los costados
        if l_arm: key_bone_rot(l_arm, 4.0, 0, -8.0, f)
        if r_arm: key_bone_rot(r_arm, 4.0, 0, 8.0, f)
        if l_fore: key_bone_rot(l_fore, -12.0, 0, 0, f)
        if r_fore: key_bone_rot(r_fore, -12.0, 0, 0, f)
        
        # Piernas suspendidas verticalmente con puntas extendidas hacia abajo
        if l_upleg: key_bone_rot(l_upleg, 0.0, 0, -2.0, f)
        if r_upleg: key_bone_rot(r_upleg, 0.0, 0, 2.0, f)
        if l_leg: key_bone_rot(l_leg, 6.0, 0, 0, f)
        if r_leg: key_bone_rot(r_leg, 6.0, 0, 0, f)
        if l_foot: key_bone_rot(l_foot, 18.0, 0, 0, f)
        if r_foot: key_bone_rot(r_foot, 18.0, 0, 0, f)

def build_fly_forward(arm):
    """
    nexo_fly_forward (40 frames / 1.33s loop):
    Vuelo crucero estilo torpedo aerodinámico:
    Cuerpo inclinado hacia adelante a +46° (cabeza hacia -Y en mundo), columna estilizada,
    brazos ceñidos como aletas con micro-ajustes y piernas extendidas en flecha.
    """
    create_action(arm, 'nexo_fly_forward', 0, 40)
    b = arm.pose.bones
    hips = b.get('mixamorig:Hips_01')
    spine = b.get('mixamorig:Spine_02')
    spine1 = b.get('mixamorig:Spine1_03')
    head = b.get('mixamorig:Head_06')
    l_arm = b.get('mixamorig:LeftArm_09')
    r_arm = b.get('mixamorig:RightArm_033')
    l_fore = b.get('mixamorig:LeftForeArm_010')
    r_fore = b.get('mixamorig:RightForeArm_034')
    l_hand = b.get('mixamorig:LeftHand_011')
    r_hand = b.get('mixamorig:RightHand_035')
    l_upleg = b.get('mixamorig:LeftUpLeg_00')
    r_upleg = b.get('mixamorig:RightUpLeg_060')
    l_leg = b.get('mixamorig:LeftLeg_056')
    r_leg = b.get('mixamorig:RightLeg_061')
    l_foot = b.get('mixamorig:LeftFoot_057')
    r_foot = b.get('mixamorig:RightFoot_062')
    
    for f in [0, 10, 20, 30, 40]:
        t = (f / 40.0) * math.pi * 2.0
        wave = math.sin(t)
        
        # Inclinación hacia adelante a +46° (torpedo horizontal hacia -Y)
        if hips:
            key_bone_loc(hips, 0, 0, wave * 0.008, f)
            key_bone_rot(hips, 46.0 + wave * 0.8, 0, 0, f)
        if spine:
            key_bone_rot(spine, -10.0 - wave * 0.4, 0, 0, f)
        if spine1:
            key_bone_rot(spine1, -12.0 - wave * 0.4, 0, 0, f)
        if head:
            # Cabeza orientada al horizonte de avance
            key_bone_rot(head, -36.0 + wave * 0.6, 0, 0, f)
            
        # Brazos pegados a los costados actuando como estabilizadores
        if l_arm: key_bone_rot(l_arm, -14.0, 0, -6.0, f)
        if r_arm: key_bone_rot(r_arm, -14.0, 0, 6.0, f)
        if l_fore: key_bone_rot(l_fore, -4.0, 0, 0, f)
        if r_fore: key_bone_rot(r_fore, -4.0, 0, 0, f)
        if l_hand: key_bone_rot(l_hand, 0.0, 0, 0, f)
        if r_hand: key_bone_rot(r_hand, 0.0, 0, 0, f)
        
        # Piernas estilizadas extendidas hacia atrás
        if l_upleg: key_bone_rot(l_upleg, -18.0 + wave * 0.4, 0, -1.0, f)
        if r_upleg: key_bone_rot(r_upleg, -18.0 - wave * 0.4, 0, 1.0, f)
        if l_leg: key_bone_rot(l_leg, 4.0, 0, 0, f)
        if r_leg: key_bone_rot(r_leg, 4.0, 0, 0, f)
        if l_foot: key_bone_rot(l_foot, 36.0, 0, 0, f)
        if r_foot: key_bone_rot(r_foot, 36.0, 0, 0, f)

def build_bank(arm, direction='left'):
    """
    nexo_bank_left / right (20 frames):
    Viraje con alabeo del torso a 35°, hombro interior retraído y torsión de columna.
    """
    sign = 1.0 if direction == 'left' else -1.0
    act_name = f'nexo_bank_{direction}'
    create_action(arm, act_name, 0, 20)
    b = arm.pose.bones
    hips = b.get('mixamorig:Hips_01')
    spine = b.get('mixamorig:Spine1_03')
    head = b.get('mixamorig:Head_06')
    l_arm = b.get('mixamorig:LeftArm_09')
    r_arm = b.get('mixamorig:RightArm_033')
    
    kfs = [
        (0,  0.0),
        (10, 1.0),
        (20, 0.0)
    ]
    for f, weight in kfs:
        roll = sign * weight * 35.0
        yaw = sign * weight * 15.0
        if hips:
            key_bone_rot(hips, 42.0, yaw * 0.5, roll * 0.7, f)
        if spine:
            key_bone_rot(spine, -10.0, yaw * 0.5, roll * 0.4, f)
        if head:
            key_bone_rot(head, -34.0, yaw * 0.8, -roll * 0.2, f)
        if l_arm:
            key_bone_rot(l_arm, -12.0, 0, -8.0 - (roll if sign > 0 else 0), f)
        if r_arm:
            key_bone_rot(r_arm, -12.0, 0, 8.0 + (roll if sign < 0 else 0), f)

def build_boost(arm):
    """
    nexo_boost (30 frames loop):
    Postura hipersónica ultra-aerodinámica (Mach 1+):
    Inclinación torpedo a +56°, brazos sellados a los flancos, columna rígida y pies en flecha pura.
    """
    create_action(arm, 'nexo_boost', 0, 30)
    b = arm.pose.bones
    hips = b.get('mixamorig:Hips_01')
    spine = b.get('mixamorig:Spine_02')
    spine1 = b.get('mixamorig:Spine1_03')
    head = b.get('mixamorig:Head_06')
    l_arm = b.get('mixamorig:LeftArm_09')
    r_arm = b.get('mixamorig:RightArm_033')
    l_fore = b.get('mixamorig:LeftForeArm_010')
    r_fore = b.get('mixamorig:RightForeArm_034')
    l_upleg = b.get('mixamorig:LeftUpLeg_00')
    r_upleg = b.get('mixamorig:RightUpLeg_060')
    l_foot = b.get('mixamorig:LeftFoot_057')
    r_foot = b.get('mixamorig:RightFoot_062')
    
    for f in [0, 15, 30]:
        t = (f / 30.0) * math.pi * 2.0
        vibe = math.sin(t * 2.0) * 0.4
        if hips: key_bone_rot(hips, 56.0 + vibe, 0, 0, f)
        if spine: key_bone_rot(spine, -12.0, 0, 0, f)
        if spine1: key_bone_rot(spine1, -14.0, 0, 0, f)
        if head: key_bone_rot(head, -42.0 + vibe, 0, 0, f)
        # Brazos ceñidos
        if l_arm: key_bone_rot(l_arm, -18.0, 0, -4.0, f)
        if r_arm: key_bone_rot(r_arm, -18.0, 0, 4.0, f)
        if l_fore: key_bone_rot(l_fore, -2.0, 0, 0, f)
        if r_fore: key_bone_rot(r_fore, -2.0, 0, 0, f)
        # Piernas tensas alineadas
        if l_upleg: key_bone_rot(l_upleg, -22.0, 0, -1.0, f)
        if r_upleg: key_bone_rot(r_upleg, -22.0, 0, 1.0, f)
        if l_foot: key_bone_rot(l_foot, 45.0, 0, 0, f)
        if r_foot: key_bone_rot(r_foot, 45.0, 0, 0, f)

def build_air_brake(arm):
    """
    nexo_air_brake (30 frames / 1.0s):
    Frenada agresiva y orgánica con contrapulsión:
    Torso arqueándose atrás contra el viento (-24°), brazos proyectados al frente con codos separados
    y orientados hacia adelante (sin chocar por detrás), palmas abiertas descargando repulsión inversa,
    piernas en cuña asimétrica amortiguando la fuerza G.
    """
    create_action(arm, 'nexo_air_brake', 0, 30)
    b = arm.pose.bones
    hips = b.get('mixamorig:Hips_01')
    spine = b.get('mixamorig:Spine_02')
    spine1 = b.get('mixamorig:Spine1_03')
    head = b.get('mixamorig:Head_06')
    l_arm = b.get('mixamorig:LeftArm_09')
    r_arm = b.get('mixamorig:RightArm_033')
    l_fore = b.get('mixamorig:LeftForeArm_010')
    r_fore = b.get('mixamorig:RightForeArm_034')
    l_hand = b.get('mixamorig:LeftHand_011')
    r_hand = b.get('mixamorig:RightHand_035')
    l_upleg = b.get('mixamorig:LeftUpLeg_00')
    r_upleg = b.get('mixamorig:RightUpLeg_060')
    l_leg = b.get('mixamorig:LeftLeg_056')
    r_leg = b.get('mixamorig:RightLeg_061')
    l_foot = b.get('mixamorig:LeftFoot_057')
    r_foot = b.get('mixamorig:RightFoot_062')
    
    # f, hip_p, arm_p, arm_z, fore_p, r_knee, l_knee, head_p
    # NOTA: arm_z negativo en r_arm y positivo en l_arm proyecta los codos y brazos HACIA ADELANTE
    kfs = [
        # 0: Transición desde torpedo
        (0,   46.0, -14.0,   6.0,  -4.0,   4.0,   4.0, -36.0),
        # 7: Escudo aerodinámico agresivo (codos al frente, torso atrás)
        (7,  -24.0,  25.0,  50.0, -35.0,  55.0,  22.0,  12.0),
        # 16: Pico de desaceleración sostenida
        (16, -20.0,  22.0,  48.0, -32.0,  48.0,  18.0,   8.0),
        # 24: Disipación de inercia
        (24, -10.0,  14.0,  30.0, -22.0,  26.0,  12.0,   4.0),
        # 30: Asentamiento hacia suspensión vertical
        (30,   0.0,   4.0,   8.0, -12.0,   6.0,   6.0,   0.0),
    ]
    for f, hp, ap, az, fp, rk, lk, head_p in kfs:
        if hips: key_bone_rot(hips, hp, 0, 0, f)
        if spine: key_bone_rot(spine, -hp * 0.35, 0, 0, f)
        if spine1: key_bone_rot(spine1, -hp * 0.25, 0, 0, f)
        if head: key_bone_rot(head, head_p, 0, 0, f)
        
        # Brazos abiertos HACIA ADELANTE con codos al frente (distancia > 0.40m)
        if l_arm: key_bone_rot(l_arm, ap, 0, az, f)
        if r_arm: key_bone_rot(r_arm, ap, 0, -az, f)
        if l_fore: key_bone_rot(l_fore, fp, 0, 0, f)
        if r_fore: key_bone_rot(r_fore, fp, 0, 0, f)
        if l_hand: key_bone_rot(l_hand, 30.0 if f in [7, 16] else 8.0, 0, 0, f)
        if r_hand: key_bone_rot(r_hand, 30.0 if f in [7, 16] else 8.0, 0, 0, f)
        
        # Piernas asimétricas en cuña amortiguadora
        if r_upleg: key_bone_rot(r_upleg, -rk * 0.5, 0, 4.0, f)
        if r_leg: key_bone_rot(r_leg, rk, 0, 0, f)
        if r_foot: key_bone_rot(r_foot, -14.0 if f in [7, 16] else 12.0, 0, 0, f)
        
        if l_upleg: key_bone_rot(l_upleg, -lk * 0.4, 0, -4.0, f)
        if l_leg: key_bone_rot(l_leg, lk, 0, 0, f)
        if l_foot: key_bone_rot(l_foot, 16.0 if f in [7, 16] else 12.0, 0, 0, f)

def build_landing(arm):
    """
    nexo_landing (36 frames / 1.20s):
    Aterrizaje Heroico Original JarBees ("Kinetic Strikedown Touchdown"):
    Anticipación aérea -> impacto épico asimétrico con descenso pélvico (-0.40m),
    brazo derecho disipando energía cinética hacia el suelo por delante,
    brazo izquierdo desplegado atrás como alerón estabilizador aerodinámico,
    cabeza y visor HUD firmemente alzados hacia el horizonte desafiante ->
    amortiguación hidráulica y elevación atlética fluida hacia guardia neutral.
    """
    create_action(arm, 'nexo_landing', 0, 36)
    b = arm.pose.bones
    hips = b.get('mixamorig:Hips_01')
    spine = b.get('mixamorig:Spine_02')
    spine1 = b.get('mixamorig:Spine1_03')
    neck = b.get('mixamorig:Neck_05')
    head = b.get('mixamorig:Head_06')
    l_leg = b.get('mixamorig:LeftLeg_056')
    r_leg = b.get('mixamorig:RightLeg_061')
    l_upleg = b.get('mixamorig:LeftUpLeg_00')
    r_upleg = b.get('mixamorig:RightUpLeg_060')
    r_shoulder = b.get('mixamorig:RightShoulder_032')
    l_shoulder = b.get('mixamorig:LeftShoulder_08')
    l_arm = b.get('mixamorig:LeftArm_09')
    r_arm = b.get('mixamorig:RightArm_033')
    l_fore = b.get('mixamorig:LeftForeArm_010')
    r_fore = b.get('mixamorig:RightForeArm_034')
    l_hand = b.get('mixamorig:LeftHand_011')
    r_hand = b.get('mixamorig:RightHand_035')
    l_foot = b.get('mixamorig:LeftFoot_057')
    r_foot = b.get('mixamorig:RightFoot_062')

    # f, wx, wy, wz, hip_p, hip_y, hip_r, lk, rk, r_arm_p, r_arm_z, l_arm_p, l_arm_z, head_p
    kfs = [
        # 0: Anticipación aérea (toes extendidos hacia abajo, brazos preparándose)
        (0,   0.0,  0.00,  0.08,   6.0,  0.0,  0.0,  18.0,  18.0,  14.0, -20.0, -12.0, -25.0,  -6.0),
        # 6: Contacto inicial de suelas
        (6,   0.0, -0.04, -0.16,  20.0,  4.0, -2.0,  55.0,  65.0,  28.0, -35.0, -25.0, -40.0, -18.0),
        # 14: Impacto Cinético Heroico Máximo (Strikedown Pose)
        (14,  0.0, -0.08, -0.40,  38.0, 10.0, -4.0,  80.0, 102.0,  38.0, -48.0, -36.0, -54.0, -30.0),
        # 18: Retención heroica del impacto (suspensión y repulsores disipando plasma)
        (18,  0.0, -0.08, -0.40,  38.0, 10.0, -4.0,  80.0, 102.0,  38.0, -48.0, -36.0, -54.0, -30.0),
        # 25: Descompresión elástica y comienzo de elevación
        (25,  0.0, -0.04, -0.18,  18.0,  4.0, -2.0,  38.0,  48.0,  18.0, -24.0, -16.0, -28.0, -14.0),
        # 36: Retorno firme a guardia erguida en reposo
        (36,  0.0,  0.00,  0.00,   0.0,  0.0,  0.0,   0.0,   0.0,   4.0,   6.0,   4.0,  -6.0,   0.0),
    ]

    for f, wx, wy, wz, hp, hy, hr, lk, rk, rap, raz, lap, laz, headp in kfs:
        t = f / 36.0
        # Pelvis y columna
        if hips:
            key_hips_offset(hips, wx, wy, wz, f)
            key_bone_rot(hips, hp, hy, hr, f)
        if spine: key_bone_rot(spine, -hp * 0.22, 0, 0, f)
        if spine1: key_bone_rot(spine1, -hp * 0.16, 0, 0, f)
        if neck: key_bone_rot(neck, headp * 0.4, 0, 0, f)
        if head: key_bone_rot(head, headp, 0, 0, f) # Visor firmemente al horizonte
        
        # Pierna izquierda: pilar delantero flexionado con pie firme
        if l_upleg: key_bone_rot(l_upleg, -lk * 0.75, -lk * 0.12, -lk * 0.25, f)
        if l_leg: key_bone_rot(l_leg, lk, 0, 0, f)
        if l_foot: key_bone_rot(l_foot, -18.0 if 12 <= f <= 20 else (20.0 if f == 0 else 0.0), 0, 0, f)
        
        # Pierna derecha: arrodillada amortiguando hacia atrás con propulsor
        if r_upleg: key_bone_rot(r_upleg, rk * 0.20, rk * 0.08, rk * 0.16, f)
        if r_leg: key_bone_rot(r_leg, rk, 0, 0, f)
        if r_foot: key_bone_rot(r_foot, 36.0 if 12 <= f <= 20 else (20.0 if f == 0 else 0.0), 0, 0, f)
        
        # Brazo derecho: strikedown cinético al frente hacia la tierra
        if r_shoulder: key_bone_rot(r_shoulder, 20.0 if 12 <= f <= 20 else 0.0, 0, -35.0 if 12 <= f <= 20 else 0.0, f)
        if r_arm: key_bone_rot(r_arm, rap, -15.0 if 12 <= f <= 20 else 0.0, raz, f)
        if r_fore: key_bone_rot(r_fore, -28.0 if 12 <= f <= 20 else -14.0, 10.0 if 12 <= f <= 20 else 0.0, 5.0 if 12 <= f <= 20 else 0.0, f)
        if r_hand: key_bone_rot(r_hand, 20.0 if 12 <= f <= 20 else 0.0, 0, 0, f)
        
        # Brazo izquierdo: alerón estabilizador aerodinámico atrás
        if l_shoulder: key_bone_rot(l_shoulder, -10.0 if 12 <= f <= 20 else 0.0, 0, 15.0 if 12 <= f <= 20 else 0.0, f)
        if l_arm: key_bone_rot(l_arm, lap, -12.0 if 12 <= f <= 20 else 0.0, laz, f)
        if l_fore: key_bone_rot(l_fore, -52.0 if 12 <= f <= 20 else -14.0, 0, -10.0 if 12 <= f <= 20 else 0.0, f)
        if l_hand: key_bone_rot(l_hand, 15.0 if 12 <= f <= 20 else 0.0, 0, 0, f)

# =============================================================================
# GENERADOR Y PUSHER A NLA TRACKS
# =============================================================================

def generate_all_nexo_animations(arm):
    print("🎬 =============================================================")
    print("⚡ GENERANDO SET DE ANIMACIONES JARBEES: NEXO-01 (FASES 1 Y 3)")
    print("🎬 =============================================================")
    
    # Fase 1: Tierra y Reposo
    print("  -> Generando nexo_idle...")
    build_idle(arm)
    print("  -> Generando nexo_walk...")
    build_walk(arm)
    print("  -> Generando nexo_run...")
    build_run(arm)
    print("  -> Generando nexo_turn_left / right...")
    build_turn(arm, 'left')
    build_turn(arm, 'right')
    print("  -> Generando nexo_look_around...")
    build_look_around(arm)
    
    # Fase 2: Peso e Impacto
    print("  -> Generando nexo_jump_start...")
    build_jump_start(arm)
    print("  -> Generando nexo_jump_loop...")
    build_jump_loop(arm)
    print("  -> Generando nexo_jump_land...")
    build_jump_land(arm)
    print("  -> Generando nexo_heavy_fall...")
    build_heavy_fall(arm)
    print("  -> Generando nexo_heavy_land...")
    build_heavy_land(arm)
    print("  -> Generando nexo_recovery...")
    build_recovery(arm)
    print("  -> Generando nexo_crouch...")
    build_crouch(arm)
    print("  -> Generando nexo_crouch_stand...")
    build_crouch_stand(arm)
    print("  -> Generando nexo_emote_salute...")
    build_emote_salute(arm)
    print("  -> Generando nexo_emote_thumbs_up...")
    build_emote_thumbs_up(arm)
    print("  -> Generando nexo_emote_point...")
    build_emote_point(arm)
    print("  -> Generando nexo_emote_beckon...")
    build_emote_beckon(arm)
    print("  -> Generando nexo_emote_cheer...")
    build_emote_cheer(arm)

    # Fase 3: Vuelo como Mecánica Central
    print("  -> Generando nexo_takeoff...")
    build_takeoff(arm)
    print("  -> Generando nexo_hover...")
    build_hover(arm)
    print("  -> Generando nexo_fly_forward...")
    build_fly_forward(arm)
    print("  -> Generando nexo_bank_left / right...")
    build_bank(arm, 'left')
    build_bank(arm, 'right')
    print("  -> Generando nexo_boost...")
    build_boost(arm)
    print("  -> Generando nexo_air_brake...")
    build_air_brake(arm)
    print("  -> Generando nexo_landing...")
    build_landing(arm)
    
    # Aliases de compatibilidad directa
    if not bpy.data.actions.get('hover') and bpy.data.actions.get('nexo_hover'):
        act_h = bpy.data.actions.get('nexo_hover').copy()
        act_h.name = 'hover'
        act_h.use_fake_user = True
    if not bpy.data.actions.get('flight') and bpy.data.actions.get('nexo_fly_forward'):
        act_f = bpy.data.actions.get('nexo_fly_forward').copy()
        act_f.name = 'flight'
        act_f.use_fake_user = True

    # Push a NLA tracks para exportación glTF multi-acción completa
    print("📦 Asignando acciones a NLA Tracks para exportación glTF...")
    if not arm.animation_data:
        arm.animation_data_create()
        
    for act in bpy.data.actions:
        if act.name.startswith('nexo_') or act.name in ['hover', 'flight']:
            act.use_fake_user = True
            # Crear track si no existe
            track = arm.animation_data.nla_tracks.new()
            track.name = f"Track_{act.name}"
            start_f = int(act.frame_range[0])
            track.strips.new(act.name, start_f, act)
            print(f"    ✓ Track NLA vinculado: {act.name} ({act.frame_range[0]:.0f}..{act.frame_range[1]:.0f})")
            
    # Restaurar pose neutral y dejar 'nexo_idle' activa
    reset_pose(arm)
    arm.animation_data.action = bpy.data.actions.get('nexo_idle')
    print("✨ Set completo de animaciones NEXO-01 horneado y listo para exportación glTF!")
