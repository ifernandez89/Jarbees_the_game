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
    nexo_walk (36 frames / 1.2s a 30 FPS) - Modo Chill & Badass Armored Walker:
    Ciclo de caminata bipedal con zancada amplia (pasos largos), postura ancha (abducción paralela),
    braceo pendular relajado a los costados del torso (libre de la espalda), rebote de amortiguación
    vertical y actitud heroica confiada.
    """
    create_action(arm, 'nexo_walk', 0, 36)
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
    l_hand = b.get('mixamorig:LeftHand_011')
    r_hand = b.get('mixamorig:RightHand_035')
    
    # 36 frames: ciclo completo horneado fotograma a fotograma para máxima fluidez
    for f in range(0, 37):
        phase = (f / 36.0) * math.pi * 2.0
        s = math.sin(phase)
        c = math.cos(phase)
        
        # 1. Hips (Pelvis): amortiguación hidráulica de la armadura (doble rebote rítmico)
        if hips:
            bounce = math.cos(phase * 2.0) * -0.016
            key_bone_loc(hips, s * 0.005, 0, bounce, f)
            # Postura decidida: inclinación frontal sutil (-2.0°) y giro pélvico natural (yaw +-1.5°)
            key_bone_rot(hips, -2.0, s * 1.5, -s * 0.8, f)
            
        # 2. Torso y Cabeza: porte erguido, hombros anchos y contra-torsión sutil
        if spine:
            key_bone_rot(spine, 2.0, -s * 1.2, s * 0.6, f)
        if spine1:
            key_bone_rot(spine1, 1.5, -s * 1.0, 0, f)
        if neck:
            key_bone_rot(neck, -1.0, 0, 0, f)
        if head:
            key_bone_rot(head, 1.5, s * 0.5, 0, f)
            
        # 3. Piernas: zancada amplia (pasos largos) y postura ancha (pies en carriles paralelos)
        # Izquierda
        l_pitch = s * 28.0
        l_knee = max(0.0, -c * 40.0) if s > -0.2 else 3.0
        l_ankle = -s * 14.0
        if l_upleg:
            # Z = -4.5° mantiene la pierna separada al ancho de caderas (sin pisar en cuerda floja)
            key_bone_rot(l_upleg, l_pitch, 0, -4.5, f)
        if l_leg:
            key_bone_rot(l_leg, l_knee, 0, 0, f)
        if l_foot:
            key_bone_rot(l_foot, l_ankle, 0, 0, f)
            
        # Derecha (fase opuesta)
        r_pitch = -s * 28.0
        r_knee = max(0.0, c * 40.0) if s < 0.2 else 3.0
        r_ankle = s * 14.0
        if r_upleg:
            # Z = 4.5° apertura simétrica
            key_bone_rot(r_upleg, r_pitch, 0, 4.5, f)
        if r_leg:
            key_bone_rot(r_leg, r_knee, 0, 0, f)
        if r_foot:
            key_bone_rot(r_foot, r_ankle, 0, 0, f)
            
        # 4. Brazos: braceo pendular adelante/atrás sobre el eje sagital (Z local),
        # manteniendo separación lateral fija y constante (X local = 4.0°) sin aleteo ni ladeo izq-der.
        # Izquierda: s < 0 (pierna izq atrás) -> brazo izq adelante (Z negativo)
        l_arm_z = s * 18.0 - 4.0
        # Derecha: s > 0 (pierna der atrás) -> brazo der adelante (Z positivo)
        r_arm_z = s * 18.0 + 4.0
        if l_arm:
            key_bone_rot(l_arm, 4.0, 0, l_arm_z, f)
        if r_arm:
            key_bone_rot(r_arm, 4.0, 0, r_arm_z, f)
            
        # Antebrazos: flexión natural de codo hacia adelante al avanzar el brazo
        if l_fore:
            l_fore_z = -10.0 + min(0.0, s * 12.0)
            key_bone_rot(l_fore, 0, 0, l_fore_z, f)
        if r_fore:
            r_fore_z = 10.0 + max(0.0, s * 12.0)
            key_bone_rot(r_fore, 0, 0, r_fore_z, f)
        if l_hand:
            key_bone_rot(l_hand, 0, 0, 0, f)
        if r_hand:
            key_bone_rot(r_hand, 0, 0, 0, f)

def curl_fist(b, side, curl, f):
    """Cierra los dedos de la mano en puño táctico (+X en Mixamo)."""
    indices = ['Index', 'Middle', 'Ring', 'Pinky']
    for ind in indices:
        for seg in ['1', '2', '3']:
            for name, bone in b.items():
                if f"mixamorig:{side}Hand{ind}{seg}" in name:
                    factor = 1.0 if seg == '1' else (0.9 if seg == '2' else 0.75)
                    key_bone_rot(bone, curl * factor, 0.0, 0.0, f)
    # Pulgar recogido
    for seg in ['1', '2', '3']:
        for name, bone in b.items():
            if f"mixamorig:{side}HandThumb{seg}" in name:
                key_bone_rot(bone, curl * 0.5, 0.0, -15.0 if side == 'Left' else 15.0, f)

def build_run(arm):
    """
    nexo_run (24 frames / 0.8s a 30 FPS) — Inspirado en CS 1.6 (GoldSrc) & Left 4 Dead (Source Engine):
    Carrera táctica ágil y contundente:
    - Postura atlética inclinada al frente (+13° torso, hombros firmes y decididos).
    - Amortiguación y doble rebote cinético en pelvis (Local Y vertical con compresión y despegue).
    - Combat Horizon Lock: Visor estabilizado en el horizonte compensando el pitch de carrera.
    - Guardia cerrada: Brazos pegados al torso (X=4.0° sin abrirse), codos flexionados en ángulo
      táctico (~52° a 74°), braceo pendular potente en Z sagital y puños cerrados en guardia.
    - Zancada enérgica con extensión propulsiva y flexión anatómica limpia de rodillas.
    """
    create_action(arm, 'nexo_run', 0, 24)
    b = arm.pose.bones
    
    hips = b.get('mixamorig:Hips_01')
    spine = b.get('mixamorig:Spine_02')
    spine1 = b.get('mixamorig:Spine1_03')
    spine2 = b.get('mixamorig:Spine2_04')
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
    l_hand = b.get('mixamorig:LeftHand_011')
    r_hand = b.get('mixamorig:RightHand_035')

    # 24 frames / 0.8s: horneado fotograma a fotograma para máxima fluidez y precisión
    for f in range(0, 25):
        phase = (f / 24.0) * math.pi * 2.0
        s = math.sin(phase)
        c = math.cos(phase)
        double_phase = phase * 2.0
        
        # 1. Pelvis / Hips (Centro de masa con amortiguación cinética y doble rebote Source)
        if hips:
            # En Mixamo: Local Y es vertical (World Z * 36)
            bounce_y = -1.1 + math.cos(double_phase) * 0.75
            sway_x = s * 0.45
            inertia_z = -math.sin(double_phase) * 0.25
            key_bone_loc(hips, sway_x, bounce_y, inertia_z, f)
            
            # Rotación: Inclinación frontal atlética (+13°), giro pélvico con la zancada (+-3.8°) y balanceo lateral (+-2.0°)
            hip_pitch = 13.0 + math.cos(double_phase) * 1.5
            hip_yaw = s * 3.8
            hip_roll = -s * 2.0
            key_bone_rot(hips, hip_pitch, hip_yaw, hip_roll, f)
            
        # 2. Torso y Columna: porte atlético, contratorsión táctica y hombros firmes
        if spine:
            key_bone_rot(spine, 4.0, -s * 2.5, s * 1.2, f)
        if spine1:
            key_bone_rot(spine1, 3.5, -s * 2.0, 0.0, f)
        if spine2:
            key_bone_rot(spine2, 2.0, -s * 1.2, 0.0, f)
            
        # 3. Cuello y Cabeza: Estabilización de combate (Combat Horizon Lock estilo CS / L4D)
        # Compensa la inclinación del torso para mantener el visor cibernético siempre apuntando al frente
        if neck:
            key_bone_rot(neck, -8.0, s * 0.8, 0.0, f)
        if head:
            head_pitch = -10.5 - math.cos(double_phase) * 0.8
            key_bone_rot(head, head_pitch, s * 0.5, 0.0, f)
            
        # 4. Piernas y Zancada Biomecánica Auténtica (Ciclo de Carrera Progresiva):
        # - Fase de Apoyo / Stance (c <= 0): Pie plantado empujando hacia atrás, rodilla extendida (18° a 26° absorción)
        # - Fase de Vuelo / Swing (c > 0): Talón sube en flexión profunda (-86°) y la pierna avanza en el aire hacia adelante
        # Izquierda
        l_thigh_pitch = s * 36.0 + 4.0
        l_knee_flex = 18.0 + max(0.0, c) * 68.0 + max(0.0, -c) * 8.0
        l_foot_pitch = -s * 18.0 - (c * 12.0 if c > 0 else 0.0)
        if l_upleg:
            key_bone_rot(l_upleg, l_thigh_pitch, 0.0, -4.5, f)
        if l_leg:
            key_bone_rot(l_leg, -l_knee_flex, 0.0, 0.0, f)
        if l_foot:
            key_bone_rot(l_foot, l_foot_pitch, 0.0, 0.0, f)
            
        # Derecha (fase invertida 180°: contralateral)
        r_thigh_pitch = -s * 36.0 + 4.0
        r_knee_flex = 18.0 + max(0.0, -c) * 68.0 + max(0.0, c) * 8.0
        r_foot_pitch = s * 18.0 - (-c * 12.0 if -c > 0 else 0.0)
        if r_upleg:
            key_bone_rot(r_upleg, r_thigh_pitch, 0.0, 4.5, f)
        if r_leg:
            key_bone_rot(r_leg, -r_knee_flex, 0.0, 0.0, f)
        if r_foot:
            key_bone_rot(r_foot, r_foot_pitch, 0.0, 0.0, f)
            
        # 5. Brazos y Guardia Táctica CS 1.6 / Left 4 Dead:
        # Silueta cerrada: brazos pegados al torso (X = 4.0°), balanceo sagital en Z.
        # s > 0 (pierna izq adelante) -> brazo izq atrás (+Z), brazo der adelante (+Z)
        # s < 0 (pierna der adelante) -> brazo izq adelante (-Z), brazo der atrás (-Z)
        l_arm_z = s * 26.0 - 6.0
        r_arm_z = s * 26.0 + 6.0
        if l_arm:
            key_bone_rot(l_arm, 4.0, 0.0, l_arm_z, f)
        if r_arm:
            key_bone_rot(r_arm, 4.0, 0.0, r_arm_z, f)
            
        # Antebrazos: Flexión de codo cerrada y táctica en Z (eje de bisagra sagital de Mixamo)
        # En s < 0 (brazo izq adelante): codo flexiona a -52° en Z (guardia táctica compacta)
        # En s > 0 (brazo der adelante): codo der flexiona a +52° en Z
        l_fore_z = -30.0 + min(0.0, s * 22.0)
        r_fore_z = 30.0 + max(0.0, s * 22.0)
        if l_fore:
            key_bone_rot(l_fore, 0.0, 0.0, l_fore_z, f)
        if r_fore:
            key_bone_rot(r_fore, 0.0, 0.0, r_fore_z, f)
            
        # Manos: Muñecas firmes alineadas al braceo
        if l_hand:
            key_bone_rot(l_hand, 0.0, 0.0, 0.0, f)
        if r_hand:
            key_bone_rot(r_hand, 0.0, 0.0, 0.0, f)
            
        # Puños tácticos cerrados (fist curl +X)
        curl_fist(b, 'Left', 68.0, f)
        curl_fist(b, 'Right', 68.0, f)

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
    Corrección biomecánica: Rodillas flexionan anatómicamente hacia atrás (-rx).
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
        if l_upleg: key_bone_rot(l_upleg, kb * 0.6, 0, -3.0, f)
        if r_upleg: key_bone_rot(r_upleg, kb * 0.6, 0, 3.0, f)
        if l_leg: key_bone_rot(l_leg, -kb, 0, 0, f)
        if r_leg: key_bone_rot(r_leg, -kb, 0, 0, f)
        if l_foot: key_bone_rot(l_foot, kb * 0.35 if f < 10 else -15.0, 0, 0, f)
        if r_foot: key_bone_rot(r_foot, kb * 0.35 if f < 10 else -15.0, 0, 0, f)
        if l_arm: key_bone_rot(l_arm, aa, 0, -aa * 0.3, f)
        if r_arm: key_bone_rot(r_arm, aa, 0, aa * 0.3, f)

def build_jump_loop(arm):
    """
    nexo_jump_loop (24 frames / 0.8s loop):
    Fase aérea de salto / caída balística: piernas semiflexionadas hacia atrás, brazos estabilizadores.
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
        if l_upleg: key_bone_rot(l_upleg, 14.0 + vibe, 0, -3.0, f)
        if r_upleg: key_bone_rot(r_upleg, 14.0 - vibe, 0, 3.0, f)
        if l_leg: key_bone_rot(l_leg, -24.0, 0, 0, f)
        if r_leg: key_bone_rot(r_leg, -24.0, 0, 0, f)
        if l_foot: key_bone_rot(l_foot, -12.0, 0, 0, f)
        if r_foot: key_bone_rot(r_foot, -12.0, 0, 0, f)
        if l_arm: key_bone_rot(l_arm, 15.0 + vibe, 0, -18.0, f)
        if r_arm: key_bone_rot(r_arm, 15.0 - vibe, 0, 18.0, f)

