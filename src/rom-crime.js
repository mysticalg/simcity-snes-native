// CODE_039EB0..039F2B. Density is $7F8E28, signed city modifier
// $0C71 and police coverage $7FB2F4; zero-value cells are excluded.
export function romCrimeValue(landValue,density,cityModifier,policeCoverage){
 if(landValue===0)return 0;
 const base=Math.max(0,128-landValue)+density+cityModifier;
 return Math.max(0,Math.min(250,Math.max(0,Math.min(300,base))-policeCoverage));
}
export function meanRomCrime(values,landValues,width=120,height=100){
 let sum=0,count=0;for(let y=0;y<height;y+=2)for(let x=0;x<width;x+=2){const i=y*width+x;if(landValues[i]){sum+=values[i];count++;}}
 return count?Math.floor(sum/count):0;
}
