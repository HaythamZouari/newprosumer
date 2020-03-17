

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