def build_jump_land(arm):
    """
    nexo_jump_land (18 frames / 0.6s):
    Aterrizaje estándar de salto: contacto con suelo, compresión elástica de rodillas (-38°) y absorción.
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
        if l_upleg: key_bone_rot(l_upleg, kb * 0.6, 0, -3.0, f)
        if r_upleg: key_bone_rot(r_upleg, kb * 0.6, 0, 3.0, f)
        if l_leg: key_bone_rot(l_leg, -kb, 0, 0, f)
        if r_leg: key_bone_rot(r_leg, -kb, 0, 0, f)
        if l_foot: key_bone_rot(l_foot, kb * 0.35, 0, 0, f)
        if r_foot: key_bone_rot(r_foot, kb * 0.35, 0, 0, f)
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
        if l_leg: key_bone_rot(l_leg, -6.0, 0, 0, f)
        if r_leg: key_bone_rot(r_leg, -6.0, 0, 0, f)
        if l_foot: key_bone_rot(l_foot, 28.0 + shake * 0.5, 0, 0, f)
        if r_foot: key_bone_rot(r_foot, 28.0 - shake * 0.5, 0, 0, f)

def build_heavy_land(arm):
    """
    nexo_heavy_land (28 frames / 0.93s):
    Aterrizaje pesado de superhéroe ("Three-Point Strikedown"):
    Descenso profundo del centro de gravedad (-0.42m), torso inclinado +40°, cabeza alzada con visor al horizonte,
    brazo derecho en impacto cinético hacia el suelo y brazo izquierdo desplegado atrás como estabilizador aerodinámico.
    Corrección Biomecánica: Rodillas flexionadas naturalmente hacia atrás (-rx), sin proyección frontal invertida.
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
        (14,  0.0, -0.09, -0.42,  40.0,  90.0, 92.0), # Pico máximo de impacto / shockwave
        (20,  0.0, -0.09, -0.42,  40.0,  90.0, 92.0), # Retención heroica del impacto
        (28,  0.0, -0.06, -0.32,  32.0,  80.0, 75.0), # Inicio de amortiguación
    ]
    for f, wx, wy, wz, hp, rk, lk in kfs:
        if hips:
            key_hips_offset(hips, wx, wy, wz, f)
            key_bone_rot(hips, hp, 8.0 if f > 3 else 0, -4.0 if f > 3 else 0, f)
        if spine: key_bone_rot(spine, -hp * 0.22, 0, 0, f)
        if spine1: key_bone_rot(spine1, -hp * 0.16, 0, 0, f)
        if neck: key_bone_rot(neck, -12.0 if f > 3 else 0, 0, 0, f)
        if head: key_bone_rot(head, -30.0 if f > 3 else 0, 0, 0, f) # Cabeza alzada heroica al horizonte
        
        # Pierna derecha: arrodillada hacia atrás con la espinilla cerca del suelo
        if r_upleg: key_bone_rot(r_upleg, -18.0 if f > 3 else 0, 6.0 if f > 3 else 0, 14.0 if f > 3 else 0, f)
        if r_leg: key_bone_rot(r_leg, -rk, 0, 0, f)
        if r_foot: key_bone_rot(r_foot, -15.0 if f > 3 else 0, 0, 0, f)
        
        # Pierna izquierda: pilar delantero flexionado con suela en tierra
        if l_upleg: key_bone_rot(l_upleg, 52.0 if f > 3 else 0, -4.0 if f > 3 else 0, -14.0 if f > 3 else 0, f)
        if l_leg: key_bone_rot(l_leg, -lk, 0, 0, f)
        if l_foot: key_bone_rot(l_foot, 40.0 if f > 3 else 0, 0, 0, f)
        
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
    Corrección Biomecánica: Piernas se extienden suavemente desde flexión (-rx) hacia 0°.
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
        (0,   0.0, -0.06, -0.32,  32.0,  80.0,  75.0), # Inicio desde fin de heavy_land
        (10,  0.0, -0.04, -0.18,  20.0,  50.0,  42.0), # Mano despega del suelo, torso se alza
        (20,  0.0, -0.02, -0.06,   8.0,  18.0,  15.0), # Incorporación atlética
        (30,  0.0,  0.00,  0.00,   0.0,   0.0,   0.0), # Totalmente erguido
    ]
    for f, wx, wy, wz, hp, rk, lk in kfs:
        t_prog = f / 30.0
        inv_t = 1.0 - t_prog
        if hips:
            key_hips_offset(hips, wx, wy, wz, f)
            key_bone_rot(hips, hp, 4.0 if f < 20 else 0, -2.0 if f < 20 else 0, f)
        if spine: key_bone_rot(spine, -hp * 0.22, 0, 0, f)
        if spine1: key_bone_rot(spine1, -hp * 0.16, 0, 0, f)
        if neck: key_bone_rot(neck, -8.0 if f < 20 else 0, 0, 0, f)
        if head: key_bone_rot(head, -18.0 if f < 20 else 0, 0, 0, f)
        
        if r_upleg: key_bone_rot(r_upleg, -18.0 * inv_t, 6.0 * inv_t, 14.0 * inv_t, f)
        if r_leg: key_bone_rot(r_leg, -rk, 0, 0, f)
        if r_foot: key_bone_rot(r_foot, -15.0 * inv_t, 0, 0, f)
        
        if l_upleg: key_bone_rot(l_upleg, 52.0 * inv_t, -4.0 * inv_t, -14.0 * inv_t, f)
        if l_leg: key_bone_rot(l_leg, -lk, 0, 0, f)
        if l_foot: key_bone_rot(l_foot, 40.0 * inv_t, 0, 0, f)
        
        if r_arm: key_bone_rot(r_arm, 18.0 * inv_t + 4.0, 0, -25.0 * inv_t + 6.0, f)
        if r_fore: key_bone_rot(r_fore, -14.0, 0, 0, f)
        if l_arm: key_bone_rot(l_arm, -20.0 * inv_t + 4.0, 0, -30.0 * inv_t - 6.0, f)
        if l_fore: key_bone_rot(l_fore, -14.0, 0, 0, f)

def build_crouch(arm):
    """
    nexo_crouch (24 frames / 0.8s):
    Agacharse táctico real con descenso vertical de pelvis de -0.38m (Local Y = -13.5),
    flexión profunda de rodillas (-112°), torso inclinado +18°, compensación cervical (-14°)
    para mantener el visor al horizonte, y guanteletes en guardia compacta ante el reactor.
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
    l_fore = b.get('mixamorig:LeftForeArm_010')
    r_fore = b.get('mixamorig:RightForeArm_034')
    l_hand = b.get('mixamorig:LeftHand_011')
    r_hand = b.get('mixamorig:RightHand_035')

    kfs = [
        # frame, hip_y (down is -), hip_z (depth), hip_pitch, upleg_x, leg_x, foot_x, arm_pitch
        (0,    0.0, 0.0,  0.0,   0.0,    0.0,  0.0,  0.0),
        (8,   -5.5, 0.8,  8.0,  32.0,  -52.0, 20.0, 10.0),
        (16, -10.5, 1.5, 14.0,  54.0,  -88.0, 34.0, 18.0),
        (24, -13.5, 2.0, 18.0,  68.0, -112.0, 44.0, 24.0),
    ]
    for f, hy, hz, hp, ux, lx, fx, ap in kfs:
        if hips:
            key_bone_loc(hips, 0, hy, hz, f)
            key_bone_rot(hips, hp, 0, 0, f)
        if spine:
            key_bone_rot(spine, hp * 0.45, 0, 0, f)
        if head:
            # Compensar la inclinación del torso para que los ojos/visor miren al horizonte
            key_bone_rot(head, -hp * 0.75, 0, 0, f)
        if l_upleg:
            key_bone_rot(l_upleg, ux, 0, -5.0, f)
        if r_upleg:
            key_bone_rot(r_upleg, ux, 0, 5.0, f)
        if l_leg:
            key_bone_rot(l_leg, lx, 0, 0, f)
        if r_leg:
            key_bone_rot(r_leg, lx, 0, 0, f)
        if l_foot:
            key_bone_rot(l_foot, fx, 0, 0, f)
        if r_foot:
            key_bone_rot(r_foot, fx, 0, 0, f)
        # Brazos: caída protegida y natural a los costados de los muslos (sin torsión ni apertura excesiva)
        arm_t = ap / 24.0
        if l_arm:
            key_bone_rot(l_arm, 12.0 * arm_t, 0, -8.0 * arm_t, f)
        if r_arm:
            key_bone_rot(r_arm, 12.0 * arm_t, 0, 8.0 * arm_t, f)
        # Antebrazos: flexión de codo anatómica suave en el eje sagital (Z), manteniendo manos relajadas al frente
        if l_fore:
            key_bone_rot(l_fore, 0, 0, -14.0 * arm_t, f)
        if r_fore:
            key_bone_rot(r_fore, 0, 0, 14.0 * arm_t, f)
        if l_hand:
            key_bone_rot(l_hand, 0, 0, 0, f)
        if r_hand:
            key_bone_rot(r_hand, 0, 0, 0, f)

def build_crouch_stand(arm):
    """
    nexo_crouch_stand (20 frames / 0.66s):
    Reincorporación fluida desde agachada táctica hacia postura erguida de combate.
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
    l_fore = b.get('mixamorig:LeftForeArm_010')
    r_fore = b.get('mixamorig:RightForeArm_034')
    l_hand = b.get('mixamorig:LeftHand_011')
    r_hand = b.get('mixamorig:RightHand_035')

    kfs = [
        (0,  -13.5, 2.0, 18.0,  68.0, -112.0, 44.0, 24.0),
        (10,  -6.5, 0.9, 10.0,  36.0,  -60.0, 24.0, 12.0),
        (20,   0.0, 0.0,  0.0,   0.0,    0.0,  0.0,  0.0),
    ]
    for f, hy, hz, hp, ux, lx, fx, ap in kfs:
        if hips:
            key_bone_loc(hips, 0, hy, hz, f)
            key_bone_rot(hips, hp, 0, 0, f)
        if spine:
            key_bone_rot(spine, hp * 0.45, 0, 0, f)
        if head:
            key_bone_rot(head, -hp * 0.75, 0, 0, f)
        if l_upleg:
            key_bone_rot(l_upleg, ux, 0, -4.0, f)
        if r_upleg:
            key_bone_rot(r_upleg, ux, 0, 4.0, f)
        if l_leg:
            key_bone_rot(l_leg, lx, 0, 0, f)
        if r_leg:
            key_bone_rot(r_leg, lx, 0, 0, f)
        if l_foot:
            key_bone_rot(l_foot, fx, 0, 0, f)
        if r_foot:
            key_bone_rot(r_foot, fx, 0, 0, f)
        arm_t = ap / 24.0
        if l_arm:
            key_bone_rot(l_arm, 12.0 * arm_t, 0, -8.0 * arm_t, f)
        if r_arm:
            key_bone_rot(r_arm, 12.0 * arm_t, 0, 8.0 * arm_t, f)
        if l_fore:
            key_bone_rot(l_fore, 0, 0, -14.0 * arm_t, f)
        if r_fore:
            key_bone_rot(r_fore, 0, 0, 14.0 * arm_t, f)
        if l_hand:
            key_bone_rot(l_hand, 0, 0, 0, f)
        if r_hand:
            key_bone_rot(r_hand, 0, 0, 0, f)

