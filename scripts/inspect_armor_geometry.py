import bpy
import bmesh

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=r'G:\new models\armor.glb')
obj = bpy.data.objects['defaultMaterial']
mesh = obj.data

print(f"Mesh name: {mesh.name}, Verts: {len(mesh.vertices)}, Polys: {len(mesh.polygons)}")
xs = [v.co.x for v in mesh.vertices]
ys = [v.co.y for v in mesh.vertices]
zs = [v.co.z for v in mesh.vertices]
print(f"X range: [{min(xs):.3f}, {max(xs):.3f}]")
print(f"Y range: [{min(ys):.3f}, {max(ys):.3f}]")
print(f"Z range: [{min(zs):.3f}, {max(zs):.3f}]")

# Check normals and face directions
front_faces = [f for f in mesh.polygons if f.normal.y < -0.1]
back_faces = [f for f in mesh.polygons if f.normal.y > 0.1]
print(f"Front-facing faces (Y < -0.1): {len(front_faces)}")
print(f"Back-facing faces (Y > 0.1): {len(back_faces)}")

# Check if there are separate connected components (islands)
bm = bmesh.new()
bm.from_mesh(mesh)
islands = []
unvisited = set(bm.verts)
while unvisited:
    v0 = unvisited.pop()
    island = [v0]
    queue = [v0]
    while queue:
        curr = queue.pop(0)
        for edge in curr.link_edges:
            other = edge.other_vert(curr)
            if other in unvisited:
                unvisited.remove(other)
                island.append(other)
                queue.append(other)
    islands.append(island)

print(f"Mesh has {len(islands)} connected component(s). Island vertex counts: {[len(isl) for isl in islands]}")
bm.free()
