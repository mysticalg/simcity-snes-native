// Player extension: roads and rails also conduct electricity. Original ROM flags remain intact.
const cache=new WeakMap();export function conductivePowerFlags(flags){let result=cache.get(flags);if(!result){result=flags.map(f=>(f&96)?f|128:f);cache.set(flags,result);}return result;}
