import {TREASURY_CAP} from './treasury.js?v=parks-23';
// Player-requested financial safety stop; separate from ROM simulation rules.
export function financialStatus(city){
 const pending=city.pendingBudget;let b;
 try{city.pendingBudget=null;b=city.budget(false);}finally{city.pendingBudget=pending;}
 const annual=b.income-b.desired.reduce((sum,n)=>sum+n,0)-b.payment-b.civicExpense;
 return {annual,canResume:city.infiniteMoney||city.funds>0||annual>=0,loanAvailable:!city.infiniteMoney&&city.loans.length<3&&city.funds+1000<=TREASURY_CAP};
}
export function installFinancialSafety(City){
 if(City.prototype.checkFinancialEmergency)return;
 City.prototype.checkFinancialEmergency=function(){if(this.infiniteMoney){this.financialEmergency=false;return false;}if(this.funds>0)this.financialClearedAtZero=false;if(this.funds<=0&&(!this.financialClearedAtZero||financialStatus(this).annual<0))this.financialEmergency=true;return !!this.financialEmergency;};
 City.prototype.resolveFinancialEmergency=function(){if(!financialStatus(this).canResume)return false;this.financialEmergency=false;this.financialClearedAtZero=this.funds<=0;this.financialAlertShown=false;return true;};
 for(const name of ['advance','stepSimulation']){const original=City.prototype[name];City.prototype[name]=function(...args){if(this.checkFinancialEmergency())return false;return original.apply(this,args);};}
 // Recovery demolition remains possible without taking the treasury below zero.
 const canBuild=City.prototype.canBuild;City.prototype.canBuild=function(tool,...args){const result=canBuild.call(this,tool,...args);if(tool===0&&this.funds<=0&&!this.infiniteMoney)result.cost=0;return result;};
 const restore=City.restore;City.restore=function(text,...args){const city=restore.call(this,text,...args);city.financialClearedAtZero=!!JSON.parse(text).financialClearedAtZero;city.financialEmergency=!city.infiniteMoney&&(!!JSON.parse(text).financialEmergency||(city.funds<=0&&!city.financialClearedAtZero));return city;};
}
