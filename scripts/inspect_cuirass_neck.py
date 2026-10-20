import bpy

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=r'G:\new models\armor.glb')
mesh = bpy.data.objects['defaultMaterial'].data

# Find vertices near top (Z > 140 in original coordinates)
top_verts = [v for v in mesh.vertices if v.co.z > 140]
print(f"Top vertices count: {len(top_verts)}")
for v in sorted(top_verts, key=lambda v: v.co.x):
    print(f"  X: {v.co.x:6.2f}, Y: {v.co.y:6.2f}, Z: {v.co.z:6.2f}")
