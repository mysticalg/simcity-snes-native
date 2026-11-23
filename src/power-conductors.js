// Player extension: roads and rails also conduct electricity. Original ROM flags remain intact.
const cache=new WeakMap();export function conductivePowerFlags(flags){let result=cache.get(flags);if(!result){result=flags.map(f=>(f&96)?f|128:f);cache.set(flags,result);}return result;}
// Turbo graphs include conducting transport and larger maps. Each cell can
// have one initial seed and one deferred junction entry; no fixed SNES RAM
// allocation should silently discard those branches in the browser game.
export function turboPowerBranchLimit(cellCount){return Math.max(5000,cellCount*2);}
