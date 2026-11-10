"""Bake the engine's seeded pressure-cloth solver into native object part modules.

Run with Blender, not a website geometry library. The checked-in baked result is
an input to both Blockforge mesh tiers. Regeneration records the helper digest.
"""
import bpy, bmesh, sys, os, json, hashlib, math
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
ENGINE = Path(os.environ.get('BLOCKFORGE_ROOT', 'D:/dev/block game'))
sys.path.insert(0, str(ENGINE / 'tools/render-cycles'))
from dress import _cloth_pillow

specs = [
    dict(id='chair-seat', size=[.62,.59,.115], seed=701, center=[0,-.025,.4925], group='seat', material='velvet'),
    dict(id='sofa-seat', size=[.81,.77,.16], seed=702, center=[0,0,0], group='cushions', material='leather'),
    dict(id='sofa-back', size=[.79,.58,.13], seed=703, center=[0,0,0], group='cushions', material='leather'),
    dict(id='throw', size=[.44,.44,.075], seed=704, center=[0,0,0], group='pillows', material='linen'),
]
out = ROOT / 'bakes'
out.mkdir(parents=True, exist_ok=True)
helper = ENGINE / 'tools/render-cycles/dress.py'
report = dict(format='feed7-cloth-bakes/1', solver='Blockforge dress._cloth_pillow',
              helperSha256=hashlib.sha256(helper.read_bytes()).hexdigest(),
              blender=bpy.app.version_string, items=[])
for spec in specs:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    # Enough simulation to resolve corner gathers; subdivision is baked as well.
    ob = _cloth_pillow(spec['id'], spec['size'], spec['seed'], frames=36, cuts=30, pressure=4.5)
    fitted_cover=spec['id']!='throw'
    if fitted_cover:
        # Tailored upholstery is restrained by foam, unlike a loose throw pillow.
        # Fit the original sewn cover topology around a rounded foam envelope,
        # retaining only millimetre-scale displacement from the pressure bake.
        original=bmesh.new()
        bmesh.ops.create_cube(original,size=1.0)
        bmesh.ops.scale(original,vec=Vector(spec['size']),verts=original.verts)
        bmesh.ops.subdivide_edges(original,edges=original.edges[:],cuts=30,use_grid_fill=True)
        original.verts.ensure_lookup_table()
        half=[v/2 for v in spec['size']]
        radius=.035 if spec['id']=='chair-seat' else .055 if spec['id']=='sofa-seat' else .045
        for v,reference in zip(ob.data.vertices,original.verts):
            q=reference.co.copy()
            inner=Vector([max(-half[k]+radius,min(half[k]-radius,q[k])) for k in range(3)])
            direction=q-inner
            fitted=inner+direction.normalized()*radius
            # Soft crown under the sitter, with the seam edge held to the foam.
            crown=max(0,1-(q.x/half[0])**2)*max(0,1-(q.y/half[1])**2)
            lift=(.011 if spec['id']=='chair-seat' else .024)*crown
            if spec['id'] in ('chair-seat','sofa-seat') and q.z<0:
                lift=0.0
            fitted.z+=math.copysign(lift,q.z)
            if spec['id']=='sofa-seat' and q.z>0:
                fitted.z-=.006*math.exp(-((q.x+.018)/.20)**2-((q.y+.045)/.22)**2)
            displacement=v.co-reference.co
            fitted+=Vector([max(-.0015,min(.0015,c*.06)) for c in displacement])
            v.co=fitted+Vector(spec['center'])
        original.free()
        ob.data.update()
    dg = bpy.context.evaluated_depsgraph_get()
    mesh = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
    mesh.calc_loop_triangles()
    if not fitted_cover:
        lo = [min(v.co[k] for v in mesh.vertices) for k in range(3)]
        hi = [max(v.co[k] for v in mesh.vertices) for k in range(3)]
        for v in mesh.vertices:
            for k in range(3):
                v.co[k] = ((v.co[k] - (lo[k]+hi[k])/2)/(hi[k]-lo[k]))*spec['size'][k] + spec['center'][k]
        mesh.update()
    pos = [round(float(c),7) for v in mesh.vertices for c in v.co]
    norm = [round(float(c),7) for v in mesh.vertices for c in v.normal]
    ix = [i for t in mesh.loop_triangles for i in t.vertices]
    part = dict(id=spec['id'], attach='root', group=spec['group'], material=spec['material'],
                shape=dict(mesh=dict(positions=pos,normals=norm,indices=ix)))
    module = dict(format='blockforge-object-part/1', id=spec['id'], block=part)
    file = out / (spec['id']+'.part.json')
    file.write_text(json.dumps(module,separators=(',',':')))
    report['items'].append(dict(**spec, frames=36,cuts=30,pressure=4.5,foamRestrained=fitted_cover,fitVersion='foam-restrained/1',triangles=len(ix)//3,
                               sha256=hashlib.sha256(file.read_bytes()).hexdigest()))
    print('[feed7-cloth]', spec['id'], len(ix)//3, 'triangles', flush=True)
(out / 'manifest.json').write_text(json.dumps(report,indent=2))
