import bpy
import math
import mathutils
import os

bpy.ops.wm.read_factory_settings(use_empty=True)

# 1. Import jarbees_suit.glb
SUIT_PATH = r'C:\Projects\Jarbees_the_game\assets_source\models\jarbees_suit.glb'
bpy.ops.import_scene.gltf(filepath=SUIT_PATH)

arm = [o for o in bpy.context.scene.objects if o.type == 'ARMATURE'][0]

# Remove old plexus shield and hook if present
for name in ['JarBees_Armor_PlexusShield', 'JarBees_Armor_PlexusHook']:
    obj = bpy.data.objects.get(name)
    if obj:
        bpy.data.objects.remove(obj, do_unlink=True)

# 2. Import armor.glb
ARMOR_PATH = r'G:\new models\armor.glb'
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

cuirass_mesh.name = "JarBees_Cuirass_Pechera"

# 3. Analyze original coordinates of the cuirass
xs = [v.co.x for v in cuirass_mesh.data.vertices]
ys = [v.co.y for v in cuirass_mesh.data.vertices]
zs = [v.co.z for v in cuirass_mesh.data.vertices]
w_orig = max(xs) - min(xs)
h_orig = max(zs) - min(zs)
d_orig = max(ys) - min(ys)
cx = (min(xs) + max(xs)) / 2.0
cy = (min(ys) + max(ys)) / 2.0
cz = (min(zs) + max(zs)) / 2.0
print(f"Original Cuirass dimensions: W={w_orig:.3f}, H={h_orig:.3f}, D={d_orig:.3f}")
print(f"Original Cuirass center: ({cx:.3f}, {cy:.3f}, {cz:.3f})")

# Target dimensions for Nexo's chest:
# In Nexo, the chest width is ~0.38 - 0.42 m, height is ~0.36 - 0.40 m.
# Center of reactor: X ≈ 0.000, Y ≈ -0.176, Z ≈ 0.416
TARGET_H = 0.38
scale = TARGET_H / h_orig

# Normalize around center
for v in cuirass_mesh.data.vertices:
    v.co.x = (v.co.x - cx) * scale
    v.co.y = (v.co.y - cy) * scale
    v.co.z = (v.co.z - cz) * scale

# Pitch rotation (forward tilt) to match torso posture (~10 degrees)
# Nexo faces -Y, up is +Z. Let's check rotation orientation!
# Original cuirass faces -Y as well!
m_rot = mathutils.Euler((math.radians(8.0), 0, 0)).to_matrix().to_4x4()
# Position directly over the reactor, slightly in front (Y ~ -0.190)
m_trans = mathutils.Matrix.Translation(mathutils.Vector((0.000, -0.188, 0.385)))
cuirass_mesh.data.transform(m_trans @ m_rot)
cuirass_mesh.matrix_world = mathutils.Matrix.Identity(4)

# 4. Rig to mixamorig:Spine1_03
inv_arm_mat = arm.matrix_world.inverted()
cuirass_mesh.data.transform(inv_arm_mat)
cuirass_mesh.parent = arm
cuirass_mesh.matrix_local = mathutils.Matrix.Identity(4)

mod = cuirass_mesh.modifiers.new(name='Armature', type='ARMATURE')
mod.object = arm
vg = cuirass_mesh.vertex_groups.new(name='mixamorig:Spine1_03')
all_indices = [v.index for v in cuirass_mesh.data.vertices]
vg.add(all_indices, 1.0, 'REPLACE')

# 5. Set up camera and lights for front render
scene = bpy.context.scene
scene.render.resolution_x = 1024
scene.render.resolution_y = 1024

if not scene.world:
    scene.world = bpy.data.worlds.new("World")
scene.world.color = (0.02, 0.025, 0.035)

# Lights
key_light = bpy.data.lights.new(name="KeyLight", type='AREA')
key_light.energy = 100
key_light.size = 1.4
key_light.color = (1.0, 0.96, 0.92)
key_obj = bpy.data.objects.new("KeyLight", key_light)
key_obj.location = (0.9, -2.0, 1.2)
scene.collection.objects.link(key_obj)

fill_light = bpy.data.lights.new(name="FillLight", type='AREA')
fill_light.energy = 60
fill_light.size = 2.2
fill_light.color = (0.35, 0.65, 1.0)
fill_obj = bpy.data.objects.new("FillLight", fill_light)
fill_obj.location = (-1.2, -1.8, 0.4)
scene.collection.objects.link(fill_obj)

rim_light = bpy.data.lights.new(name="RimLight", type='AREA')
rim_light.energy = 90
rim_light.size = 1.5
rim_light.color = (0.8, 0.9, 1.0)
rim_obj = bpy.data.objects.new("RimLight", rim_light)
rim_obj.location = (0.0, 2.0, 1.5)
scene.collection.objects.link(rim_obj)

cam_data = bpy.data.cameras.new("Cam")
cam_data.lens = 55
cam_obj = bpy.data.objects.new("Cam", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

# Torso close up
cam_obj.location = (0.0, -1.5, 0.38)
cam_obj.rotation_euler = (math.radians(90.0), 0, 0)

os.makedirs('temp_render', exist_ok=True)
out_path = os.path.abspath('temp_render/nexo_cuirass_test_front.png')
scene.render.filepath = out_path
bpy.ops.render.render(write_still=True)
print("Rendered to:", out_path)
