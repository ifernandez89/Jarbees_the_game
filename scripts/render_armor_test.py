import bpy
import math
import mathutils
import os

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=r'G:\new models\armor.glb')

scene = bpy.context.scene
scene.render.resolution_x = 800
scene.render.resolution_y = 1000

# World background
if not scene.world:
    scene.world = bpy.data.worlds.new("World")
scene.world.color = (0.05, 0.05, 0.07)

# Lights
light_data = bpy.data.lights.new(name="Sun", type='SUN')
light_data.energy = 3.0
light_obj = bpy.data.objects.new("Sun", light_data)
light_obj.rotation_euler = (math.radians(45), math.radians(15), math.radians(30))
scene.collection.objects.link(light_obj)

fill_data = bpy.data.lights.new(name="Fill", type='SUN')
fill_data.energy = 1.5
fill_obj = bpy.data.objects.new("Fill", fill_data)
fill_obj.rotation_euler = (math.radians(-30), math.radians(-45), 0)
scene.collection.objects.link(fill_obj)

# Camera
cam_data = bpy.data.cameras.new("Cam")
cam_data.lens = 65
cam_obj = bpy.data.objects.new("Cam", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

# defaultMaterial bounds in world
obj = bpy.data.objects.get('defaultMaterial')
mw = obj.matrix_world
world_coords = [mw @ v.co for v in obj.data.vertices]
cx = sum(c.x for c in world_coords) / len(world_coords)
cy = sum(c.y for c in world_coords) / len(world_coords)
cz = sum(c.z for c in world_coords) / len(world_coords)

cam_obj.location = (cx, cy - 1.2, cz)
dir_vec = (mathutils.Vector((cx, cy, cz)) - cam_obj.location).normalized()
cam_obj.rotation_euler = dir_vec.to_track_quat('-Z', 'Y').to_euler()

os.makedirs('temp_render', exist_ok=True)
out_path = os.path.abspath('temp_render/armor_original_render.png')
scene.render.filepath = out_path
bpy.ops.render.render(write_still=True)
print("Rendered to:", out_path)
