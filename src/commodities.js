// Fictional Turbo economy, expressed in abstract game units.
export const COMMODITIES=[
 {id:'oil',name:'Oil',price:20,target:1500,color:'#5d4338'},
 {id:'drugs',name:'Drugs / pharmaceuticals',price:80,target:500,color:'#dc91dc'},
 {id:'plastics',name:'Plastics',price:40,target:1000,color:'#e8d5b5'},
 {id:'metals',name:'Metals',price:30,target:1500,color:'#9dabb4'},
 {id:'fertilizers',name:'Fertilizers',price:35,target:800,color:'#ba9164'},
 {id:'components',name:'Components',price:70,target:700,color:'#7399d3'},
 {id:'gold',name:'Gold',price:250,target:200,color:'#ffd14f'},
 {id:'diamonds',name:'Diamonds',price:500,target:100,color:'#99efff'},
 {id:'uranium',name:'Uranium',price:200,target:250,color:'#a8e859'},
 {id:'contraband',name:'Contraband',price:120,target:300,color:'#b7798c',restricted:true},
 {id:'weapons',name:'Weapons',price:150,target:300,color:'#bd876a',restricted:true}
];
export const GOODS=Object.fromEntries(COMMODITIES.map(g=>[g.id,g]));
// Deliberately abstract recipes: these are inventory rules, not real processes.
export const FACTORY_RECIPES={
 plastics:{name:'Plastics',inputs:{oil:5},output:'plastics',units:4},
 drugs:{name:'Pharmaceuticals',inputs:{oil:2,plastics:1},output:'drugs',units:2},
 fertilizers:{name:'Fertilizers',inputs:{oil:2,metals:1},output:'fertilizers',units:4},
 components:{name:'Components',inputs:{metals:3,plastics:2},output:'components',units:3},
 contraband:{name:'Contraband',inputs:{components:2},output:'contraband',units:1},
 weapons:{name:'Weapons',inputs:{metals:4,components:2},output:'weapons',units:3}
};
export const emptyInventory=()=>Object.fromEntries(COMMODITIES.map(g=>[g.id,0]));
export const inventoryTotal=inventory=>COMMODITIES.reduce((n,g)=>n+Math.max(0,Math.trunc(Number(inventory?.[g.id])||0)),0);
export function hashEconomySeed(value){let seed=2166136261;for(const c of String(value))seed=Math.imul(seed^c.charCodeAt(0),16777619);return seed>>>0;}
