let Finance = require('financejs');

let finance = new Finance();
window.tri = function tri(cashflowIn,cashflow){

    return finance.IRR(cashflowIn,...cashflow)
};
window.van2 =function van2(taux_credit,cashflow){
    return finance.NPV(taux_credit/100,0,...cashflow);
};
window.van =function van(taux_act,capex,subv,cashflow){
    return finance.NPV((taux_act/100)*(capex*(1-(subv/100))),...cashflow);
};
window.vancfads = function vancfads(taux_int,cfads){
    return finance.NPV(taux_int/100,0,...cfads)
};
/**
 * @return {number}
 */
window.wacc = function wacc(capex,subv,credit,taux_act,taux_credit) {
    return finance.WACC((capex*(1-(subv/100)))-credit,credit,taux_act/100,taux_credit / 100,0)
};
window.round = function round(value, decimals) {
        return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
    };
window.tempretour = function temprtr(temp_proj,cashflow) {
   return  finance.PP(temp_proj,...cashflow);
};
window.triproj= function triproj(capex,subv,cfads) {
    return finance.IRR(-1*(capex*(1-(subv/100))),...cfads);
};
