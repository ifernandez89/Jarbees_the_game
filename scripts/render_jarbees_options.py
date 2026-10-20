import bpy
import math
import mathutils
import os

bpy.ops.wm.read_factory_settings(use_empty=True)

# 1. Import Suit
SUIT_PATH = r'C:\Projects\Jarbees_the_game\assets_source\models\jarbees_suit.glb'
bpy.ops.import_scene.gltf(filepath=SUIT_PATH)
arm = [o for o in bpy.context.scene.objects if o.type == 'ARMATURE'][0]

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

mw = cuirass_mesh.matrix_world.copy()
cuirass_mesh.parent = None
cuirass_mesh.matrix_world = mw

for o in new_objs:
    if o.type == 'EMPTY':
        bpy.data.objects.remove(o, do_unlink=True)

cuirass_mesh.name = "JarBees_Cuirass_Pechera"

# Measure bounds
xs = [v.co.x for v in cuirass_mesh.data.vertices]
ys = [v.co.y for v in cuirass_mesh.data.vertices]
zs = [v.co.z for v in cuirass_mesh.data.vertices]
w_orig = max(xs) - min(xs)
h_orig = max(zs) - min(zs)
cx = (min(xs) + max(xs)) / 2.0
cy = (min(ys) + max(ys)) / 2.0
cz = (min(zs) + max(zs)) / 2.0

# EXTENDED HEIGHT AND WIDTH:
# Scale width to 0.435, height to 0.455 (covers all the way up to collar/chin)
scale_x = 0.435 / w_orig
scale_y = 0.435 / w_orig
scale_z = 0.455 / h_orig

for v in cuirass_mesh.data.vertices:
    v.co.x = (v.co.x - cx) * scale_x
    v.co.y = (v.co.y - cy) * scale_y
    v.co.z = (v.co.z - cz) * scale_z

# Pitch forward 9.5 degrees and translate Z center up to 0.418, Y to -0.191
m_rot = mathutils.Euler((math.radians(9.5), 0, 0)).to_matrix().to_4x4()
m_trans = mathutils.Matrix.Translation(mathutils.Vector((0.000, -0.191, 0.418)))
cuirass_mesh.data.transform(m_trans @ m_rot)
cuirass_mesh.matrix_world = mathutils.Matrix.Identity(4)

# Rigging to spine
inv_arm_mat = arm.matrix_world.inverted()
cuirass_mesh.data.transform(inv_arm_mat)
cuirass_mesh.parent = arm
cuirass_mesh.matrix_local = mathutils.Matrix.Identity(4)

mod = cuirass_mesh.modifiers.new(name='Armature', type='ARMATURE')
mod.object = arm
vg = cuirass_mesh.vertex_groups.new(name='mixamorig:Spine1_03')
vg.add([v.index for v in cuirass_mesh.data.vertices], 1.0, 'REPLACE')

# Texture paths
path_opt1 = os.path.abspath('assets_source/models/jarbees_armor/cuirass_basecolor_opt1.png')
path_opt2 = os.path.abspath('assets_source/models/jarbees_armor/cuirass_basecolor_opt2.png')
path_mr = os.path.abspath('assets_source/models/jarbees_armor/cuirass_mr.png')
path_norm = os.path.abspath('assets_source/models/jarbees_armor/cuirass_normal.png')

# Material setup
mat = cuirass_mesh.data.materials[0]
mat.use_nodes = True
nodes = mat.node_tree.nodes

img_base_node = nodes.get('Image Texture')
img_mr_node = nodes.get('Image Texture.001')
img_norm_node = nodes.get('Image Texture.002')

img_base_opt1 = bpy.data.images.load(path_opt1)
img_mr = bpy.data.images.load(path_mr)
img_norm = bpy.data.images.load(path_norm)

if img_base_node:
    img_base_node.image = img_base_opt1
if img_mr_node:
    img_mr_node.image = img_mr
if img_norm_node:
    img_norm_node.image = img_norm

# Lighting & Camera
scene = bpy.context.scene
scene.render.resolution_x = 1024
scene.render.resolution_y = 1024

if not scene.world:
    scene.world = bpy.data.worlds.new("World")
scene.world.color = (0.02, 0.025, 0.035)

key_light = bpy.data.lights.new(name="KeyLight", type='AREA')
key_light.energy = 110
key_light.size = 1.4
key_light.color = (1.0, 0.97, 0.94)
key_obj = bpy.data.objects.new("KeyLight", key_light)
key_obj.location = (0.8, -1.8, 1.1)
scene.collection.objects.link(key_obj)

fill_light = bpy.data.lights.new(name="FillLight", type='AREA')
fill_light.energy = 65
fill_light.size = 2.2
fill_light.color = (0.35, 0.65, 1.0)
fill_obj = bpy.data.objects.new("FillLight", fill_light)
fill_obj.location = (-1.1, -1.7, 0.4)
scene.collection.objects.link(fill_obj)

rim_light = bpy.data.lights.new(name="RimLight", type='AREA')
rim_light.energy = 95
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

# Camera framing: Torso + Chin + Shoulders
cam_obj.location = (0.0, -1.5, 0.45)
cam_obj.rotation_euler = (math.radians(90.0), 0, 0)

os.makedirs('temp_render', exist_ok=True)
out_render_opt1 = os.path.abspath('temp_render/cuirass_jarbees_opt1_front.png')
scene.render.filepath = out_render_opt1
bpy.ops.render.render(write_still=True)
print("Rendered Option 1 to:", out_render_opt1)

# Render Option 2 (Violet Spirals)
img_base_opt2 = bpy.data.images.load(path_opt2)
if img_base_node:
    img_base_node.image = img_base_opt2
out_render_opt2 = os.path.abspath('temp_render/cuirass_jarbees_opt2_front.png')
scene.render.filepath = out_render_opt2
bpy.ops.render.render(write_still=True)
print("Rendered Option 2 to:", out_render_opt2)

# Also render an angle view (3/4 perspective) for Option 1
if img_base_node:
    img_base_node.image = img_base_opt1
cam_obj.location = (0.9, -1.5, 0.52)
dir_vec = (mathutils.Vector((0.0, -0.05, 0.43)) - cam_obj.location).normalized()
cam_obj.rotation_euler = dir_vec.to_track_quat('-Z', 'Y').to_euler()
out_render_angle = os.path.abspath('temp_render/cuirass_jarbees_opt1_angle.png')
scene.render.filepath = out_render_angle
bpy.ops.render.render(write_still=True)
print("Rendered Option 1 Angle to:", out_render_angle)
