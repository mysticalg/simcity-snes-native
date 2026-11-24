// Native Turbo extraction/production buildings. Capacities are units or batches per month.
export const INDUSTRY_TOOLS=[
 {tool:108,id:998,name:'Oil extraction site',shortName:'Oil well',icon:'🛢',cost:4000,annual:400,kind:'extraction',resource:'oil',capacity:240,size:3,sprite:2},
 {tool:109,id:999,name:'Metal ore mine',shortName:'Metal mine',icon:'⛏',cost:3500,annual:350,kind:'extraction',resource:'metals',capacity:300,size:3,sprite:2},
 {tool:110,id:1000,name:'Gold mine',shortName:'Gold mine',icon:'⚒',cost:6000,annual:600,kind:'extraction',resource:'gold',capacity:40,size:2,sprite:2},
 {tool:111,id:1001,name:'Diamond mine',shortName:'Diamond mine',icon:'💎',cost:8000,annual:800,kind:'extraction',resource:'diamonds',capacity:20,size:2,sprite:2},
 {tool:112,id:1002,name:'Uranium mine',shortName:'Uranium mine',icon:'☢',cost:7000,annual:700,kind:'extraction',resource:'uranium',capacity:60,size:3,sprite:2},
 {tool:113,id:1003,name:'Manufacturing factory',shortName:'Factory',icon:'🏭',cost:5000,annual:500,kind:'factory',capacity:40,size:4,sprite:16,waterNeed:1000}
];
export const industrySpec=id=>INDUSTRY_TOOLS.find(b=>b.id===id);
export const industryTool=tool=>INDUSTRY_TOOLS.find(b=>b.tool===tool);
