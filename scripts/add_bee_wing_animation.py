"""
Script para añadir animación de aleteo de alas a la abeja
Si ya existe animación, la mejora. Si no existe, la crea.

Uso:
    blender --background --python add_bee_wing_animation.py
"""

import bpy
import math
import os

def find_wing_objects():
    """Encuentra objetos que puedan ser alas"""
    wings = []
    keywords = ['wing', 'ala', 'aile', 'flügel', 'Wing', 'Ala']
    
    for obj in bpy.data.objects:
        if obj.type == 'MESH':
            for keyword in keywords:
                if keyword in obj.name:
                    wings.append(obj)
                    break
    
    return wings

def create_wing_flap_animation(wing_obj, side='left', fps=24, duration=0.5):
    """
    Crea animación de aleteo para un ala
    
    Args:
        wing_obj: Objeto del ala
        side: 'left' o 'right'
        fps: Frames por segundo
        duration: Duración de un ciclo completo en segundos
    """
    total_frames = int(fps * duration)
    
    # Ángulos de rotación (en radianes)
    # Las abejas aletean entre 200-230 veces por segundo, 
    # pero lo haremos más lento para visualización
    angle_up = math.radians(-45) if side == 'left' else math.radians(45)
    angle_down = math.radians(45) if side == 'left' else math.radians(-45)
    
    # Crear acción
    action_name = f"BeeWingFlap_{side.capitalize()}"
    action = bpy.data.actions.new(name=action_name)
    
    if not wing_obj.animation_data:
        wing_obj.animation_data_create()
    
    wing_obj.animation_data.action = action
    
    # Keyframes para rotación en X (aleteo)
    fcurve = action.fcurves.new(data_path="rotation_euler", index=0)
    
    # Frame 0: Posición neutral
    fcurve.keyframe_points.insert(0, 0)
    
    # Frame 1/4: Ala arriba
    fcurve.keyframe_points.insert(total_frames // 4, angle_up)
    
    # Frame 1/2: Posición neutral
    fcurve.keyframe_points.insert(total_frames // 2, 0)
    
    # Frame 3/4: Ala abajo
    fcurve.keyframe_points.insert(3 * total_frames // 4, angle_down)
    
    # Frame final: Vuelta a neutral
    fcurve.keyframe_points.insert(total_frames, 0)
    
    # Suavizar interpolación
    for keyframe in fcurve.keyframe_points:
        keyframe.interpolation = 'BEZIER'
        keyframe.handle_left_type = 'AUTO_CLAMPED'
        keyframe.handle_right_type = 'AUTO_CLAMPED'
    
    # Configurar para loop
    for fcurve in action.fcurves:
        modifier = fcurve.modifiers.new(type='CYCLES')
    
    print(f"✅ Animación creada: {action_name} ({total_frames} frames)")
    
    return action

def add_bee_animation():
    # Limpiar escena
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    
    # Rutas
    bee_input = r"C:\Projects\Jarbees_the_game\public\models\bee.glb"
    bee_output = r"C:\Projects\Jarbees_the_game\public\models\bee_animated.glb"
    
    if not os.path.exists(bee_input):
        print(f"❌ ERROR: No se encontró {bee_input}")
        return
    
    print(f"📂 Cargando modelo: {bee_input}")
    bpy.ops.import_scene.gltf(filepath=bee_input)
    
    print("\n🔍 Buscando alas...")
    wings = find_wing_objects()
    
    if not wings:
        print("⚠️  No se encontraron alas con nombres estándar")
        print("   Objetos disponibles:")
        for obj in bpy.data.objects:
            if obj.type == 'MESH':
                print(f"   - {obj.name}")
        
        # Intentar con los dos primeros meshes si no hay alas identificadas
        meshes = [obj for obj in bpy.data.objects if obj.type == 'MESH']
        if len(meshes) >= 2:
            print("\n   💡 Usando los primeros 2 meshes como alas...")
            wings = meshes[:2]
    
    if len(wings) >= 2:
        print(f"\n✅ Encontradas {len(wings)} alas")
        
        # Animar primera ala (izquierda)
        print(f"\n🎬 Animando: {wings[0].name} (izquierda)")
        create_wing_flap_animation(wings[0], side='left', fps=24, duration=0.15)
        
        # Animar segunda ala (derecha)
        print(f"🎬 Animando: {wings[1].name} (derecha)")
        create_wing_flap_animation(wings[1], side='right', fps=24, duration=0.15)
        
    elif len(wings) == 1:
        print(f"\n⚠️  Solo se encontró 1 ala: {wings[0].name}")
        print("   Animando solo esta ala...")
        create_wing_flap_animation(wings[0], side='left', fps=24, duration=0.15)
    else:
        print("\n❌ No se pudieron identificar alas para animar")
        print("   El modelo original se mantendrá sin cambios")
        return
    
    # Exportar
    print(f"\n💾 Exportando modelo animado a: {bee_output}")
    bpy.ops.export_scene.gltf(
        filepath=bee_output,
        export_format='GLB',
        export_animations=True,
        export_force_sampling=True
    )
    
    print("\n" + "="*60)
    print("✅ MODELO ANIMADO CREADO EXITOSAMENTE")
    print("="*60)
    print(f"📁 Ubicación: {bee_output}")
    print("\n💡 Para usar en el juego, reemplaza en GameScene.tsx:")
    print('   <BeePlayer modelPath="/models/bee_animated.glb" />')

if __name__ == "__main__":
    add_bee_animation()
