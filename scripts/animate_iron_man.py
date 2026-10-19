import bpy
import math
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, 'assets_source', 'models')
IRON_MAN_SRC = os.path.join(MODELS_DIR, 'iron_man.glb')

def create_iron_man_animations():
    print('\n======================================================')
    print('🎬 CREATING AUTHENTIC FLIGHT & HOVER ANIMATIONS IN BLENDER')
    print('======================================================')
    
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=IRON_MAN_SRC)

    arm = [o for o in bpy.context.scene.objects if o.type == 'ARMATURE'][0]
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='POSE')

    # Configurar todos los huesos en XYZ Euler para animación limpia
    for pb in arm.pose.bones:
        pb.rotation_mode = 'XYZ'

    # Eliminar objetos auxiliares residuales
    for obj in list(bpy.context.scene.objects):
        if 'Icosphere' in obj.name or 'Glow' in obj.name or 'Light' in obj.name:
            bpy.data.objects.remove(obj, do_unlink=True)

    # -------------------------------------------------------------
    # Huesos clave del esqueleto Mixamo
    # -------------------------------------------------------------
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

    # Limpiar animaciones previas para evitar duplicados (.001)
    for act in list(bpy.data.actions):
        bpy.data.actions.remove(act, do_unlink=True)
    if arm.animation_data:
        arm.animation_data_clear()

    # -------------------------------------------------------------
    # 1. ACCIÓN: 'hover' (6 segundos / 180 frames @ 30fps)
    # - Postura humana viva de superhéroe flotando:
    #   * Hombros y brazos relajados y abiertos hacia afuera (90 cm entre manos)
    #   * Codos flexionados naturalmente hacia adelante (~14°)
    #   * Muñecas relajadas con micro-oscilación de estabilización
    #   * Rodillas dobladas naturalmente (rodilla izq ~28°, der ~22°)
    #   * Cabeza girando suavemente a los costados de vez en cuando
    #   * Respiración y flotación suave en pecho y torso
    # -------------------------------------------------------------
    action_hover = bpy.data.actions.new(name='hover')
    arm.animation_data_create()
    arm.animation_data.action = action_hover

    TOTAL_HOVER_FRAMES = 180
    for frame in range(TOTAL_HOVER_FRAMES + 1):
        norm_t = frame / float(TOTAL_HOVER_FRAMES) # 0.0 a 1.0

        # Respiración y flotación armónica
        breath = math.sin(norm_t * 4 * math.pi) * math.radians(2.5)
        sway = math.cos(norm_t * 2 * math.pi) * math.radians(1.5)

        if chest:
            chest.rotation_euler = (breath, 0, sway)
            chest.keyframe_insert(data_path='rotation_euler', frame=frame)
        if spine:
            spine.rotation_euler = (breath * 0.5, 0, sway * 0.5)
            spine.keyframe_insert(data_path='rotation_euler', frame=frame)

        # ---------------------------------------------------------
        # CABEZA Y CUELLO: Mirada fluida y orgánica con aceleración suave
        # Curva de campana cosenoidal (sin saltos bruscos de velocidad ni tirones)
        # ---------------------------------------------------------
        look_yaw = 0.0
        head_pitch = math.sin(norm_t * 4 * math.pi) * math.radians(1.5)

        if 0.15 <= norm_t <= 0.38:
            phase = (norm_t - 0.15) / 0.23
            # Curva suave ease-in ease-out sin saltos bruscos de aceleración
            smooth_bell = 0.5 * (1.0 - math.cos(phase * 2.0 * math.pi))
            look_yaw = smooth_bell * math.radians(22.0)
        elif 0.55 <= norm_t <= 0.78:
            phase = (norm_t - 0.55) / 0.23
            smooth_bell = 0.5 * (1.0 - math.cos(phase * 2.0 * math.pi))
            look_yaw = -smooth_bell * math.radians(22.0)

        # Distribuir la rotación entre cabeza (70%) y cuello (30%) de forma anatómica fluida
        if head:
            head.rotation_euler = (head_pitch, look_yaw * 0.70, 0)
            head.keyframe_insert(data_path='rotation_euler', frame=frame)
        if neck:
            neck.rotation_euler = (head_pitch * 0.5, look_yaw * 0.30, 0)
            neck.keyframe_insert(data_path='rotation_euler', frame=frame)

        # ---------------------------------------------------------
        # HOMBROS Y BRAZOS: RELAJADOS Y ABIERTOS DESDE LOS HOMBROS
        # Manos a 90 cm de separación lateral, descansando con porte heroico
        # ---------------------------------------------------------
        arm_breath = math.sin(norm_t * 4 * math.pi) * math.radians(1.5)

        # Hombros abiertos hacia afuera
        if l_sh:
            l_sh.rotation_euler = (0, math.radians(-12.0), math.radians(-4.0))
            l_sh.keyframe_insert(data_path='rotation_euler', frame=frame)
        if r_sh:
            r_sh.rotation_euler = (0, math.radians(12.0), math.radians(4.0))
            r_sh.keyframe_insert(data_path='rotation_euler', frame=frame)

        # Brazos abiertos y relajados a los lados
        if l_arm:
            l_arm.rotation_euler = (math.radians(10.0) + arm_breath, math.radians(-12.0), math.radians(-2.0))
            l_arm.keyframe_insert(data_path='rotation_euler', frame=frame)
        if r_arm:
            r_arm.rotation_euler = (math.radians(10.0) + arm_breath, math.radians(12.0), math.radians(2.0))
            r_arm.keyframe_insert(data_path='rotation_euler', frame=frame)

        # Codos y antebrazos flexionados naturalmente
        elbow_pulse = math.sin(norm_t * 4 * math.pi) * math.radians(1.5)
        if l_forearm:
            l_forearm.rotation_euler = (math.radians(-14.0) - elbow_pulse, 0, math.radians(-4.0))
            l_forearm.keyframe_insert(data_path='rotation_euler', frame=frame)
        if r_forearm:
            r_forearm.rotation_euler = (math.radians(-14.0) - elbow_pulse, 0, math.radians(4.0))
            r_forearm.keyframe_insert(data_path='rotation_euler', frame=frame)

        # Muñecas y manos relajadas con micro-oscilación de flotabilidad
        wrist_vibe = math.sin(norm_t * 8 * math.pi) * math.radians(1.2)
        if l_hand:
            l_hand.rotation_euler = (math.radians(8.0) + wrist_vibe, math.radians(-6.0), math.radians(2.0))
            l_hand.keyframe_insert(data_path='rotation_euler', frame=frame)
        if r_hand:
            r_hand.rotation_euler = (math.radians(8.0) + wrist_vibe, math.radians(6.0), math.radians(-2.0))
            r_hand.keyframe_insert(data_path='rotation_euler', frame=frame)

        # ---------------------------------------------------------
        # PIERNAS Y RODILLAS: POSTURA HEROICA VIVA ESCALONADA CON FLEXIÓN
        # ---------------------------------------------------------
        leg_pulse = math.sin(norm_t * 4 * math.pi) * math.radians(1.5)
        if l_upleg:
            l_upleg.rotation_euler = (math.radians(-10.0) + leg_pulse, 0, math.radians(-3.0))
            l_upleg.keyframe_insert(data_path='rotation_euler', frame=frame)
        if r_upleg:
            r_upleg.rotation_euler = (math.radians(6.0) - leg_pulse, 0, math.radians(3.0))
            r_upleg.keyframe_insert(data_path='rotation_euler', frame=frame)

        # Rodillas claramente flexionadas (28° y 22°)
        if l_leg:
            l_leg.rotation_euler = (math.radians(28.0) + leg_pulse, 0, 0)
            l_leg.keyframe_insert(data_path='rotation_euler', frame=frame)
        if r_leg:
            r_leg.rotation_euler = (math.radians(22.0) - leg_pulse, 0, 0)
            r_leg.keyframe_insert(data_path='rotation_euler', frame=frame)

        # Pies apuntando directamente hacia la tierra (suelo / repulsores hacia abajo)
        # Con la flexión de rodillas a 28° y 22°, -65° y -68° orientan la planta y botas hacia la tierra
        if l_foot:
            l_foot.rotation_euler = (math.radians(-65.0), 0, 0)
            l_foot.keyframe_insert(data_path='rotation_euler', frame=frame)
        if r_foot:
            r_foot.rotation_euler = (math.radians(-68.0), 0, 0)
            r_foot.keyframe_insert(data_path='rotation_euler', frame=frame)

    print('✅ Action "hover" created (180 frames / 6s loop)')

    # -------------------------------------------------------------
    # 2. ACCIÓN: 'flight' (Vuelo supersónico horizontal "acostado")
    # - Postura aerodinámica de torpedo:
    #   * Brazos pegados a los costados del cuerpo (60 cm)
    #   * Codos flexionados con tensión de velocidad (~12°)
    #   * Muñecas con giro dinámico de 18° simulando aletas estabilizadoras
    #   * Rodillas flexionadas (~24° y ~18°) para eliminar rigidez
    #   * Cabeza levantada (-48°) mirando directo al horizonte hacia adelante
    # -------------------------------------------------------------
    action_flight = bpy.data.actions.new(name='flight')
    arm.animation_data.action = action_flight

    TOTAL_FLIGHT_FRAMES = 60
    for frame in range(TOTAL_FLIGHT_FRAMES + 1):
        norm_t = frame / float(TOTAL_FLIGHT_FRAMES)
        vibe = math.sin(norm_t * 12 * math.pi) * math.radians(0.8) # Micro-vibración supersónica

        if chest:
            chest.rotation_euler = (math.radians(8.0) + vibe, 0, 0)
            chest.keyframe_insert(data_path='rotation_euler', frame=frame)
        if spine:
            spine.rotation_euler = (math.radians(4.0), 0, 0)
            spine.keyframe_insert(data_path='rotation_euler', frame=frame)

        # Cabeza levantada mirando al horizonte hacia adelante cuando el cuerpo está horizontal
        if head:
            head.rotation_euler = (math.radians(-48.0) + vibe, 0, 0)
            head.keyframe_insert(data_path='rotation_euler', frame=frame)

        # Hombros alineados
        if l_sh:
            l_sh.rotation_euler = (0, 0, 0)
            l_sh.keyframe_insert(data_path='rotation_euler', frame=frame)
        if r_sh:
            r_sh.rotation_euler = (0, 0, 0)
            r_sh.keyframe_insert(data_path='rotation_euler', frame=frame)

        # Brazos pegados a los costados del cuerpo
        if l_arm:
            l_arm.rotation_euler = (math.radians(18.0) + vibe * 0.5, math.radians(-8.0), math.radians(22.0))
            l_arm.keyframe_insert(data_path='rotation_euler', frame=frame)
        if r_arm:
            r_arm.rotation_euler = (math.radians(18.0) + vibe * 0.5, math.radians(8.0), math.radians(-22.0))
            r_arm.keyframe_insert(data_path='rotation_euler', frame=frame)

        # Codos flexionados con tensión
        if l_forearm:
            l_forearm.rotation_euler = (math.radians(-12.0), 0, math.radians(6.0))
            l_forearm.keyframe_insert(data_path='rotation_euler', frame=frame)
        if r_forearm:
            r_forearm.rotation_euler = (math.radians(-12.0), 0, math.radians(-6.0))
            r_forearm.keyframe_insert(data_path='rotation_euler', frame=frame)

        # Muñecas con giro dinámico de 18° estabilizando el flujo
        hand_twist = math.sin(norm_t * 6 * math.pi) * math.radians(2.0)
        if l_hand:
            l_hand.rotation_euler = (math.radians(-15.0), math.radians(18.0) + hand_twist, math.radians(-10.0))
            l_hand.keyframe_insert(data_path='rotation_euler', frame=frame)
        if r_hand:
            r_hand.rotation_euler = (math.radians(-15.0), math.radians(-18.0) - hand_twist, math.radians(10.0))
            r_hand.keyframe_insert(data_path='rotation_euler', frame=frame)

        # Piernas y rodillas en vuelo: flexión atlética
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

        # Planta de los pies rectas mirando "de cara" hacia el usuario (hacia atrás, perpendicular a la trayectoria)
        # En lugar de colgar hacia abajo por la gravedad (+35°), se orientan a -14° para apuntar los propulsores directamente a la cámara
        if l_foot:
            l_foot.rotation_euler = (math.radians(-14.0), 0, 0)
            l_foot.keyframe_insert(data_path='rotation_euler', frame=frame)
        if r_foot:
            r_foot.rotation_euler = (math.radians(-14.0), 0, 0)
            r_foot.keyframe_insert(data_path='rotation_euler', frame=frame)

    print('✅ Action "flight" created (60 frames / 2s loop)')

    # Empujar ambas acciones a tracks NLA para que el exportador glTF las incluya
    arm.animation_data.use_nla = True
    track1 = arm.animation_data.nla_tracks.new()
    track1.name = 'Track_Hover'
    track1.strips.new('hover', 0, action_hover)

    track2 = arm.animation_data.nla_tracks.new()
    track2.name = 'Track_Flight'
    track2.strips.new('flight', 0, action_flight)

    # Volver a Object Mode
    bpy.ops.object.mode_set(mode='OBJECT')

    # Exportar con Draco y animaciones completas
    dst = os.path.join(MODELS_DIR, 'iron_man.glb')
    bpy.ops.export_scene.gltf(
        filepath=dst,
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
    print(f'🎉 Iron Man successfully animated and exported to {dst} ({os.path.getsize(dst)/(1024*1024):.2f} MB)!')

if __name__ == '__main__':
    create_iron_man_animations()
