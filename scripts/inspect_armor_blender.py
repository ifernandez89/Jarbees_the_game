import bpy
import os

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=r'G:\new models\armor.glb')

print('--- IMAGES ---')
os.makedirs('temp_armor_textures', exist_ok=True)
for img in bpy.data.images:
    print(f"Image {img.name}: size={img.size[0]}x{img.size[1]}, channels={img.channels}, file_format={img.file_format}")
    save_path = os.path.abspath(f"temp_armor_textures/{img.name}.png")
    img.save_render(filepath=save_path)
    print(f"  Saved render to: {save_path}")

obj = bpy.data.objects.get('defaultMaterial')
if obj:
    print(f"Object world transform:")
    print(f"  matrix_world:\n{obj.matrix_world}")
    print(f"  dimensions: {obj.dimensions}")
    # Check parent hierarchy
    curr = obj
    while curr:
        print(f"  Hierarchy: {curr.name} (type={curr.type}, loc={curr.location}, scale={curr.scale}, rot={curr.rotation_euler})")
        curr = curr.parent

    # Let's inspect vertices in world space
    mw = obj.matrix_world
    world_coords = [mw @ v.co for v in obj.data.vertices]
    xs = [c.x for c in world_coords]
    ys = [c.y for c in world_coords]
    zs = [c.z for c in world_coords]
    print(f"World bounds X: [{min(xs):.3f}, {max(xs):.3f}], Y: [{min(ys):.3f}, {max(ys):.3f}], Z: [{min(zs):.3f}, {max(zs):.3f}]")