# =============================================================================
# SET TÁCTICO INSPIRADO EN COUNTER-STRIKE 1.6 & LEFT 4 DEAD (SOURCE ENGINE)
# =============================================================================

def build_crouch_walk(arm):
    """
    nexo_crouch_walk (32 frames / 1.06s a 30 FPS) — Inspirado en 'crouchrun' de CS 1.6 & Source Engine:
    Locomoción sigilosa en perfil bajo con cadera descendida (-12.5 unidades en Local Y = -0.35m reales),
    inclinación de torso (+16°), rodillas flexionadas de forma biomecánica continua (-85° a -115°),
    pasos rítmicos alternados, brazos compactos al frente en guardia y visor nivelado al frente.
    """
    create_action(arm, 'nexo_crouch_walk', 0, 32)
    b = arm.pose.bones
    hips = b.get('mixamorig:Hips_01')
    spine = b.get('mixamorig:Spine_02')
    spine1 = b.get('mixamorig:Spine1_03')
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
    l_hand = b.get('mixamorig:LeftHand_011')
    r_hand = b.get('mixamorig:RightHand_035')

    for f in range(0, 33, 4):
        phase = (f / 32.0) * math.pi * 2.0
        step_l = math.sin(phase)
        step_r = -step_l
        bob = math.cos(phase * 2.0) * 0.8

        if hips:
            # Cadera descendida a -12.5 en Local Y, oscilación lateral en X y compensación en Z
            key_bone_loc(hips, step_l * 0.6, -12.5 + bob, 2.0, f)
            key_bone_rot(hips, 16.0, step_l * 3.5, -step_l * 2.5, f)
        if spine:
            key_bone_rot(spine, 6.0, -step_l * 2.0, 0, f)
        if spine1:
            key_bone_rot(spine1, 4.0, -step_l * 1.5, 0, f)
        if head:
            # Compensar pitch para vista frontal horizontal al avanzar agachado
            key_bone_rot(head, -12.0, step_l * 1.5, 0, f)

        l_knee = 95.0 + step_l * 18.0
        r_knee = 95.0 + step_r * 18.0
        if l_upleg:
            key_bone_rot(l_upleg, 58.0 + step_l * 20.0, 0, -6.0, f)
        if r_upleg:
            key_bone_rot(r_upleg, 58.0 + step_r * 20.0, 0, 6.0, f)
        if l_leg:
            key_bone_rot(l_leg, -l_knee, 0, 0, f)
        if r_leg:
            key_bone_rot(r_leg, -r_knee, 0, 0, f)
        if l_foot:
            key_bone_rot(l_foot, 36.0 - step_l * 12.0, 0, 0, f)
        if r_foot:
            key_bone_rot(r_foot, 36.0 - step_r * 12.0, 0, 0, f)

        # Brazos: braceo sigiloso a los costados del torso y muslos, con flexión anatómica natural
        if l_arm:
            l_arm_z = -8.0 + step_l * 8.0
            key_bone_rot(l_arm, 10.0, 0, l_arm_z, f)
        if r_arm:
            r_arm_z = 8.0 + step_l * 8.0
            key_bone_rot(r_arm, 10.0, 0, r_arm_z, f)
        if l_fore:
            l_fore_z = -16.0 + min(0.0, step_l * 6.0)
            key_bone_rot(l_fore, 0, 0, l_fore_z, f)
        if r_fore:
            r_fore_z = 16.0 + max(0.0, step_l * 6.0)
            key_bone_rot(r_fore, 0, 0, r_fore_z, f)
        if l_hand:
            key_bone_rot(l_hand, 0, 0, 0, f)
        if r_hand:
            key_bone_rot(r_hand, 0, 0, 0, f)

def build_melee_shove(arm):
    """
    nexo_melee_shove (28 frames / 0.93s) — Inspirado en 'melee_shove' de Left 4 Dead:
    Empuje de choque cinético repulsor con ambos guanteletes proyectados hacia adelante,
    retroceso anticipatorio de cadera y descarga explosiva frontal para repeler amenazas.
    """
    create_action(arm, 'nexo_melee_shove', 0, 28)
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

    kfs = [
        # f, hip_z, spine_x, arm_x, arm_z, fore_x, leg_bend
        (0,   0.0,   0.0,   0.0,   0.0,   0.0,  0.0),
        (6,  -2.5,  -8.0, -15.0, -12.0, -75.0, 14.0),
        (11,  4.5,  22.0,  58.0, -10.0, -15.0, 24.0),
        (18,  1.5,   6.0,  32.0, -14.0, -35.0, 10.0),
        (28,  0.0,   0.0,   0.0,   0.0,   0.0,  0.0),
    ]
    for f, hz, sx, ax, az, fx, lb in kfs:
        if hips:
            key_bone_loc(hips, 0, -lb * 0.25, hz, f)
            key_bone_rot(hips, sx * 0.4, 0, 0, f)
        if spine:
            key_bone_rot(spine, sx, 0, 0, f)
        if head:
            key_bone_rot(head, -sx * 0.5, 0, 0, f)
        if l_arm:
            key_bone_rot(l_arm, ax, 0, az, f)
        if r_arm:
            key_bone_rot(r_arm, ax, 0, -az, f)
        if l_fore:
            key_bone_rot(l_fore, fx, 0, 0, f)
        if r_fore:
            key_bone_rot(r_fore, fx, 0, 0, f)
        if l_upleg:
            key_bone_rot(l_upleg, lb * 0.8, 0, -4.0, f)
        if r_upleg:
            key_bone_rot(r_upleg, lb * 0.8, 0, 4.0, f)
        if l_leg:
            key_bone_rot(l_leg, -lb, 0, 0, f)
        if r_leg:
            key_bone_rot(r_leg, -lb, 0, 0, f)

def build_stumble_recovery(arm):
    """
    nexo_stumble_recovery (42 frames / 1.4s) — Inspirado en 'stumble_backward' de Left 4 Dead:
    Tambaleo y desbalanceo inercial hacia atrás tras impacto violento de onda expansiva o choque,
    dando pasos de recuperación tambaleantes y brazos abiertos para no perder el equilibrio.
    """
    create_action(arm, 'nexo_stumble_recovery', 0, 42)
    b = arm.pose.bones
    hips = b.get('mixamorig:Hips_01')
    spine = b.get('mixamorig:Spine1_03')
    head = b.get('mixamorig:Head_06')
    l_arm = b.get('mixamorig:LeftArm_09')
    r_arm = b.get('mixamorig:RightArm_033')
    l_upleg = b.get('mixamorig:LeftUpLeg_00')
    r_upleg = b.get('mixamorig:RightUpLeg_060')
    l_leg = b.get('mixamorig:LeftLeg_056')
    r_leg = b.get('mixamorig:RightLeg_061')

    kfs = [
        # f, hip_z, hip_pitch, spine_x, head_x, l_leg, r_leg, arm_spread
        (0,   0.0,   0.0,   0.0,   0.0,   0.0,   0.0,   0.0),
        (6,  -6.0, -18.0, -26.0,  22.0,  12.0, -20.0,  35.0),
        (16, -9.0,  -8.0,  -6.0,  12.0, -35.0,  28.0,  45.0),
        (26, -5.0,   6.0,  18.0, -10.0,  24.0, -32.0,  28.0),
        (34, -2.0,   2.0,   6.0,  -4.0,   8.0,   4.0,  14.0),
        (42,  0.0,   0.0,   0.0,   0.0,   0.0,   0.0,   0.0),
    ]
    for f, hz, hp, sx, hx, ll, rl, aspr in kfs:
        if hips:
            key_bone_loc(hips, 0, -abs(hz) * 0.4, hz, f)
            key_bone_rot(hips, hp, 0, 0, f)
        if spine:
            key_bone_rot(spine, sx, 0, 0, f)
        if head:
            key_bone_rot(head, hx, 0, 0, f)
        if l_arm:
            key_bone_rot(l_arm, 14.0, 0, -aspr, f)
        if r_arm:
            key_bone_rot(r_arm, 14.0, 0, aspr, f)
        if l_upleg:
            key_bone_rot(l_upleg, ll * 0.6, 0, -4.0, f)
        if r_upleg:
            key_bone_rot(r_upleg, rl * 0.6, 0, 4.0, f)
        if l_leg:
            key_bone_rot(l_leg, -abs(ll), 0, 0, f)
        if r_leg:
            key_bone_rot(r_leg, -abs(rl), 0, 0, f)

