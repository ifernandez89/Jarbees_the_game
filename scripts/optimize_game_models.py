import bpy
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, 'assets_source', 'models')

def optimize_colibri():
    print('\n========================================')
    print('🦜 OPTIMIZING COLIBRI MODEL')
    print('========================================')
    src = os.path.join(MODELS_DIR, 'colibri.glb')
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=src)

    # Clean unused icosphere if present
    for obj in list(bpy.context.scene.objects):
        if 'Icosphere' in obj.name:
            bpy.data.objects.remove(obj, do_unlink=True)

    dst = os.path.join(MODELS_DIR, 'colibri.glb')
    bpy.ops.export_scene.gltf(
        filepath=dst,
        export_format='GLB',
        export_animations=True,
        export_skins=True,
        export_materials='EXPORT',
        export_image_format='AUTO'
    )
    print(f'✅ Colibri re-exported to {dst} ({os.path.getsize(dst)/(1024*1024):.2f} MB)')

def optimize_butterfly():
    print('\n========================================')
    print('🦋 OPTIMIZING BUTTERFLY MODEL')
    print('========================================')
    src = os.path.join(MODELS_DIR, 'butterfly.glb')
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=src)

    # Clean unused icosphere if present
    for obj in list(bpy.context.scene.objects):
        if 'Icosphere' in obj.name:
            bpy.data.objects.remove(obj, do_unlink=True)

    dst = os.path.join(MODELS_DIR, 'butterfly.glb')
    bpy.ops.export_scene.gltf(
        filepath=dst,
        export_format='GLB',
        export_animations=True,
        export_skins=True,
        export_materials='EXPORT',
        export_image_format='AUTO'
    )
    print(f'✅ Butterfly re-exported to {dst} ({os.path.getsize(dst)/(1024*1024):.2f} MB)')

def optimize_iron_man():
    print('\n========================================')
    print('🦾 OPTIMIZING IRON MAN MODEL (SCALE & DRACO)')
    print('========================================')
    src = os.path.join(MODELS_DIR, 'iron_man.glb')
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=src)

    # Clean unused icosphere
    for obj in list(bpy.context.scene.objects):
        if 'Icosphere' in obj.name:
            bpy.data.objects.remove(obj, do_unlink=True)

    # Calculate current max height of meshes
    max_height = 0.0
    for obj in bpy.context.scene.objects:
        if obj.type == 'MESH':
            if obj.dimensions.z > max_height:
                max_height = obj.dimensions.z

    print(f'Current raw height in Blender: {max_height:.4f} m')

    # We want Iron Man to be exactly 1.85m tall in real Three.js units (scale 1.0)
    target_height = 1.85
    if max_height > 0:
        scale_ratio = target_height / max_height
        print(f'Applying scale ratio: {scale_ratio:.4f} to reach {target_height}m')
        
        # Scale top parent
        top_obj = bpy.data.objects.get('Sketchfab_model') or bpy.context.scene.objects[0]
        while top_obj.parent:
            top_obj = top_obj.parent
        
        top_obj.scale *= scale_ratio
        bpy.context.view_layer.update()

    # Verify new height
    for obj in bpy.context.scene.objects:
        if obj.type == 'MESH' and 'Red_Part' in obj.name:
            print(f'Mesh {obj.name} scaled dimensions: {obj.dimensions}')

    # Optimize textures for mobile performance (compress to JPEG / web friendly if needed)
    # And export with Draco compression for fast download and low memory usage
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
    print(f'✅ Iron Man optimized and exported to {dst} ({os.path.getsize(dst)/(1024*1024):.2f} MB)')

if __name__ == '__main__':
    optimize_colibri()
    optimize_butterfly()
    optimize_iron_man()
    print('\n🎉 All 3 models successfully converted and optimized!')
