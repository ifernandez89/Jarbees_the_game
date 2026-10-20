import bpy
import math
import mathutils
import os

bpy.ops.wm.read_factory_settings(use_empty=True)

SUIT_PATH = r'c:\Projects\Jarbees_the_game\assets_source\models\jarbees_suit.glb'
ARMOR_PATH = r'c:\Projects\Jarbees_the_game\assets_source\models\armor_plate.glb'

bpy.ops.import_scene.gltf(filepath=SUIT_PATH)
arm = [o for o in bpy.context.scene.objects if o.type == 'ARMATURE'][0]

# Remove previous plexus shield, hook, and the protruding hex core
for name in ['JarBees_Armor_PlexusShield', 'JarBees_Armor_PlexusHook', 'JarBees_Chest_HexCore']:
    obj = bpy.data.objects.get(name)
    if obj:
        bpy.data.objects.remove(obj, do_unlink=True)

# Import new medieval angel cuirass
existing_objs = set(bpy.context.scene.objects)
bpy.ops.import_scene.gltf(filepath=ARMOR_PATH)
new_objs = [o for o in bpy.context.scene.objects if o not in existing_objs]
cuirass_mesh = [o for o in new_objs if o.type == 'MESH'][0]

# Unparent and clear empties
mw = cuirass_mesh.matrix_world.copy()
cuirass_mesh.parent = None
cuirass_mesh.matrix_world = mw

for o in new_objs:
    if o.type == 'EMPTY':
        bpy.data.objects.remove(o, do_unlink=True)

cuirass_mesh.name = "JarBees_Medieval_Angel_Cuirass"

# Calculate original bounds in world coordinates
xs = [(cuirass_mesh.matrix_world @ v.co).x for v in cuirass_mesh.data.vertices]
ys = [(cuirass_mesh.matrix_world @ v.co).y for v in cuirass_mesh.data.vertices]
zs = [(cuirass_mesh.matrix_world @ v.co).z for v in cuirass_mesh.data.vertices]

w_orig = max(xs) - min(xs)
d_orig = max(ys) - min(ys)
h_orig = max(zs) - min(zs)
cx = (min(xs) + max(xs)) / 2.0
cy = (min(ys) + max(ys)) / 2.0
cz = (min(zs) + max(zs)) / 2.0

print(f"Original Cuirass: W={w_orig:.3f}, D={d_orig:.3f}, H={h_orig:.3f}, Center=({cx:.3f}, {cy:.3f}, {cz:.3f})")

# Target dimensions for Nexo's chest:
# Nexo chest width across pectorals is ~0.38 m, height from collar (0.53) to above belt (0.16) is ~0.37 m.
# Cuirass original aspect ratio is H=0.596, W=0.434 -> W/H = 0.728.
# Target H = 0.385, which gives W ≈ 0.280 - 0.360.
TARGET_H = 0.385
scale = TARGET_H / h_orig

# Normalize around its center
for v in cuirass_mesh.data.vertices:
    # Get world position
    p = cuirass_mesh.matrix_world @ v.co
    # Center and scale
    p_norm = (p - mathutils.Vector((cx, cy, cz))) * scale
    v.co = p_norm

cuirass_mesh.matrix_world = mathutils.Matrix.Identity(4)

# Pitch rotation to match torso angle (approx 8-10 degrees forward tilt)
# And position: X=0, Y ~ -0.145 to -0.165, Z ~ 0.355
m_rot = mathutils.Euler((math.radians(8.5), 0, 0)).to_matrix().to_4x4()
m_trans = mathutils.Matrix.Translation(mathutils.Vector((0.000, -0.100, 0.365)))
cuirass_mesh.data.transform(m_trans @ m_rot)
cuirass_mesh.matrix_world = mathutils.Matrix.Identity(4)

# Check world bounds after transform
xs_post = [v.co.x for v in cuirass_mesh.data.vertices]
ys_post = [v.co.y for v in cuirass_mesh.data.vertices]
zs_post = [v.co.z for v in cuirass_mesh.data.vertices]
print(f"Transformed bounds: X=[{min(xs_post):.3f}, {max(xs_post):.3f}], Y=[{min(ys_post):.3f}, {max(ys_post):.3f}], Z=[{min(zs_post):.3f}, {max(zs_post):.3f}]")

# Setup render scene
scene = bpy.context.scene
scene.render.resolution_x = 1024
scene.render.resolution_y = 1024

if not scene.world:
    scene.world = bpy.data.worlds.new("World")
scene.world.color = (0.02, 0.025, 0.035)

# Studio Lights
key_light = bpy.data.lights.new(name="KeyLight", type='AREA')
key_light.energy = 150
key_light.size = 1.5
key_light.color = (1.0, 0.96, 0.92)
key_obj = bpy.data.objects.new("KeyLight", key_light)
key_obj.location = (1.0, -2.0, 1.0)
scene.collection.objects.link(key_obj)

fill_light = bpy.data.lights.new(name="FillLight", type='AREA')
fill_light.energy = 80
fill_light.size = 2.0
fill_light.color = (0.4, 0.7, 1.0)
fill_obj = bpy.data.objects.new("FillLight", fill_light)
fill_obj.location = (-1.2, -1.8, 0.4)
scene.collection.objects.link(fill_obj)

rim_light = bpy.data.lights.new(name="RimLight", type='AREA')
rim_light.energy = 120
rim_light.size = 1.5
rim_light.color = (0.8, 0.9, 1.0)
rim_obj = bpy.data.objects.new("RimLight", rim_light)
rim_obj.location = (0.0, 2.0, 1.2)
scene.collection.objects.link(rim_obj)

cam_data = bpy.data.cameras.new("Cam")
cam_data.lens = 65
cam_obj = bpy.data.objects.new("Cam", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

os.makedirs('temp_render', exist_ok=True)

# 1. Front view
cam_obj.location = (0.0, -1.6, 0.38)
cam_obj.rotation_euler = (math.radians(90.0), 0, 0)
scene.render.filepath = os.path.abspath('temp_render/test_fit_front.png')
bpy.ops.render.render(write_still=True)

# 2. Angle view 3/4
cam_obj.location = (0.9, -1.4, 0.42)
dir_vec = (mathutils.Vector((0, 0, 0.36)) - cam_obj.location).normalized()
cam_obj.rotation_euler = dir_vec.to_track_quat('-Z', 'Y').to_euler()
scene.render.filepath = os.path.abspath('temp_render/test_fit_angle.png')
bpy.ops.render.render(write_still=True)

print("Renders saved to temp_render/!")
