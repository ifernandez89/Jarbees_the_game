import bpy

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=r'C:\Projects\Jarbees_the_game\assets_source\models\jarbees_suit.glb')

helmet = bpy.data.objects.get('JarBees_Gladiator_Helmet')
if helmet:
    # World coords of helmet
    mw = helmet.matrix_world
    zs = [(mw @ v.co).z for v in helmet.data.vertices]
    ys = [(mw @ v.co).y for v in helmet.data.vertices]
    xs = [(mw @ v.co).x for v in helmet.data.vertices]
    print(f"Helmet world bounds: X [{min(xs):.3f}, {max(xs):.3f}], Y [{min(ys):.3f}, {max(ys):.3f}], Z [{min(zs):.3f}, {max(zs):.3f}]")
    print(f"Helmet chin bottom Z ≈ {min(zs):.3f}")

# Look for chest / clavicle mesh
for o in bpy.context.scene.objects:
    if o.type == 'MESH':
        mw = o.matrix_world
        world_zs = [(mw @ v.co).z for v in o.data.vertices]
        if min(world_zs) < 0.35 and max(world_zs) > 0.55:
            world_ys = [(mw @ v.co).y for v in o.data.vertices]
            world_xs = [(mw @ v.co).x for v in o.data.vertices]
            print(f"Torso mesh {o.name} (mat: {[s.material.name if s.material else '' for s in o.material_slots]}):")
            print(f"  Z: [{min(world_zs):.3f}, {max(world_zs):.3f}], Y: [{min(world_ys):.3f}, {max(world_ys):.3f}], X: [{min(world_xs):.3f}, {max(world_xs):.3f}]")