def build_limp_walk(arm):
    """
    nexo_limp_walk (36 frames / 1.2s loop) — Inspirado en 'LimpWalkN' de Left 4 Dead:
    Locomoción asimétrica de supervivencia con daño estructural crítico (<25% integridad):
    la mano izquierda protege el reactor Hex-Core/flanco, la pierna izquierda arrastra con apoyo pesado,
    y el torso se inclina con fatiga biomecánica evidente.
    """
    create_action(arm, 'nexo_limp_walk', 0, 36)
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

    for f in range(0, 37, 4):
        t = (f / 36.0) * math.pi * 2.0
        left_dip = max(0.0, math.sin(t))
        right_step = math.sin(t + math.pi)

        if hips:
            key_bone_loc(hips, -left_dip * 1.2, -left_dip * 4.5, 0, f)
            key_bone_rot(hips, 14.0, left_dip * 4.0, -left_dip * 6.0, f)
        if spine:
            key_bone_rot(spine, 8.0, -left_dip * 3.0, left_dip * 5.0, f)
        if head:
            key_bone_rot(head, 14.0, 0, -left_dip * 4.0, f)

        if l_arm:
            key_bone_rot(l_arm, 32.0, 0, 18.0, f)
        if l_fore:
            key_bone_rot(l_fore, -85.0, 0, 15.0, f)

        if r_arm:
            key_bone_rot(r_arm, right_step * 24.0, 0, 14.0, f)
        if r_fore:
            key_bone_rot(r_fore, -30.0, 0, 0, f)

        if l_upleg:
            key_bone_rot(l_upleg, 16.0 + left_dip * 14.0, 0, -4.0, f)
        if l_leg:
            key_bone_rot(l_leg, -25.0 - left_dip * 20.0, 0, 0, f)
        if l_foot:
            key_bone_rot(l_foot, 10.0, 0, 0, f)

        if r_upleg:
            key_bone_rot(r_upleg, 26.0 + right_step * 28.0, 0, 4.0, f)
        if r_leg:
            key_bone_rot(r_leg, -35.0 - max(0.0, right_step) * 35.0, 0, 0, f)
        if r_foot:
            key_bone_rot(r_foot, 15.0 - right_step * 10.0, 0, 0, f)

def build_hunter_pounce(arm):
    """
    nexo_hunter_pounce (36 frames / 1.2s) — Inspirado en 'idle_crouch_pose' de Hunter (Left 4 Dead):
    Aterrizaje depredador en 3 puntos / Superhero Landing: rodilla derecha a ras de suelo (Local Y = -16.5),
    puño derecho golpeando el terreno absorbiendo energía cinética, brazo izquierdo estilizado hacia atrás,
    y visor de Auren levantándose con mirada desafiante hacia el horizonte.
    """
    create_action(arm, 'nexo_hunter_pounce', 0, 36)
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

    kfs = [
        # f, hip_y, hip_z, spine_x, head_x, r_arm_x, l_arm_x
        (0,    0.0, 0.0,  0.0,   0.0,   0.0,   0.0),
        (8,  -16.5, 3.0, 32.0, -28.0,  65.0, -42.0),
        (20, -16.0, 2.8, 30.0, -32.0,  62.0, -40.0),
        (30,  -8.0, 1.2, 14.0, -12.0,  28.0, -18.0),
        (36,   0.0, 0.0,  0.0,   0.0,   0.0,   0.0),
    ]
    for f, hy, hz, sx, hx, rax, lax in kfs:
        if hips:
            key_bone_loc(hips, 0, hy, hz, f)
            key_bone_rot(hips, 22.0 if f > 0 and f < 36 else 0, 0, 0, f)
        if spine:
            key_bone_rot(spine, sx, 0, 0, f)
        if head:
            key_bone_rot(head, hx, 0, 0, f)
        if r_arm:
            key_bone_rot(r_arm, rax, 0, 5.0 if f > 0 else 0, f)
        if r_fore:
            key_bone_rot(r_fore, -45.0 if f > 0 and f < 36 else 0, 0, 0, f)
        if l_arm:
            key_bone_rot(l_arm, lax, 0, -35.0 if f > 0 else 0, f)
        if l_fore:
            key_bone_rot(l_fore, -20.0 if f > 0 and f < 36 else 0, 0, 0, f)

        if r_upleg:
            key_bone_rot(r_upleg, 72.0 if f > 0 and f < 36 else 0, 0, 8.0, f)
        if r_leg:
            key_bone_rot(r_leg, -125.0 if f > 0 and f < 36 else 0, 0, 0, f)
        if r_foot:
            key_bone_rot(r_foot, 52.0 if f > 0 and f < 36 else 0, 0, 0, f)
        if l_upleg:
            key_bone_rot(l_upleg, 55.0 if f > 0 and f < 36 else 0, 0, -16.0, f)
        if l_leg:
            key_bone_rot(l_leg, -85.0 if f > 0 and f < 36 else 0, 0, 0, f)
        if l_foot:
            key_bone_rot(l_foot, 30.0 if f > 0 and f < 36 else 0, 0, 0, f)

def build_flinch_torso(arm):
    """
    nexo_flinch_torso (16 frames / 0.53s a 30 FPS) — Inspirado en 'gut_flinch' de CS 1.6:
    Sacudida reactiva instantánea por impacto o roce. Contracción espinal (+24°), cabeza hacia abajo,
    pelvis que retrocede por conservación de momento y amortiguación elástica hacia reposo.
    """
    create_action(arm, 'nexo_flinch_torso', 0, 16)
    b = arm.pose.bones
    hips = b.get('mixamorig:Hips_01')
    spine = b.get('mixamorig:Spine_02')
    spine1 = b.get('mixamorig:Spine1_03')
    head = b.get('mixamorig:Head_06')
    l_arm = b.get('mixamorig:LeftArm_09')
    r_arm = b.get('mixamorig:RightArm_033')
    l_fore = b.get('mixamorig:LeftForeArm_010')
    r_fore = b.get('mixamorig:RightForeArm_034')

    kfs = [
        (0,   0.00,  0.0,   0.0,   0.0,   4.0),
        (3,  -0.08, 18.0,  12.0, -14.0,  28.0),
        (6,  -0.05, 12.0,   8.0,  -8.0,  20.0),
        (10, -0.02,  4.0,   2.0,  -2.0,  10.0),
        (16,  0.00,  0.0,   0.0,   0.0,   4.0),
    ]
    for f, hy, hp, sp, he, ap in kfs:
        if hips:
            key_bone_loc(hips, 0, hy, 0, f)
            key_bone_rot(hips, hp, 0, 0, f)
        if spine: key_bone_rot(spine, sp, 0, 0, f)
        if spine1: key_bone_rot(spine1, sp * 0.7, 0, 0, f)
        if head: key_bone_rot(head, he, 0, 0, f)
        if l_arm: key_bone_rot(l_arm, ap, 0, -18.0, f)
        if r_arm: key_bone_rot(r_arm, ap, 0, 18.0, f)
        if l_fore: key_bone_rot(l_fore, -ap * 1.5, 0, 0, f)
        if r_fore: key_bone_rot(r_fore, -ap * 1.5, 0, 0, f)

def build_flinch_head(arm):
    """
    nexo_flinch_head (14 frames / 0.46s a 30 FPS) — Inspirado en 'head_flinch' de CS 1.6:
    Impacto directo en casco o sobrepresión transónica: cabeza y cuello son proyectados bruscamente
    hacia atrás (-28°), hombros tensos y recuperación giroscópica.
    """
    create_action(arm, 'nexo_flinch_head', 0, 14)
    b = arm.pose.bones
    spine = b.get('mixamorig:Spine_02')
    neck = b.get('mixamorig:Neck_05')
    head = b.get('mixamorig:Head_06')
    l_shoulder = b.get('mixamorig:LeftShoulder_08')
    r_shoulder = b.get('mixamorig:RightShoulder_032')

    kfs = [
        (0,   0.0,   0.0,  0.0),
        (2,  -8.0, -16.0, -28.0),
        (5,  -4.0, -10.0, -18.0),
        (9,  -1.0,  -3.0,  -6.0),
        (14,  0.0,   0.0,   0.0),
    ]
    for f, sp, nk, hd in kfs:
        if spine: key_bone_rot(spine, sp, 0, 0, f)
        if neck: key_bone_rot(neck, nk, 0, 0, f)
        if head: key_bone_rot(head, hd, 0, 0, f)
        if l_shoulder: key_bone_rot(l_shoulder, -hd * 0.25, 0, 0, f)
        if r_shoulder: key_bone_rot(r_shoulder, -hd * 0.25, 0, 0, f)

def build_death_forward(arm):
    """
    nexo_death_forward (36 frames / 1.2s) — Inspirado en 'forward' de CS 1.6:
    Colapso inercial hacia adelante: rodillas ceden, torso cae amortiguado en tierra, brazos abiertos.
    """
    create_action(arm, 'nexo_death_forward', 0, 36)
    b = arm.pose.bones
    hips = b.get('mixamorig:Hips_01')
    spine = b.get('mixamorig:Spine_02')
    head = b.get('mixamorig:Head_06')
    l_upleg = b.get('mixamorig:LeftUpLeg_00')
    r_upleg = b.get('mixamorig:RightUpLeg_060')
    l_leg = b.get('mixamorig:LeftLeg_056')
    r_leg = b.get('mixamorig:RightLeg_061')
    l_arm = b.get('mixamorig:LeftArm_09')
    r_arm = b.get('mixamorig:RightArm_033')

    kfs = [
        (0,   0.00,  0.00,  0.0,  0.0,   4.0),
        (10,  0.04, -0.15, 20.0, 45.0,  25.0),
        (22,  0.12, -0.38, 55.0, 85.0,  50.0),
        (36,  0.18, -0.55, 82.0, 95.0,  70.0),
    ]
    for f, wy, wz, hp, kb, ap in kfs:
        if hips:
            key_hips_offset(hips, 0, wy, wz, f)
            key_bone_rot(hips, hp, 0, 0, f)
        if spine: key_bone_rot(spine, -hp * 0.15, 0, 0, f)
        if head: key_bone_rot(head, hp * 0.2, 0, 0, f)
        if l_upleg: key_bone_rot(l_upleg, kb * 0.7, 0, -8.0, f)
        if r_upleg: key_bone_rot(r_upleg, kb * 0.7, 0, 8.0, f)
        if l_leg: key_bone_rot(l_leg, -kb, 0, 0, f)
        if r_leg: key_bone_rot(r_leg, -kb, 0, 0, f)
        if l_arm: key_bone_rot(l_arm, ap, 0, -45.0, f)
        if r_arm: key_bone_rot(r_arm, ap, 0, 45.0, f)

def build_death_back(arm):
    """
    nexo_death_back (40 frames / 1.33s) — Inspirado en 'back' / 'headshot' de CS 1.6:
    Desplome hacia atrás por impacto frontal severo: torso proyectado hacia atrás,
    piernas colapsan y reposa de espaldas.
    """
    create_action(arm, 'nexo_death_back', 0, 40)
    b = arm.pose.bones
    hips = b.get('mixamorig:Hips_01')
    spine = b.get('mixamorig:Spine_02')
    head = b.get('mixamorig:Head_06')
    l_upleg = b.get('mixamorig:LeftUpLeg_00')
    r_upleg = b.get('mixamorig:RightUpLeg_060')
    l_leg = b.get('mixamorig:LeftLeg_056')
    r_leg = b.get('mixamorig:RightLeg_061')
    l_arm = b.get('mixamorig:LeftArm_09')
    r_arm = b.get('mixamorig:RightArm_033')

    kfs = [
        (0,   0.00,  0.00,   0.0,  0.0),
        (12, -0.06, -0.15, -24.0, 30.0),
        (26, -0.14, -0.38, -62.0, 60.0),
        (40, -0.22, -0.56, -88.0, 20.0),
    ]
    for f, wy, wz, hp, kb in kfs:
        if hips:
            key_hips_offset(hips, 0, wy, wz, f)
            key_bone_rot(hips, hp, 0, 0, f)
        if spine: key_bone_rot(spine, -hp * 0.1, 0, 0, f)
        if head: key_bone_rot(head, -hp * 0.25, 0, 0, f)
        if l_upleg: key_bone_rot(l_upleg, -kb * 0.5, 0, -12.0, f)
        if r_upleg: key_bone_rot(r_upleg, -kb * 0.5, 0, 12.0, f)
        if l_leg: key_bone_rot(l_leg, -kb, 0, 0, f)
        if r_leg: key_bone_rot(r_leg, -kb, 0, 0, f)
        if l_arm: key_bone_rot(l_arm, -35.0, 0, -40.0, f)
        if r_arm: key_bone_rot(r_arm, -35.0, 0, 40.0, f)

