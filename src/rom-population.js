// CODE_038196:16-bit C+I, three ASLs, then ADC residential without CLC.
// The final shift's carry (jobs bit13) participates in that addition.
export function romPopulation(rci,baseline=0){
 const jobs=((rci[1]&65535)+(rci[2]&65535))&65535;
 const units=(jobs*8+(rci[0]&65535)+(jobs&0x2000?1:0))&65535;
 const population=units*20,netMigration=(population-(baseline>>>0))|0;
 const category=[2000,10000,50000,100000,500000].filter(value=>population>=value).length;
 return {units,population,netMigration,category};
}
