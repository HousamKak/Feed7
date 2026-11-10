"""Native architectural bake: actual Boolean-cut circuit trenches, not raised pipes."""
import bpy, json, math, hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
source=ROOT/'world/circuits.json'
spec=json.loads(source.read_text())
bpy.ops.wm.read_factory_settings(use_empty=True)
def chamfer(points,distance):
    out=[points[0]]
    for i in range(1,len(points)-1):
        p,a,b=points[i],points[i-1],points[i+1]
        al=math.dist(p,a);bl=math.dist(p,b);d=min(distance,al*.3,bl*.3)
        out.extend([[p[k]-(p[k]-a[k])/al*d for k in range(2)],[p[k]+(b[k]-p[k])/bl*d for k in range(2)]])
    return out+[points[-1]]
def box(name,center,size,angle=0):
    bpy.ops.mesh.primitive_cube_add(size=1,location=center)
    ob=bpy.context.object;ob.name=name;ob.dimensions=size;ob.rotation_euler.z=angle
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return ob
f=spec['floor'];c=spec['channel']
floor=box('engraved-basalt-floor',(0,f['centerY'],-f['thickness']/2),(f['width'],f['length'],f['thickness']))
cutters=[];z=-c['depth']/2+.005;h=c['depth']+.010
for ri,points in enumerate(spec['routes']):
    route=chamfer(points,c['cornerChamfer'])
    for i in range(1,len(route)):
        a,b=route[i-1],route[i];length=math.dist(a,b)
        cutters.append(box(f'channel-{ri}-{i}',((a[0]+b[0])/2,(a[1]+b[1])/2,z),(length+.008,c['width'],h),math.atan2(b[1]-a[1],b[0]-a[0])))
    for i,p in enumerate(route):
        bpy.ops.mesh.primitive_cylinder_add(vertices=16,radius=c['width']/2,depth=h,location=(p[0],p[1],z))
        cutters.append(bpy.context.object)
bpy.ops.object.select_all(action='DESELECT')
for ob in cutters:ob.select_set(True)
bpy.context.view_layer.objects.active=cutters[0];bpy.ops.object.join();tool=bpy.context.object
bpy.ops.object.select_all(action='DESELECT');floor.select_set(True);bpy.context.view_layer.objects.active=floor
mod=floor.modifiers.new('machined-circuit-channels','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.use_self=True;mod.object=tool
bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(tool,do_unlink=True)
bevel=floor.modifiers.new('eased-channel-lips','BEVEL');bevel.width=c['lipBevel'];bevel.segments=3;bevel.limit_method='ANGLE';bevel.angle_limit=.35
bpy.ops.object.modifier_apply(modifier=bevel.name)
me=floor.data;me.calc_loop_triangles();positions=[];normals=[];uvs=[];indices=[]
for tri in me.loop_triangles:
    for vi in tri.vertices:
        p=floor.matrix_world@me.vertices[vi].co
        positions.extend(round(float(v),7) for v in p);normals.extend(round(float(v),7) for v in tri.normal);uvs.extend([round(p.x,7),round(p.y,7)]);indices.append(len(indices))
out=ROOT/'bakes';out.mkdir(exist_ok=True)
mesh=dict(positions=positions,normals=normals,uvs=uvs,indices=indices)
(out/'engraved-floor.mesh.json').write_text(json.dumps(mesh,separators=(',',':')))
(out/'engraved-floor.manifest.json').write_text(json.dumps(dict(format='feed7-floor-bake/1',method='Blender exact Boolean difference and modeled bevels',blender=bpy.app.version_string,inputs=spec,sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),generatorSha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),triangles=len(indices)//3),indent=2))
print('[feed7-floor]',len(indices)//3,'triangles, actual recessed channels',flush=True)
