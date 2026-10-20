import bpy

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=r'G:\new models\armor.glb')
mat = bpy.data.materials.get('material')
print('=== NODES IN MATERIAL ===')
for n in mat.node_tree.nodes:
    print(f"Node: {n.name} ({n.type})")
print('\n=== LINKS IN MATERIAL ===')
for l in mat.node_tree.links:
    print(f"{l.from_node.name} [{l.from_socket.name}] -> {l.to_node.name} [{l.to_socket.name}]")

bsdf = mat.node_tree.nodes.get('Principled BSDF')
if bsdf:
    print('\n=== PRINCIPLED BSDF INPUTS ===')
    for inp in bsdf.inputs:
        if inp.is_linked:
            print(f"  {inp.name} <- {inp.links[0].from_node.name} [{inp.links[0].from_socket.name}]")
        elif inp.default_value is not None:
            print(f"  {inp.name} = {inp.default_value}")
