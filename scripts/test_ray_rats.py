
import bpy, mathutils

# Import de_rats3.glb
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=r"c:\Projects\Jarbees_the_game\public\models\de_rats3.glb")

obj = bpy.context.selected_objects[0] if bpy.context.selected_objects else bpy.data.objects[0]

# Raycast from x=-11.38, z=-11.58 down from y=20.0, y=14.0, y=12.5
for start_y in [20.0, 15.0, 13.5, 12.5]:
    origin = mathutils.Vector((-11.38, -11.58, start_y)) # In Blender Z is up? wait, glTF was imported
    # In glTF Y is up. Let's check Blender object orientation
    # In Blender imported glTF has Y up converted to Z up
    b_origin = mathutils.Vector((-11.38, start_y, -11.58)) # Blender coordinates
    result, loc, normal, index = obj.ray_cast(mathutils.Vector((-11.38, -11.58, start_y)), mathutils.Vector((0, 0, -1)))
    print(f"From Z={start_y}: hit={result}, loc={loc}, normal={normal}")

