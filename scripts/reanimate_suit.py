import bpy
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPTS_DIR = os.path.join(BASE_DIR, 'scripts')
MODELS_DIR = os.path.join(BASE_DIR, 'assets_source', 'models')
SUIT_GLB = os.path.join(MODELS_DIR, 'jarbees_suit.glb')

if SCRIPTS_DIR not in sys.path:
    sys.path.append(SCRIPTS_DIR)

from generate_nexo_animations import generate_all_nexo_animations

def reanimate_suit():
    print(f"🚀 Cargando modelo para actualización de animaciones: {SUIT_GLB}")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=SUIT_GLB)
    
    arm_objs = [o for o in bpy.data.objects if o.type == 'ARMATURE']
    if not arm_objs:
        raise RuntimeError("No se encontró Armature en el modelo.")
    arm = arm_objs[0]
    bpy.context.view_layer.objects.active = arm
    
    # Limpiar NLA tracks y acciones previas
    if arm.animation_data:
        arm.animation_data.action = None
        for track in list(arm.animation_data.nla_tracks):
            arm.animation_data.nla_tracks.remove(track)
            
    for act in list(bpy.data.actions):
        bpy.data.actions.remove(act)
        
    print("✨ Generando nuevo set de animaciones NEXO-01 (con nexo_walk Chill & Badass)...")
    bpy.ops.object.mode_set(mode='POSE')
    generate_all_nexo_animations(arm)
    bpy.ops.object.mode_set(mode='OBJECT')
    
    print(f"📦 Exportando {SUIT_GLB} con compresión Draco...")
    bpy.ops.export_scene.gltf(
        filepath=SUIT_GLB,
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
    size_mb = os.path.getsize(SUIT_GLB) / (1024 * 1024)
    print(f"✅ ¡Modelo reanimado con éxito! Tamaño: {size_mb:.2f} MB")

if __name__ == '__main__':
    reanimate_suit()
