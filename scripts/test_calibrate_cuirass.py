import bpy
import math
import mathutils
import os

bpy.ops.wm.read_factory_settings(use_empty=True)

SUIT_PATH = r'c:\Projects\Jarbees_the_game\assets_source\models\jarbees_suit.glb'
ARMOR_PATH = r'c:\Projects\Jarbees_the_game\assets_source\models\armor_plate.glb'

bpy.ops.import_scene.gltf(filepath=SUIT_PATH)
arm = [o for o in bpy.context.scene.objects if o.type == 'ARMATURE'][0]

for name in ['JarBees_Armor_PlexusShield', 'JarBees_Armor_PlexusHook', 'JarBees_Chest_HexCore']:
    obj = bpy.data.objects.get(name)
    if obj:
        bpy.data.objects.remove(obj, do_unlink=True)

existing_objs = set(bpy.context.scene.objects)
bpy.ops.import_scene.gltf(filepath=ARMOR_PATH)
new_objs = [o for o in bpy.context.scene.objects if o not in existing_objs]
cuirass_mesh = [o for o in new_objs if o.type == 'MESH'][0]

mw = cuirass_mesh.matrix_world.copy()
cuirass_mesh.parent = None
cuirass_mesh.matrix_world = mw

for o in new_objs:
    if o.type == 'EMPTY':
        bpy.data.objects.remove(o, do_unlink=True)

cuirass_mesh.name = "JarBees_Medieval_Angel_Cuirass"

xs = [(cuirass_mesh.matrix_world @ v.co).x for v in cuirass_mesh.data.vertices]
ys = [(cuirass_mesh.matrix_world @ v.co).y for v in cuirass_mesh.data.vertices]
zs = [(cuirass_mesh.matrix_world @ v.co).z for v in cuirass_mesh.data.vertices]

w_orig = max(xs) - min(xs)
d_orig = max(ys) - min(ys)
h_orig = max(zs) - min(zs)
cx = (min(xs) + max(xs)) / 2.0
cy = (min(ys) + max(ys)) / 2.0
cz = (min(zs) + max(zs)) / 2.0

# Calibrate scale:
# Target width: ~0.34 m (wide enough to cover pectorals elegantly)
# Target height: ~0.40 m (covers from bottom of sternum to collar)
# Target depth: ~0.20 m (hugs torso without clipping spine)
scale_x = 0.350 / w_orig
scale_z = 0.405 / h_orig
scale_y = 0.220 / d_orig

for v in cuirass_mesh.data.vertices:
    p = cuirass_mesh.matrix_world @ v.co
    v.co.x = (p.x - cx) * scale_x
    v.co.y = (p.y - cy) * scale_y
    v.co.z = (p.z - cz) * scale_z

cuirass_mesh.matrix_world = mathutils.Matrix.Identity(4)

# Pitch rotation (forward tilt) to match torso posture
m_rot = mathutils.Euler((math.radians(9.5), 0, 0)).to_matrix().to_4x4()
# Position:
# Nexo reactor center was: X=0.000, Y=-0.176, Z=0.416
# We position the cuirass so its apex covers Y=-0.195, Z center=0.380
m_trans = mathutils.Matrix.Translation(mathutils.Vector((0.000, -0.098, 0.370)))
cuirass_mesh.data.transform(m_trans @ m_rot)
cuirass_mesh.matrix_world = mathutils.Matrix.Identity(4)

# Setup render scene
scene = bpy.context.scene
scene.render.resolution_x = 1024
scene.render.resolution_y = 1024

if not scene.world:
    scene.world = bpy.data.worlds.new("World")
scene.world.color = (0.02, 0.025, 0.035)

# Cinematic 3-point Studio Lighting
key_light = bpy.data.lights.new(name="KeyLight", type='AREA')
key_light.energy = 160
key_light.size = 1.6
key_light.color = (1.0, 0.97, 0.94)
key_obj = bpy.data.objects.new("KeyLight", key_light)
key_obj.location = (1.1, -1.8, 0.9)
scene.collection.objects.link(key_obj)

fill_light = bpy.data.lights.new(name="FillLight", type='AREA')
fill_light.energy = 75
fill_light.size = 2.4
fill_light.color = (0.45, 0.72, 1.0)
fill_obj = bpy.data.objects.new("FillLight", fill_light)
fill_obj.location = (-1.3, -1.6, 0.3)
scene.collection.objects.link(fill_obj)

rim_light = bpy.data.lights.new(name="RimLight", type='AREA')
rim_light.energy = 140
rim_light.size = 1.8
rim_light.color = (0.85, 0.92, 1.0)
rim_obj = bpy.data.objects.new("RimLight", rim_light)
rim_obj.location = (0.0, 2.0, 1.3)
scene.collection.objects.link(rim_obj)

cam_data = bpy.data.cameras.new("Cam")
cam_data.lens = 65
cam_obj = bpy.data.objects.new("Cam", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

os.makedirs('temp_render', exist_ok=True)

# 1. Front view
cam_obj.location = (0.0, -1.5, 0.37)
cam_obj.rotation_euler = (math.radians(90.0), 0, 0)
scene.render.filepath = os.path.abspath('temp_render/cuirass_calib_front.png')
bpy.ops.render.render(write_still=True)

# 2. Angle view 3/4
cam_obj.location = (0.85, -1.35, 0.42)
dir_vec = (mathutils.Vector((0, 0, 0.37)) - cam_obj.location).normalized()
cam_obj.rotation_euler = dir_vec.to_track_quat('-Z', 'Y').to_euler()
scene.render.filepath = os.path.abspath('temp_render/cuirass_calib_angle.png')
bpy.ops.render.render(write_still=True)

# 3. Side profile view
cam_obj.location = (1.4, -0.05, 0.37)
dir_vec = (mathutils.Vector((0, -0.05, 0.37)) - cam_obj.location).normalized()
cam_obj.rotation_euler = dir_vec.to_track_quat('-Z', 'Y').to_euler()
scene.render.filepath = os.path.abspath('temp_render/cuirass_calib_side.png')
bpy.ops.render.render(write_still=True)

print("Calibrated renders saved successfully!")
