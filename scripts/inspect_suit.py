import bpy
import os

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=r'C:\Projects\Jarbees_the_game\assets_source\models\jarbees_suit.glb')

print('--- OBJECTS IN JARBEES SUIT ---')
for o in bpy.context.scene.objects:
    print(f"{o.name} ({o.type}) - Modifiers: {[m.name for m in o.modifiers]} - Parent: {o.parent.name if o.parent else 'None'}")
    if o.type == 'MESH':
        print(f"  Materials: {[s.material.name if s.material else 'None' for s in o.material_slots]}")
        print(f"  Vertex groups: {[vg.name for vg in o.vertex_groups][:5]}")