def build_death_left(arm):
    """
    nexo_death_left (36 frames / 1.2s) — Inspirado en 'left' de CS 1.6:
    Colapso lateral inercial hacia el flanco izquierdo.
    """
    create_action(arm, 'nexo_death_left', 0, 36)
    b = arm.pose.bones
    hips = b.get('mixamorig:Hips_01')
    spine = b.get('mixamorig:Spine_02')
    head = b.get('mixamorig:Head_06')
    l_arm = b.get('mixamorig:LeftArm_09')
    r_arm = b.get('mixamorig:RightArm_033')

    kfs = [
        (0,   0.00,  0.00,   0.0),
        (14, -0.08, -0.20, -35.0),
        (36, -0.25, -0.52, -80.0),
    ]
    for f, wx, wz, roll in kfs:
        if hips:
            key_hips_offset(hips, wx, 0, wz, f)
            key_bone_rot(hips, 15.0, 0, roll, f)
        if spine: key_bone_rot(spine, 0, 0, -roll * 0.3, f)
        if head: key_bone_rot(head, 0, 0, roll * 0.2, f)
        if l_arm: key_bone_rot(l_arm, 20.0, 0, -50.0, f)
        if r_arm: key_bone_rot(r_arm, -20.0, 0, 30.0, f)

def build_death_right(arm):
    """
    nexo_death_right (36 frames / 1.2s) — Inspirado en 'right' de CS 1.6:
    Colapso lateral inercial hacia el flanco derecho.
    """
    create_action(arm, 'nexo_death_right', 0, 36)
    b = arm.pose.bones
    hips = b.get('mixamorig:Hips_01')
    spine = b.get('mixamorig:Spine_02')
    head = b.get('mixamorig:Head_06')
    l_arm = b.get('mixamorig:LeftArm_09')
    r_arm = b.get('mixamorig:RightArm_033')

    kfs = [
        (0,   0.00,  0.00,  0.0),
        (14,  0.08, -0.20, 35.0),
        (36,  0.25, -0.52, 80.0),
    ]
    for f, wx, wz, roll in kfs:
        if hips:
            key_hips_offset(hips, wx, 0, wz, f)
            key_bone_rot(hips, 15.0, 0, roll, f)
        if spine: key_bone_rot(spine, 0, 0, -roll * 0.3, f)
        if head: key_bone_rot(head, 0, 0, roll * 0.2, f)
        if l_arm: key_bone_rot(l_arm, -20.0, 0, -30.0, f)
        if r_arm: key_bone_rot(r_arm, 20.0, 0, 50.0, f)

def build_tactical_interact(arm):
    """
    nexo_tactical_interact (32 frames / 1.06s) — Inspirado en 'pressbutton' de v_c4 de CS 1.6:
    Interacción táctica en consola holográfica del guantelete:
    Antebrazo izquierdo alzado frente al pecho, mano derecha teclea 3 pulsaciones precisas
    con mirada atenta del casco y retorno sincronizado a guardia.
    """
    create_action(arm, 'nexo_tactical_interact', 0, 32)
    b = arm.pose.bones
    head = b.get('mixamorig:Head_06')
    l_arm = b.get('mixamorig:LeftArm_09')
    r_arm = b.get('mixamorig:RightArm_033')
    l_fore = b.get('mixamorig:LeftForeArm_010')
    r_fore = b.get('mixamorig:RightForeArm_034')
    r_hand = b.get('mixamorig:RightHand_035')

    kfs = [
        (0,   0.0,   -6.0,  -12.0,   6.0,  -12.0,   0.0),
        (8,  16.0,  -35.0,  -75.0,  28.0,  -65.0,   0.0),
        (12, 18.0,  -35.0,  -75.0,  28.0,  -72.0,  15.0),
        (16, 18.0,  -35.0,  -75.0,  28.0,  -65.0,   0.0),
        (20, 18.0,  -35.0,  -75.0,  28.0,  -72.0,  15.0),
        (24, 18.0,  -35.0,  -75.0,  28.0,  -65.0,   0.0),
        (32,  0.0,   -6.0,  -12.0,   6.0,  -12.0,   0.0),
    ]
    for f, hp, laz, lfx, raz, rfx, tp in kfs:
        if head: key_bone_rot(head, hp, 0, 0, f)
        if l_arm: key_bone_rot(l_arm, 18.0, 0, laz, f)
        if l_fore: key_bone_rot(l_fore, lfx, 0, 20.0, f)
        if r_arm: key_bone_rot(r_arm, 22.0, 0, raz, f)
        if r_fore: key_bone_rot(r_fore, rfx, 0, -15.0, f)
        if r_hand: key_bone_rot(r_hand, tp, 0, 0, f)

