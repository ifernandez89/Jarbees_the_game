import bpy
import math
import mathutils
import os

bpy.ops.wm.read_factory_settings(use_empty=True)

SUIT_PATH = r'C:\Projects\Jarbees_the_game\assets_source\models\jarbees_suit.glb'
bpy.ops.import_scene.gltf(filepath=SUIT_PATH)

arm = [o for o in bpy.context.scene.objects if o.type == 'ARMATURE'][0]

# Remove old plexus shield and hook
for name in ['JarBees_Armor_PlexusShield', 'JarBees_Armor_PlexusHook']:
    obj = bpy.data.objects.get(name)
    if obj:
        bpy.data.objects.remove(obj, do_unlink=True)

# Import armor.glb
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
d_orig = max(ys) - min(ys)
cx = (min(xs) + max(xs)) / 2.0
cy = (min(ys) + max(ys)) / 2.0
cz = (min(zs) + max(zs)) / 2.0

# Scale: Let's increase TARGET_H to 0.445, and give slight extra vertical reach
scale_xy = 0.41 / w_orig
scale_z = 0.45 / h_orig

for v in cuirass_mesh.data.vertices:
    v.co.x = (v.co.x - cx) * scale_xy
    v.co.y = (v.co.y - cy) * scale_xy
    v.co.z = (v.co.z - cz) * scale_z

# Pitch and translation
# Move Z center up to 0.415 so top reaches ~0.52 (just under chin at 0.526)
m_rot = mathutils.Euler((math.radians(9.0), 0, 0)).to_matrix().to_4x4()
m_trans = mathutils.Matrix.Translation(mathutils.Vector((0.000, -0.190, 0.415)))
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

# Check final world bounds of the cuirass
world_zs = [(arm.matrix_world @ v.co).z for v in cuirass_mesh.data.vertices]
print(f"New Cuirass World Z bounds: [{min(world_zs):.3f}, {max(world_zs):.3f}]")
