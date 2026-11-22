// CODE_038E5F..038E9D: census units times mean land value /120,
// times averaged tax, then difficulty Q8 factor DATA_038FEE.
export function romAnnualRevenue(censusUnits,meanLandValue,averageTax,difficulty){
 const value=Math.floor(((censusUnits&65535)*(meanLandValue&65535))/120);
 const taxed=(value*(averageTax&65535))>>>0;
 return Math.floor(taxed*[0x166,0x133,0xcd][difficulty]/256)>>>0;
}
// CODE_02A91A rounds requested*percentage/100. CODE_02A9C1 removes
// a deficit from displayed fire, then police, then transport allocations.
export function allocateRomBudget(requests,percentages,available,loanPayment=0){
 const desired=requests.map((n,i)=>Math.round(n*Math.max(0,Math.min(100,percentages[i]))/100));
 const expenses=[...desired];let shortage=Math.max(0,desired.reduce((a,b)=>a+b,0)+loanPayment-available);
 for(const i of [2,1,0]){const reduction=Math.min(shortage,expenses[i]);expenses[i]-=reduction;shortage-=reduction;}
 return {desired,expenses,shortfall:shortage};
}