def build_quicklook(arm):
    """
    nexo_quicklook (30 frames / 1.0s) — Inspirado en 'quicklook' de hostage.mdl de CS 1.6:
    Inspección táctica periférica: giro rápido a la izquierda, pausa de reconocimiento,
    giro rápido a la derecha y centrado al frente.
    """
    create_action(arm, 'nexo_quicklook', 0, 30)
    b = arm.pose.bones
    neck = b.get('mixamorig:Neck_05')
    head = b.get('mixamorig:Head_06')

    kfs = [
        (0,    0.0,   0.0),
        (6,  -15.0, -35.0),
        (12, -15.0, -35.0),
        (18,  15.0,  35.0),
        (24,  15.0,  35.0),
        (30,   0.0,   0.0),
    ]
    for f, ny, hy in kfs:
        if neck: key_bone_rot(neck, 0, ny, 0, f)
        if head: key_bone_rot(head, 2.0, hy, 0, f)

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
    nexo_emote_thumbs_up (45 frames / 1.5s):
    Gesto 2: Pulgar arriba ("Todo Bien / Aprobado").
    Corrección Biomecánica:
    - Brazo izquierdo permanece en su lugar de reposo natural (idle al costado).
    - Codo derecho orientado HACIA ABAJO (hacia el suelo), con separación del torso sin meterse en las costillas.
    - Dedos de la mano derecha cerrados hacia adentro (+X) formando un puño normal cerrado.
    - Pulgar derecho erguido verticalmente al cenit (+Z).
    """
    create_action(arm, 'nexo_emote_thumbs_up', 0, 45)
    b = arm.pose.bones
    head = b.get('mixamorig:Head_06')
    spine = b.get('mixamorig:Spine1_03')
    
    # Brazo derecho
    r_shoulder = b.get('mixamorig:RightShoulder_032')
    r_arm = b.get('mixamorig:RightArm_033')
    r_fore = b.get('mixamorig:RightForeArm_034')
    r_hand = b.get('mixamorig:RightHand_035')
    r_thumb1 = b.get('mixamorig:RightHandThumb1_036')
    r_thumb2 = b.get('mixamorig:RightHandThumb2_037')
    r_thumb3 = b.get('mixamorig:RightHandThumb3_038')
    r_index1 = b.get('mixamorig:RightHandIndex1_040')
    r_index2 = b.get('mixamorig:RightHandIndex2_041')
    r_index3 = b.get('mixamorig:RightHandIndex3_042')
    r_middle1 = b.get('mixamorig:RightHandMiddle1_044')
    r_middle2 = b.get('mixamorig:RightHandMiddle2_045')
    r_middle3 = b.get('mixamorig:RightHandMiddle3_046')
    r_ring1 = b.get('mixamorig:RightHandRing1_048')
    r_ring2 = b.get('mixamorig:RightHandRing2_049')
    r_ring3 = b.get('mixamorig:RightHandRing3_050')
    r_pinky1 = b.get('mixamorig:RightHandPinky1_052')
    r_pinky2 = b.get('mixamorig:RightHandPinky2_053')
    r_pinky3 = b.get('mixamorig:RightHandPinky3_054')
    
    # Brazo izquierdo: FIJO en reposo idle natural al costado
    l_shoulder = b.get('mixamorig:LeftShoulder_08')
    l_arm = b.get('mixamorig:LeftArm_09')
    l_fore = b.get('mixamorig:LeftForeArm_010')
    l_hand = b.get('mixamorig:LeftHand_011')

    kfs = [
        # f, r_arm_x, r_arm_y, r_arm_z, r_fore_x, r_fore_z, head_p
        (0,    4.0,   0.0,   6.0,  -10.0,  0.0, 0.0),
        (14, -10.0,  20.0, -22.0,  -95.0,  0.0, 6.0), # Codo hacia abajo, antebrazo vertical al frente
        (24, -10.0,  20.0, -22.0,  -95.0,  0.0, 3.0), # Asentimiento de aprobación
        (34, -10.0,  20.0, -22.0,  -95.0,  0.0, 0.0), # Retención firme
        (45,   4.0,   0.0,   6.0,  -10.0,  0.0, 0.0), # Retorno a reposo
    ]

    for f, rax, ray, raz, rfx, rfz, hp in kfs:
        if spine: key_bone_rot(spine, 0, 0, 0, f)
        if head: key_bone_rot(head, hp, 0, 0, f)
        
        # Brazo derecho: codo hacia abajo, antebrazo vertical frente al pectoral
        active = (14 <= f <= 34)
        if r_shoulder: key_bone_rot(r_shoulder, 2.0 if active else 0, 0, -4.0 if active else 0, f)
        if r_arm: key_bone_rot(r_arm, rax, ray, raz, f)
        if r_fore: key_bone_rot(r_fore, rfx, 0, rfz, f)
        if r_hand: key_bone_rot(r_hand, 10.0 if active else 0, 0, 15.0 if active else 0, f)
        
        # Pulgar erguido verticalmente (+Z al cielo)
        if r_thumb1: key_bone_rot(r_thumb1, 16.0 if active else 0, 22.0 if active else 0, -20.0 if active else 0, f)
        if r_thumb2: key_bone_rot(r_thumb2, -10.0 if active else 0, 5.0 if active else 0, 25.0 if active else 0, f)
        if r_thumb3: key_bone_rot(r_thumb3, -5.0 if active else 0, 0.0, 15.0 if active else 0, f)
        
        # Dedos de la mano derecha cerrados en puño hacia adentro (+X positivo)
        fist_curl = 76.0 if active else 0.0
        if r_index1: key_bone_rot(r_index1, fist_curl, 0, 0, f)
        if r_index2: key_bone_rot(r_index2, fist_curl * 0.9, 0, 0, f)
        if r_index3: key_bone_rot(r_index3, fist_curl * 0.7, 0, 0, f)
        if r_middle1: key_bone_rot(r_middle1, fist_curl, 0, 0, f)
        if r_middle2: key_bone_rot(r_middle2, fist_curl * 0.9, 0, 0, f)
        if r_middle3: key_bone_rot(r_middle3, fist_curl * 0.7, 0, 0, f)
        if r_ring1: key_bone_rot(r_ring1, fist_curl * 1.05, 0, 0, f)
        if r_ring2: key_bone_rot(r_ring2, fist_curl * 0.95, 0, 0, f)
        if r_ring3: key_bone_rot(r_ring3, fist_curl * 0.75, 0, 0, f)
        if r_pinky1: key_bone_rot(r_pinky1, fist_curl * 1.05, 0, 0, f)
        if r_pinky2: key_bone_rot(r_pinky2, fist_curl * 0.95, 0, 0, f)
        if r_pinky3: key_bone_rot(r_pinky3, fist_curl * 0.75, 0, 0, f)
        
        # Brazo izquierdo: ESTRICTAMENTE en su lugar de reposo (idle)
        if l_shoulder: key_bone_rot(l_shoulder, 0, 0, 0, f)
        if l_arm: key_bone_rot(l_arm, 4.0, 0, -8.0, f)
        if l_fore: key_bone_rot(l_fore, -12.0, 0, 0, f)
        if l_hand: key_bone_rot(l_hand, 0, 0, 0, f)

    # Alias de compatibilidad
    act = bpy.data.actions.get('nexo_emote_thumbs_up')
    if act:
        target = bpy.data.actions.get('nexo_emote_welcome_thumbs')
        if target and target != act:
            bpy.data.actions.remove(target)
        copy_act = act.copy()
        copy_act.name = 'nexo_emote_welcome_thumbs'
        copy_act.use_fake_user = True

def build_emote_ok(arm):
    """
    nexo_emote_ok (45 frames / 1.5s):
    Gesto 4: Mostrando la mano y el pulgar en forma de "OK" (👌).
    - Brazo derecho alzado frente al pecho/hombro mostrando la seña al frente.
    - Codo apuntando hacia abajo y ligeramente afuera (sin plegarse hacia el torso).
    - Pulgar e Índice formando el círculo cerrado "O" (yemas en contacto).
    - Dedos Mayor, Anular y Meñique desplegados erguidos hacia arriba/afuera con suave curvatura.
    - Brazo izquierdo descansando naturalmente al costado (idle).
    """
    create_action(arm, 'nexo_emote_ok', 0, 45)
    b = arm.pose.bones
    head = b.get('mixamorig:Head_06')
    spine = b.get('mixamorig:Spine1_03')
    
    # Brazo derecho
    r_shoulder = b.get('mixamorig:RightShoulder_032')
    r_arm = b.get('mixamorig:RightArm_033')
    r_fore = b.get('mixamorig:RightForeArm_034')
    r_hand = b.get('mixamorig:RightHand_035')
    r_thumb1 = b.get('mixamorig:RightHandThumb1_036')
    r_thumb2 = b.get('mixamorig:RightHandThumb2_037')
    r_thumb3 = b.get('mixamorig:RightHandThumb3_038')
    r_index1 = b.get('mixamorig:RightHandIndex1_040')
    r_index2 = b.get('mixamorig:RightHandIndex2_041')
    r_index3 = b.get('mixamorig:RightHandIndex3_042')
    r_middle1 = b.get('mixamorig:RightHandMiddle1_044')
    r_middle2 = b.get('mixamorig:RightHandMiddle2_045')
    r_middle3 = b.get('mixamorig:RightHandMiddle3_046')
    r_ring1 = b.get('mixamorig:RightHandRing1_048')
    r_ring2 = b.get('mixamorig:RightHandRing2_049')
    r_ring3 = b.get('mixamorig:RightHandRing3_050')
    r_pinky1 = b.get('mixamorig:RightHandPinky1_052')
    r_pinky2 = b.get('mixamorig:RightHandPinky2_053')
    r_pinky3 = b.get('mixamorig:RightHandPinky3_054')
    
    # Brazo izquierdo en reposo idle
    l_shoulder = b.get('mixamorig:LeftShoulder_08')
    l_arm = b.get('mixamorig:LeftArm_09')
    l_fore = b.get('mixamorig:LeftForeArm_010')
    l_hand = b.get('mixamorig:LeftHand_011')

    kfs = [
        # f, r_arm_x, r_arm_y, r_arm_z, r_fore_x, r_fore_z, head_p
        (0,    4.0,   0.0,   6.0,  -10.0,   0.0, 0.0),
        (14, -14.0,  24.0, -28.0,  -96.0,   8.0, 5.0), # Mano alzada al frente en gesto OK
        (24, -14.0,  24.0, -28.0,  -96.0,   8.0, 2.0), # Sostenimiento con confianza
        (34, -14.0,  24.0, -28.0,  -96.0,   8.0, 0.0), # Firmeza
        (45,   4.0,   0.0,   6.0,  -10.0,   0.0, 0.0), # Retorno
    ]

    for f, rax, ray, raz, rfx, rfz, hp in kfs:
        if spine: key_bone_rot(spine, 0, 0, 0, f)
        if head: key_bone_rot(head, hp, 0, 0, f)
        
        active = (14 <= f <= 34)
        if r_shoulder: key_bone_rot(r_shoulder, 4.0 if active else 0, 0, -6.0 if active else 0, f)
        if r_arm: key_bone_rot(r_arm, rax, ray, raz, f)
        if r_fore: key_bone_rot(r_fore, rfx, -8.0 if active else 0, rfz, f)
        if r_hand: key_bone_rot(r_hand, 10.0 if active else 0, -14.0 if active else 0, 14.0 if active else 0, f)
        
        # Pulgar e Índice formando el círculo "O"
        if r_index1: key_bone_rot(r_index1, 48.0 if active else 0, 0, -12.0 if active else 0, f)
        if r_index2: key_bone_rot(r_index2, 52.0 if active else 0, 0, 0, f)
        if r_index3: key_bone_rot(r_index3, 32.0 if active else 0, 0, 0, f)
        
        if r_thumb1: key_bone_rot(r_thumb1, 22.0 if active else 0, 16.0 if active else 0, -6.0 if active else 0, f)
        if r_thumb2: key_bone_rot(r_thumb2, 20.0 if active else 0, 10.0 if active else 0, 10.0 if active else 0, f)
        if r_thumb3: key_bone_rot(r_thumb3, 16.0 if active else 0, 0, 6.0 if active else 0, f)
        
        # Dedos Mayor, Anular y Meñique desplegados al aire con suave curvatura natural
        if r_middle1: key_bone_rot(r_middle1, 10.0 if active else 0, 0, 4.0 if active else 0, f)
        if r_middle2: key_bone_rot(r_middle2, 12.0 if active else 0, 0, 0, f)
        if r_middle3: key_bone_rot(r_middle3, 8.0 if active else 0, 0, 0, f)
        
        if r_ring1: key_bone_rot(r_ring1, 14.0 if active else 0, 0, 8.0 if active else 0, f)
        if r_ring2: key_bone_rot(r_ring2, 16.0 if active else 0, 0, 0, f)
        if r_ring3: key_bone_rot(r_ring3, 10.0 if active else 0, 0, 0, f)
        
        if r_pinky1: key_bone_rot(r_pinky1, 18.0 if active else 0, 0, 12.0 if active else 0, f)
        if r_pinky2: key_bone_rot(r_pinky2, 18.0 if active else 0, 0, 0, f)
        if r_pinky3: key_bone_rot(r_pinky3, 12.0 if active else 0, 0, 0, f)
        
        # Brazo izquierdo en reposo idle
        if l_shoulder: key_bone_rot(l_shoulder, 0, 0, 0, f)
        if l_arm: key_bone_rot(l_arm, 4.0, 0, -8.0, f)
        if l_fore: key_bone_rot(l_fore, -12.0, 0, 0, f)
        if l_hand: key_bone_rot(l_hand, 0, 0, 0, f)

def build_emote_beckon(arm):
    """Slot de compatibilidad 4: Gesto OK"""
    act = bpy.data.actions.get('nexo_emote_ok')
    if not act:
        build_emote_ok(arm)
        act = bpy.data.actions.get('nexo_emote_ok')
    if act:
        target = bpy.data.actions.get('nexo_emote_beckon')
        if target and target != act:
            bpy.data.actions.remove(target)
        copy_act = act.copy()
        copy_act.name = 'nexo_emote_beckon'
        copy_act.use_fake_user = True

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

def build_emote_cheer(arm):
    """
    nexo_emote_cheer (55 frames / 1.83s):
    Celebración épica de victoria:
    - Frames 0..8: Flexión preparatoria donde el codo derecho cae estrictamente HACIA ABAJO (al suelo, cerca de la cadera),
      sin plegarse jamás dentro del torso/pecho.
    - Frames 9..18: Puñetazo explosivo al cielo con el brazo totalmente alzado y puño cerrado por delante/arriba de la cabeza.
    - Frames 19..38: Pico de gloria sostenido con pecho erguido y mirada al puño triunfal.
    - Frames 39..46: Descenso natural con codo orientado abajo hacia el piso.
    - Frames 47..55: Retorno sereno a neutral/idle.
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
    r_thumb1 = b.get('mixamorig:RightHandThumb1_036')
    r_thumb2 = b.get('mixamorig:RightHandThumb2_037')
    r_index1 = b.get('mixamorig:RightHandIndex1_040')
    r_index2 = b.get('mixamorig:RightHandIndex2_041')
    r_index3 = b.get('mixamorig:RightHandIndex3_042')
    r_middle1 = b.get('mixamorig:RightHandMiddle1_044')
    r_middle2 = b.get('mixamorig:RightHandMiddle2_045')
    r_middle3 = b.get('mixamorig:RightHandMiddle3_046')
    r_ring1 = b.get('mixamorig:RightHandRing1_048')
    r_ring2 = b.get('mixamorig:RightHandRing2_049')
    r_ring3 = b.get('mixamorig:RightHandRing3_050')
    r_pinky1 = b.get('mixamorig:RightHandPinky1_052')
    r_pinky2 = b.get('mixamorig:RightHandPinky2_053')
    r_pinky3 = b.get('mixamorig:RightHandPinky3_054')
    
    l_arm = b.get('mixamorig:LeftArm_09')
    l_fore = b.get('mixamorig:LeftForeArm_010')
    l_hand = b.get('mixamorig:LeftHand_011')
    l_upleg = b.get('mixamorig:LeftUpLeg_00')
    r_upleg = b.get('mixamorig:RightUpLeg_060')
    l_leg = b.get('mixamorig:LeftLeg_056')
    r_leg = b.get('mixamorig:RightLeg_061')

    # Keyframes:
    # Frame 8: Codo derecho HACIA ABAJO (al suelo, ax=6.0, az=8.0, fx=-85.0), sin meterse en el torso
    # Frame 18..38: Puño al cielo
    # Frame 46: Descenso con codo hacia abajo (ax=-20.0, az=6.0, fx=-45.0)
    kfs = [
        # f, hip_z, ax, az, fx, head_p, knee
        (0,   0.00,    4.0,   6.0, -10.0,   0.0,  0.0),
        (8,  -0.07,    6.0,   8.0, -85.0,   6.0, 26.0), # Compresión: Codo abajo al piso sin tocar el torso
        (18,  0.03, -120.0, -20.0, -20.0, -16.0,  4.0), # ¡Puño derecho directo al cielo!
        (28,  0.03, -120.0, -20.0, -20.0, -18.0,  4.0), # Pico de gloria
        (38,  0.02, -115.0, -20.0, -25.0, -14.0,  4.0), # Manteniendo el festejo
        (46, -0.01,  -20.0,   6.0, -45.0,  -4.0,  8.0), # Descendiendo: Codo abajo al suelo
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
        if r_hand: key_bone_rot(r_hand, 20.0 if 8 <= f <= 46 else 0, 0, 0, f)
        
        # Puño cerrado enérgico durante todo el cheer (+X positivo)
        fist_curl = 78.0 if 8 <= f <= 46 else 0.0
        if r_index1: key_bone_rot(r_index1, fist_curl, 0, 0, f)
        if r_index2: key_bone_rot(r_index2, fist_curl * 0.9, 0, 0, f)
        if r_index3: key_bone_rot(r_index3, fist_curl * 0.7, 0, 0, f)
        if r_middle1: key_bone_rot(r_middle1, fist_curl, 0, 0, f)
        if r_middle2: key_bone_rot(r_middle2, fist_curl * 0.9, 0, 0, f)
        if r_middle3: key_bone_rot(r_middle3, fist_curl * 0.7, 0, 0, f)
        if r_ring1: key_bone_rot(r_ring1, fist_curl * 0.9, 0, 0, f)
        if r_ring2: key_bone_rot(r_ring2, fist_curl * 0.9, 0, 0, f)
        if r_ring3: key_bone_rot(r_ring3, fist_curl * 0.7, 0, 0, f)
        if r_pinky1: key_bone_rot(r_pinky1, fist_curl * 0.9, 0, 0, f)
        if r_pinky2: key_bone_rot(r_pinky2, fist_curl * 0.9, 0, 0, f)
        if r_pinky3: key_bone_rot(r_pinky3, fist_curl * 0.7, 0, 0, f)
        if r_thumb1: key_bone_rot(r_thumb1, 30.0 if 8 <= f <= 46 else 0, 20.0 if 8 <= f <= 46 else 0, 0, f)
        if r_thumb2: key_bone_rot(r_thumb2, 25.0 if 8 <= f <= 46 else 0, 0, 0, f)
        
        if l_arm: key_bone_rot(l_arm, 15.0 if 18 <= f <= 38 else 4.0, 0, -25.0 if 18 <= f <= 38 else -8.0, f)
        if l_fore: key_bone_rot(l_fore, -30.0 if 18 <= f <= 38 else -12.0, 0, 0, f)
        if l_hand: key_bone_rot(l_hand, 15.0 if 18 <= f <= 38 else 0, 0, 0, f)
        if l_upleg: key_bone_rot(l_upleg, kn * 0.5, 0, -2.0, f)
        if r_upleg: key_bone_rot(r_upleg, kn * 0.5, 0, 2.0, f)
        if l_leg: key_bone_rot(l_leg, -kn, 0, 0, f)
        if r_leg: key_bone_rot(r_leg, -kn, 0, 0, f)

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
        if l_upleg: key_bone_rot(l_upleg, kb * 0.6, 0, -3.0, f)
        if r_upleg: key_bone_rot(r_upleg, kb * 0.6, 0, 3.0, f)
        if l_leg: key_bone_rot(l_leg, -kb, 0, 0, f)
        if r_leg: key_bone_rot(r_leg, -kb, 0, 0, f)
        if l_arm: key_bone_rot(l_arm, aa, 0, -aa * 0.4, f)
        if r_arm: key_bone_rot(r_arm, aa, 0, aa * 0.4, f)

def build_hover(arm):
    """
    nexo_hover (60 frames / 2.0s loop):
    Suspensión dinámica y propulsada en vuelo estacionario:
    Postura aerodinámica inclinada a 42° hacia adelante, pecho despejado, piernas retrasadas con
    micro-flexión en rodillas y toberas de botas canalizando empuje hacia abajo/atrás,
    brazos como alerones estabilizadores y cabeza al horizonte.
    """
    create_action(arm, 'nexo_hover', 0, 60)
    b = arm.pose.bones
    hips = b.get('mixamorig:Hips_01')
    spine = b.get('mixamorig:Spine_02')
    spine1 = b.get('mixamorig:Spine1_03')
    neck = b.get('mixamorig:Neck_05')
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
        
        # Inclinación aerodinámica de suspensión activa (42° hacia adelante)
        if hips:
            key_bone_loc(hips, 0, 0, bob * 0.015, f)
            key_bone_rot(hips, 42.0 + bob * 1.5, 0, 0, f)
        if spine:
            key_bone_rot(spine, 2.0, 0, 0, f)
        if spine1:
            key_bone_rot(spine1, 2.0, 0, 0, f)
        if neck:
            key_bone_rot(neck, -16.0, 0, 0, f)
        if head:
            key_bone_rot(head, -28.0 + bob * 0.8, 0, 0, f)
            
        # Brazos abiertos a los costados como alerones estabilizadores de vuelo
        if l_arm: key_bone_rot(l_arm, 4.0, 0, 10.0, f)
        if r_arm: key_bone_rot(r_arm, 4.0, 0, -10.0, f)
        if l_fore: key_bone_rot(l_fore, -10.0, 0, 0, f)
        if r_fore: key_bone_rot(r_fore, -10.0, 0, 0, f)
        
        # Piernas retrasadas con rodillas levemente flexionadas y botas descargando empuje
        if l_upleg: key_bone_rot(l_upleg, -10.0 + bob * 0.5, 0, -2.5, f)
        if r_upleg: key_bone_rot(r_upleg, -10.0 - bob * 0.5, 0, 2.5, f)
        if l_leg: key_bone_rot(l_leg, -14.0, 0, 0, f)
        if r_leg: key_bone_rot(r_leg, -14.0, 0, 0, f)
        if l_foot: key_bone_rot(l_foot, 36.0, 0, 0, f)
        if r_foot: key_bone_rot(r_foot, 36.0, 0, 0, f)

def build_fly_forward(arm):
    """
    nexo_fly_forward (40 frames / 1.33s loop):
    Vuelo crucero estilo torpedo aerodinámico totalmente acostado (horizontal prone flight):
    Cuerpo horizontal a 78° hacia adelante, columna en flecha, brazos ceñidos a los flancos,
    piernas estiradas atrás y cabeza alzada mirando al frente.
    """
    create_action(arm, 'nexo_fly_forward', 0, 40)
    b = arm.pose.bones
    hips = b.get('mixamorig:Hips_01')
    spine = b.get('mixamorig:Spine_02')
    spine1 = b.get('mixamorig:Spine1_03')
    neck = b.get('mixamorig:Neck_05')
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
        
        # Postura acostada horizontal a 78°
        if hips:
            key_bone_loc(hips, 0, 0, wave * 0.008, f)
            key_bone_rot(hips, 78.0 + wave * 1.0, 0, 0, f)
        if spine:
            key_bone_rot(spine, 2.0, 0, 0, f)
        if spine1:
            key_bone_rot(spine1, 2.0, 0, 0, f)
        if neck:
            key_bone_rot(neck, -24.0, 0, 0, f)
        if head:
            key_bone_rot(head, -48.0 + wave * 0.8, 0, 0, f)
            
        # Brazos aerodinámicos ceñidos a los flancos
        if l_arm: key_bone_rot(l_arm, 4.0, 0, 8.0, f)
        if r_arm: key_bone_rot(r_arm, 4.0, 0, -8.0, f)
        if l_fore: key_bone_rot(l_fore, -4.0, 0, 0, f)
        if r_fore: key_bone_rot(r_fore, -4.0, 0, 0, f)
        if l_hand: key_bone_rot(l_hand, 0.0, 0, 0, f)
        if r_hand: key_bone_rot(r_hand, 0.0, 0, 0, f)
        
        # Piernas estilizadas extendidas hacia atrás como toberas
        if l_upleg: key_bone_rot(l_upleg, -4.0 + wave * 0.3, 0, -1.5, f)
        if r_upleg: key_bone_rot(r_upleg, -4.0 - wave * 0.3, 0, 1.5, f)
        if l_leg: key_bone_rot(l_leg, 2.0, 0, 0, f)
        if r_leg: key_bone_rot(r_leg, 2.0, 0, 0, f)
        if l_foot: key_bone_rot(l_foot, 48.0, 0, 0, f)
        if r_foot: key_bone_rot(r_foot, 48.0, 0, 0, f)

def build_bank(arm, direction='left'):
    """
    nexo_bank_left / right (20 frames):
    Viraje acostado con alabeo del torso a 35° y torsión aerodinámica.
    """
    sign = 1.0 if direction == 'left' else -1.0
    act_name = f'nexo_bank_{direction}'
    create_action(arm, act_name, 0, 20)
    b = arm.pose.bones
    hips = b.get('mixamorig:Hips_01')
    spine = b.get('mixamorig:Spine1_03')
    neck = b.get('mixamorig:Neck_05')
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
            key_bone_rot(hips, 75.0, yaw * 0.5, roll * 0.7, f)
        if spine:
            key_bone_rot(spine, 0.0, yaw * 0.5, roll * 0.4, f)
        if neck:
            key_bone_rot(neck, -22.0, 0, 0, f)
        if head:
            key_bone_rot(head, -46.0, yaw * 0.8, -roll * 0.2, f)
        if l_arm:
            key_bone_rot(l_arm, 4.0, 0, 8.0 - (roll if sign > 0 else 0), f)
        if r_arm:
            key_bone_rot(r_arm, 4.0, 0, -8.0 + (roll if sign < 0 else 0), f)

def build_boost(arm):
    """
    nexo_boost (30 frames loop):
    Postura hipersónica ultra-acostada a 84° (Mach 1+):
    Inclinación torpedo plana, brazos sellados al torso, columna rígida y pies en flecha pura.
    """
    create_action(arm, 'nexo_boost', 0, 30)
    b = arm.pose.bones
    hips = b.get('mixamorig:Hips_01')
    spine = b.get('mixamorig:Spine_02')
    spine1 = b.get('mixamorig:Spine1_03')
    neck = b.get('mixamorig:Neck_05')
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
        if hips: key_bone_rot(hips, 84.0 + vibe, 0, 0, f)
        if spine: key_bone_rot(spine, 0.0, 0, 0, f)
        if spine1: key_bone_rot(spine1, 0.0, 0, 0, f)
        if neck: key_bone_rot(neck, -26.0, 0, 0, f)
        if head: key_bone_rot(head, -52.0 + vibe, 0, 0, f)
        # Brazos ceñidos
        if l_arm: key_bone_rot(l_arm, 3.0, 0, 4.0, f)
        if r_arm: key_bone_rot(r_arm, 3.0, 0, -4.0, f)
        if l_fore: key_bone_rot(l_fore, -2.0, 0, 0, f)
        if r_fore: key_bone_rot(r_fore, -2.0, 0, 0, f)
        # Piernas tensas alineadas
        if l_upleg: key_bone_rot(l_upleg, -4.0, 0, -1.0, f)
        if r_upleg: key_bone_rot(r_upleg, -4.0, 0, 1.0, f)
        if l_foot: key_bone_rot(l_foot, 52.0, 0, 0, f)
        if r_foot: key_bone_rot(r_foot, 52.0, 0, 0, f)

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
        if r_upleg: key_bone_rot(r_upleg, rk * 0.5, 0, 4.0, f)
        if r_leg: key_bone_rot(r_leg, -rk, 0, 0, f)
        if r_foot: key_bone_rot(r_foot, rk * 0.3, 0, 0, f)
        
        if l_upleg: key_bone_rot(l_upleg, lk * 0.4, 0, -4.0, f)
        if l_leg: key_bone_rot(l_leg, -lk, 0, 0, f)
        if l_foot: key_bone_rot(l_foot, lk * 0.3, 0, 0, f)

def build_landing(arm):
    """
    nexo_landing (36 frames / 1.20s):
    Aterrizaje Heroico Original JarBees ("Kinetic Strikedown Touchdown"):
    Anticipación aérea -> impacto épico asimétrico en 3 puntos con descenso pélvico (-0.40m):
    - Pierna delantera izquierda firmemente flexionada con suela en tierra (LeftUpLeg +52°, LeftLeg -92°, LeftFoot +40°).
    - Pierna trasera derecha arrodillada cerca del suelo con la espinilla hacia atrás (RightUpLeg -18°, RightLeg -90°, RightFoot -15°).
    - Brazo derecho impactando puño al suelo disipando energía cinética por delante.
    - Brazo izquierdo desplegado atrás como alerón estabilizador aerodinámico.
    - Cabeza y visor HUD firmemente alzados hacia el horizonte desafiante.
    -> amortiguación hidráulica y elevación atlética fluida hacia guardia neutral.
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

    # f, wx, wy, wz, hip_p, hip_y, hip_r, lk, rk, rap, raz, lap, laz, headp
    kfs = [
        # 0: Anticipación aérea (toes extendidos hacia abajo, brazos preparándose)
        (0,   0.0,  0.00,  0.08,   6.0,  0.0,  0.0,  16.0,  16.0,  14.0, -20.0, -12.0, -25.0,  -6.0),
        # 6: Contacto inicial de suelas
        (6,   0.0, -0.04, -0.16,  20.0,  4.0, -2.0,  52.0,  60.0,  28.0, -35.0, -25.0, -40.0, -18.0),
        # 14: Impacto Cinético Heroico Máximo (Strikedown Pose)
        (14,  0.0, -0.08, -0.40,  38.0, 10.0, -4.0,  92.0,  90.0,  38.0, -48.0, -36.0, -54.0, -30.0),
        # 18: Retención heroica del impacto (suspensión y repulsores disipando plasma)
        (18,  0.0, -0.08, -0.40,  38.0, 10.0, -4.0,  92.0,  90.0,  38.0, -48.0, -36.0, -54.0, -30.0),
        # 25: Descompresión elástica y comienzo de elevación
        (25,  0.0, -0.04, -0.18,  18.0,  4.0, -2.0,  45.0,  45.0,  18.0, -24.0, -16.0, -28.0, -14.0),
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
        if neck: key_bone_rot(neck, -12.0 if 12 <= f <= 20 else headp * 0.4, 0, 0, f)
        if head: key_bone_rot(head, headp, 0, 0, f) # Visor firmemente al horizonte
        
        # Pierna izquierda delantera: firmemente flexionada con suela en tierra (+52°, -92°, +40°)
        if l_upleg:
            if 12 <= f <= 20:
                key_bone_rot(l_upleg, 52.0, -4.0, -14.0, f)
            elif f == 0:
                key_bone_rot(l_upleg, 6.0, 0, -2.0, f)
            elif f == 6:
                key_bone_rot(l_upleg, 32.0, -2.0, -8.0, f)
            elif f == 25:
                key_bone_rot(l_upleg, 25.0, -2.0, -6.0, f)
            else:
                key_bone_rot(l_upleg, 0, 0, 0, f)
        if l_leg: key_bone_rot(l_leg, -lk, 0, 0, f)
        if l_foot:
            if 12 <= f <= 20:
                key_bone_rot(l_foot, 40.0, 0, 0, f)
            elif f == 0:
                key_bone_rot(l_foot, -15.0, 0, 0, f)
            elif f == 6:
                key_bone_rot(l_foot, 20.0, 0, 0, f)
            elif f == 25:
                key_bone_rot(l_foot, 15.0, 0, 0, f)
            else:
                key_bone_rot(l_foot, 0, 0, 0, f)
        
        # Pierna derecha trasera: arrodillada hacia atrás con la espinilla en tierra (-18°, -90°, -15°)
        if r_upleg:
            if 12 <= f <= 20:
                key_bone_rot(r_upleg, -18.0, 6.0, 14.0, f)
            elif f == 0:
                key_bone_rot(r_upleg, 6.0, 0, 2.0, f)
            elif f == 6:
                key_bone_rot(r_upleg, -10.0, 3.0, 8.0, f)
            elif f == 25:
                key_bone_rot(r_upleg, -8.0, 2.0, 6.0, f)
            else:
                key_bone_rot(r_upleg, 0, 0, 0, f)
        if r_leg: key_bone_rot(r_leg, -rk, 0, 0, f)
        if r_foot:
            if 12 <= f <= 20:
                key_bone_rot(r_foot, -15.0, 0, 0, f)
            elif f == 0:
                key_bone_rot(r_foot, -15.0, 0, 0, f)
            elif f == 6:
                key_bone_rot(r_foot, -5.0, 0, 0, f)
            elif f == 25:
                key_bone_rot(r_foot, -5.0, 0, 0, f)
            else:
                key_bone_rot(r_foot, 0, 0, 0, f)
        
        # Brazo derecho: impacto cinético hacia el suelo por delante
        if r_shoulder: key_bone_rot(r_shoulder, 20.0 if 12 <= f <= 20 else 0.0, 0, -35.0 if 12 <= f <= 20 else 0.0, f)
        if r_arm: key_bone_rot(r_arm, rap, -15.0 if 12 <= f <= 20 else 0.0, raz, f)
        if r_fore: key_bone_rot(r_fore, -32.0 if 12 <= f <= 20 else -14.0, 10.0 if 12 <= f <= 20 else 0.0, 5.0 if 12 <= f <= 20 else 0.0, f)
        if r_hand: key_bone_rot(r_hand, 20.0 if 12 <= f <= 20 else 0.0, 0, 0, f)
        
        # Brazo izquierdo: alerón estabilizador aerodinámico atrás
        if l_shoulder: key_bone_rot(l_shoulder, -10.0 if 12 <= f <= 20 else 0.0, 0, 15.0 if 12 <= f <= 20 else 0.0, f)
        if l_arm: key_bone_rot(l_arm, lap, -12.0 if 12 <= f <= 20 else 0.0, laz, f)
        if l_fore: key_bone_rot(l_fore, -52.0 if 12 <= f <= 20 else -14.0, 0, -10.0 if 12 <= f <= 20 else 0.0, f)
        if l_hand: key_bone_rot(l_hand, 15.0 if 12 <= f <= 20 else 0.0, 0, 0, f)

# =============================================================================
# INYECCIÓN Y RETARGETING DE ANIMACIONES MIXAMO ANDROIDE
# =============================================================================

def inject_retargeted_android_motions(arm):
    """
    Inyecta las animaciones auténticas de Mixamo extraídas del Androide desde
    assets_source/animations/humanoid_motion_library.json:
    - nexo_walk (37 frames)
    - nexo_run (22 frames)
    - nexo_attack (44 frames)
    - nexo_jump (51 frames)
    - nexo_damage (42 frames)
    - nexo_dead (110 frames)
    Mapeando 1:1 la jerarquía de 65 huesos estándar Mixamo a los huesos de NEXO-01.
    """
    import os
    import json
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    json_path = os.path.join(base_dir, 'assets_source', 'animations', 'humanoid_motion_library.json')
    if not os.path.exists(json_path):
        print(f"  ⚠️ Archivo no encontrado: {json_path}")
        return
        
    with open(json_path, 'r', encoding='utf-8') as f:
        lib = json.load(f)
        
    bone_map = {}
    for b_src in lib.get('bones_hierarchy', []):
        target = next((b for b in arm.pose.bones if b.name == b_src or b.name.startswith(b_src + '_')), None)
        if target:
            bone_map[b_src] = target

    # Nota: 'walk' y 'run' se generan de forma procedural para garantizar zancada amplia, postura atlética limpia y evitar cruce de brazos dentro del torso
    animations_to_inject = ['attack', 'jump', 'damage', 'dead']
    for anim_id in animations_to_inject:
        anim_data = lib['animations'].get(anim_id)
        if not anim_data:
            continue
            
        action_name = f'nexo_{anim_id}'
        frame_count = anim_data['frame_count']
        create_action(arm, action_name, 0, frame_count - 1)
        
        for kf in anim_data['keyframes']:
            f = kf['frame']
            for b_src, b_data in kf['bones'].items():
                pbone = bone_map.get(b_src)
                if not pbone:
                    continue
                w, x, y, z = b_data['quat']
                pbone.rotation_mode = 'QUATERNION'
                pbone.rotation_quaternion = mathutils.Quaternion((w, x, y, z))
                pbone.keyframe_insert(data_path='rotation_quaternion', frame=f)
        print(f"    ✓ Animación auténtica inyectada: {action_name} ({frame_count} frames)")

# =============================================================================
# GENERADOR Y PUSHER A NLA TRACKS
# =============================================================================

def generate_all_nexo_animations(arm):
    print("🎬 =============================================================")
    print("⚡ GENERANDO SET DE ANIMACIONES JARBEES: NEXO-01 (FASES 1 Y 3)")
    print("🎬 =============================================================")
    
    # 0. Inyección de Locomoción y Combate Auténticos del Androide (Attack, Jump, Damage, Dead)
    print("  -> Inyectando animaciones auténticas desde humanoid_motion_library.json...")
    inject_retargeted_android_motions(arm)
    
    # Fase 1: Tierra y Reposo
    print("  -> Generando nexo_idle...")
    build_idle(arm)
    print("  -> Generando nexo_walk (Chill & Badass Armored Walker)...")
    build_walk(arm)
    print("  -> Generando nexo_run (CS 1.6 & Left 4 Dead Tactical Rush)...")
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
    print("  -> Generando nexo_crouch_walk (CS 1.6 Crouchrun)...")
    build_crouch_walk(arm)
    print("  -> Generando nexo_flinch_torso (CS 1.6 Gut Flinch)...")
    build_flinch_torso(arm)
    print("  -> Generando nexo_flinch_head (CS 1.6 Head Flinch)...")
    build_flinch_head(arm)
    print("  -> Generando nexo_death_forward / back / left / right (CS 1.6 Directional Deaths)...")
    build_death_forward(arm)
    build_death_back(arm)
    build_death_left(arm)
    build_death_right(arm)
    print("  -> Generando nexo_tactical_interact (CS 1.6 v_c4 interaction)...")
    build_tactical_interact(arm)
    print("  -> Generando nexo_quicklook (CS 1.6 Hostage quicklook)...")
    build_quicklook(arm)
    print("  -> Generando nexo_melee_shove (L4D Survivor Shove / Kinetic Repulse)...")
    build_melee_shove(arm)
    print("  -> Generando nexo_stumble_recovery (L4D Stumble Recovery)...")
    build_stumble_recovery(arm)
    print("  -> Generando nexo_limp_walk (L4D Limp Walk / Critical Integrity)...")
    build_limp_walk(arm)
    print("  -> Generando nexo_hunter_pounce (L4D Hunter Pounce / Superhero Landing)...")
    build_hunter_pounce(arm)
    print("  -> Generando nexo_emote_salute...")
    build_emote_salute(arm)
    print("  -> Generando nexo_emote_thumbs_up (Gesto 2: Pulgar Arriba)...")
    build_emote_thumbs_up(arm)
    print("  -> Generando nexo_emote_point...")
    build_emote_point(arm)
    print("  -> Generando nexo_emote_ok (Gesto 4: OK Sign 👌)...")
    build_emote_ok(arm)
    build_emote_beckon(arm)
    print("  -> Generando nexo_emote_cheer (Gesto 5: Celebración Victoria)...")
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
