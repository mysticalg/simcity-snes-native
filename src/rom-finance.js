// CODE_038E5F..038E9D: census units times mean land value /120,
// times averaged tax, then difficulty Q8 factor DATA_038FEE.
export function romAnnualRevenue(censusUnits,meanLandValue,averageTax,difficulty){
 const value=Math.floor(((censusUnits&65535)*(meanLandValue&65535))/120);
 const taxed=(value*(averageTax&65535))>>>0;
 return Math.floor(taxed*[0x166,0x133,0xcd][difficulty]/256)>>>0;
}
