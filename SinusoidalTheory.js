﻿import { CompositeCost, ConstantCost, Cost, CustomCost, ExponentialCost, FirstFreeCost, FreeCost, LinearCost, StepwiseCost } from "./api/Costs";
import { Localization } from "./api/Localization";
import { BigNumber, parseBigNumber } from "./api/BigNumber";
import { theory } from "./api/Theory";
import { Utils } from "./api/Utils";
import { game, Game } from "./api/Game";

var id = "Sinusoid Theory";
var name = "Sinusoid Theory";
var description = "A theory where you have to pay attention to sinusoidal changes in your function. Buying any upgrades reverts time to its last multiple of π, allowing the function value to stay centered approximately at 0.";
var authors = "71~073~#7380";
var version = 4;

var lastTickWasAFK = false;
var currency;
var f, t, c, c1, c2, q, q1, p, dt, unbreak;
var pMilestone, qPowMilestone, qMilestone;
var achievement1, achievement2;
var savet;
var maxt, currMax, ups, buys, taupau = 0.2;
var init = () => {
    currency = theory.createCurrency();
    savet = [BigNumber.ZERO,BigNumber.ZERO];
    t = BigNumber.ZERO;
    c = BigNumber.ONE;
    maxt = BigNumber.ZERO;
    currMax = 1;
    q = BigNumber.ONE;
    buys = 0;
    max = (a,b) => {
        if (a > b){return a} else {return b}
    };
    min = (a,b) => {
        if (a < b){return a} else {return b}
    };
    setMaxt = (resetT) => {
        if (resetT){
            let h = t - (t % (2 * Math.PI));
            if(h > maxt){
                maxt = h;
            }
        }else{
            if(t > maxt){
                maxt = t;
            }
        }
    }
    resetToPIMult = () => {
        t = max(t - (t % (2 * Math.PI)), maxt);
        setMaxt();
    };
    ups = [
        new FreeCost(),
        new ExponentialCost(1e25, Math.sqrt(5)),
        new ExponentialCost(1e35, 20), 
        new ExponentialCost(1, 2), 
        new FirstFreeCost(new ExponentialCost(50, Math.log10(5))), 
        new ExponentialCost(1000, Math.sqrt(3.75))
    ]

    theory.primaryEquationHeight = 50;
    theory.secondaryEquationHeight = 40;
    ///////////////////
    // Regular Upgrades
    
    //f, free upgrade
    {
        let getDesc = (level) => "f={" + getF(level) + "}";
        let getInfo = (level) => "f=" + getF(level);
        f = theory.createUpgrade(0, currency, ups[0]);
        f.getDescription = (_) => Utils.getMath(getDesc(f.level));
        f.getInfo = (amount) => Utils.getMathTo(getInfo(f.level), getInfo(f.level + amount));
    }
    //q will eventually be a milestone
    //q1
    {
        let getDesc = (level) => "q_1={" + getQ1(level).toString(0) + "}";
        let getInfo = (level) => "q_1=" + getQ1(level).toString(0);
        q1 = theory.createUpgrade(1, currency, ups[1]);
        q1.getDescription = (_) => Utils.getMath(getDesc(q1.level));
        q1.getInfo = (amount) => Utils.getMathTo(getInfo(q1.level), getInfo(q1.level + amount));
        q1.boughtOrRefunded = (_) => resetToPIMult();
        q1.isAvailable = false

    }    
    // q2
    
    {
        let getDesc = (level) => "q_2=3^{" + level + "}";
        let getInfo = (level) => "q_2=" + getQ2(level).toString(0);
        q2 = theory.createUpgrade(1e5, currency, ups[2]);
        q2.getDescription = (_) => Utils.getMath(getDesc(q2.level));
        q2.getInfo = (amount) => Utils.getMathTo(getInfo(q2.level), getInfo(q2.level + amount));
        q2.boughtOrRefunded = (_) => resetToPIMult();
        q2.isAvailable = false
    }
    // p
    
    {
        let getDesc = (level) => "p={" + getP(level).toNumber().toFixed(2) + "}";
        let getInfo = (level) => "p=" + getP(level).toNumber().toFixed(2);
        p = theory.createUpgrade(4, currency, ups[3]);
        p.getDescription = (_) => Utils.getMath(getDesc(p.level));
        p.getInfo = (amount) => Utils.getMathTo(getInfo(p.level), getInfo(p.level + amount));
        p.boughtOrRefunded = (_) => resetToPIMult();
        
    }
    // c1
    
    {
        let getDesc = (level) => "c_1=" + getC1(level).toString(0);
        c1 = theory.createUpgrade(2, currency, ups[4]);
        c1.getDescription = (_) => Utils.getMath(getDesc(c1.level));
        c1.getInfo = (amount) => Utils.getMathTo(getDesc(c1.level), getDesc(c1.level + amount));
        c1.boughtOrRefunded = (_) => resetToPIMult();
    }

    // c2

    {
        let getDesc = (level) => "c_2=2^{" + level + "}";
        let getInfo = (level) => "c_2=" + getC2(level).toString(0);
        c2 = theory.createUpgrade(3, currency, ups[5]);
        c2.getDescription = (_) => Utils.getMath(getDesc(c2.level));
        c2.getInfo = (amount) => Utils.getMathTo(getInfo(c2.level), getInfo(c2.level + amount));
        c2.boughtOrRefunded = (_) => resetToPIMult();
    }

    /////////////////////
    // Permanent Upgrades
    {
        p1 = theory.createPublicationUpgrade(0, currency, 1e12);//1e10
        p1.boughtOrRefunded = (_) => {resetToPIMult();};
    }
    {
        p2 = theory.createBuyAllUpgrade(1, currency, 1e10);//1e6
        p2.boughtOrRefunded = (_) => resetToPIMult();
    }
    {
        p3 = theory.createAutoBuyerUpgrade(2, currency, 1e15);//1e15
        p3.boughtOrRefunded = (_) => resetToPIMult();
    }
    /*{
        unbreak = theory.createPermanentUpgrade(666, currency, new ConstantCost(0));
        unbreak.getDescription = (_) => "Unfucks the gamestate, if stuck negative"
        unbreak.getInfo = (_) => "Unfucks the gamestate, if stuck negative"
        unbreak.boughtOrRefunded = (_) => {resetToPIMult(); t += Math.PI; currency.value = BigNumber.ZERO;}
    }*/
    ///////////////////////
    //// Milestone Upgrades
    theory.setMilestoneCost(new CompositeCost(7, new LinearCost(25*taupau, 25*taupau), new LinearCost(200*taupau, 50*taupau)));
    
    //dt milestone
    {
        pMilestone = theory.createMilestoneUpgrade(0, 2);
        pMilestone.description = Localization.getUpgradeMultCustomDesc("p", "\\sqrt{2}") + ", t = $t^{1/\\sqrt(2)}$";
        pMilestone.info = Localization.getUpgradeMultCustomInfo("p", "\\sqrt{2}") + ", t = $t^{1/\\sqrt(2)}$";
        pMilestone.bought = (_) => {theory.invalidatePrimaryEquation(); savet[pMilestone.level] = t; t = t.pow(1/Math.sqrt(2)); savet[pMilestone.level] = savet[pMilestone.level] - t; maxt = t; resetToPIMult(); currency.value = BigNumber.ZERO;updateAvailability();};
        pMilestone.refunded = (_) => {theory.invalidatePrimaryEquation(); t += savet[pMilestone.level + 1]; resetToPIMult(); currency.value = BigNumber.ZERO;updateAvailability();}
        pMilestone.isAvailable = true;
        
    }
    //q milestone
    {
        qMilestone = theory.createMilestoneUpgrade(1, 2);
        qMilestone.description = Localization.getUpgradeUnlockDesc(qMilestone.level == 0 ? "q_1" : "q_2");
        qMilestone.info = Localization.getUpgradeUnlockInfo(qMilestone.level == 0 ? "q_1" : "q_2");
        qMilestone.boughtOrRefunded = (_) => {
            theory.invalidatePrimaryEquation(); resetToPIMult(); updateAvailability();
            qMilestone.description = Localization.getUpgradeUnlockDesc(qMilestone.level == 0 ? "q_1" : "q_2");
            qMilestone.info = Localization.getUpgradeUnlockInfo(qMilestone.level == 0 ? "q_1" : "q_2");
            currency.value = BigNumber.ZERO;
        }
        qMilestone.canBeRefunded = (_) => ((qPowMilestone.level < 1)||(qMilestone.level > 1)); 
    }
    //q power milestone
    {
        qPowMilestone = theory.createMilestoneUpgrade(2, 3);
        qPowMilestone.description =  Localization.getUpgradeIncCustomExpDesc("q", "0.05");
        qPowMilestone.info = Localization.getUpgradeIncCustomExpInfo("q", "0.05");
        qPowMilestone.boughtOrRefunded = (_) => {theory.invalidatePrimaryEquation(); updateAvailability(); resetToPIMult(); currency.value = BigNumber.ZERO;};
        qPowMilestone.isAvailable = false;
    }
    //c power milestone
    {
        cPowMilestone = theory.createMilestoneUpgrade(3, 5);
        cPowMilestone.description =  Localization.getUpgradeIncCustomExpDesc("c", "0.001");
        cPowMilestone.info = Localization.getUpgradeIncCustomExpInfo("c", "0.001");
        cPowMilestone.boughtOrRefunded = (_) => {theory.invalidatePrimaryEquation(); updateAvailability(); resetToPIMult(); currency.value = BigNumber.ZERO;};
        //cPowMilestone.isAvailable = false;
    }
    /////////////////
    //// Achievements
    //TODO some time in the future
    a1 = theory.createAchievement(0, "First hundred, to many more", "Reach 1e100 rho", () => currency.value > 1e100);
    a2 = theory.createAchievement(1, "The end, or just the beginning?", "Reach 1e500 rho", () => currency.value > BigNumber.from("1e500"));
    a3 = theory.createAchievement(2, "Just You Wait", "Reach 1000 t", () => t > 1000);
    a4 = theory.createAchievement(3, "Keep Waiting", "Reach 10000 t", () => t > 10000);
    a5 = theory.createAchievement(4, "Fine, You Can Stop Now", "Reach 100000 t", () => t > 100000);
    s0 = theory.createSecretAchievement(5, "Sleeper", "Reach 1000000 t","You Should Have Stopped",  () => t > 1000000);
    s1 = theory.createSecretAchievement(6, "Master Mixer", "have q larger than c", "How Do You Even Do That?", () => c < q);
    updateAvailability();
}

var updateAvailability = () => {
    q1.isAvailable = qMilestone.level > 0;
    q2.isAvailable = qMilestone.level > 1;
    qPowMilestone.isAvailable = qMilestone.level > 0;
    
    //cPowMilestone.isAvailable = qPowMilestone.level > 2;
}

var simulateTResets = (elapsedTime) => {
    buys = 0;
    for(let i = 1; i < theory.upgrades.length; i ++){
        let upg = theory.upgrades[i];
        buys += ups[i].getMax(upg.level, max(currency.value, 1));
        if (theory.upgrades[i].isAutoBuyable)theory.upgrades[i].buy(-1);
    }
    t = max(max(t - (t % (2 * Math.PI)), maxt), t + (getdt() * elapsedTime) - (buys * (Math.PI / 2)));
    setMaxt(true);
}


var tick = (elapsedTime, multiplier) => {
    if (f.level == 0 && c1.level == 0) return;
    let dt = BigNumber.from(elapsedTime * multiplier);
    let bonus = theory.publicationMultiplier;
    currency.value += dt * 
        bonus * 
        (getF(f.level) + 
        (qMilestone.level > 0 ? q.pow(qPowMilestone.level * 0.05 + 1) : 1) *
        (cPowMilestone.level > 0 ? c.pow(cPowMilestone.level * 0.001 + 1) : c) *
        (t.pow(Math.pow(Math.sqrt(2), pMilestone.level) * getP(p.level)) /  (10*getdt())) *
        Math.cos(t.toNumber()));
    
    if(qMilestone.level > 0){
        q += ((getQ1(q1.level) * getQ2(q2.level)) / 1e2) * (elapsedTime);
    }
    c += (getC1(c1.level) * getC2(c2.level) * getdt()) * (elapsedTime);
    //buys = ups[3].getMax(p.level, currency.value)
    if(currency.value > 0 && currency.value.log10() > currMax){
        currMax = currency.value.log10().toNumber();
    }
    if(game.isCalculatingOfflineProgress){
        if(theory.isAutoBuyerActive && currency.value > 0){
            simulateTResets(elapsedTime)
        }else{
            t += getdt() * elapsedTime
        }
        lastTickWasAFK = true;
    }else{
        if(lastTickWasAFK){
            //we just finished offline calculations
            
            resetToPIMult();
            //t += Math.PI;
            currency.value = BigNumber.ZERO;
            lastTickWasAFK = false;        
        }
        if(elapsedTime > 0.5){
            if(theory.isAutoBuyerActive){
                simulateTResets(elapsedTime);
                resetToPIMult();
                currency.value = BigNumber.ZERO;
            }else{
                simulateTResets(elapsedTime);
                //resetToPIMult();
                //currency.value = BigNumber.ZERO;
            }
            
            //resetToPIMult();
            //currency.value = BigNumber.ZERO;
        }else{
            t += getdt() * elapsedTime
        }
    }
    theory.invalidateTertiaryEquation();
    theory.invalidateSecondaryEquation();
}

var getPrimaryEquation = () => {
    let result = "\\dot\\rho = f + c";
    result += cPowMilestone.level > 0 ? "^{" + (cPowMilestone.level * 0.001 + 1) + "}" : ""
    result += pMilestone.level < 1 ? "\\frac{t" : "\\frac{t^{\\sqrt{" + (pMilestone.level * 2) + "}}"
    result += "^{p}"
    result += "}{10dt} \\ "
    result += qMilestone.level > 0 ? "q" + (qPowMilestone.level > 0 ? "^{" + (1 + qPowMilestone.level * 0.05) + "}" : "") : ""
    result += "\\cos{(t)}"
    
    return result;
}

var postPublish = () => {
    t = BigNumber.ZERO;
    maxt = BigNumber.ZERO;
    q = BigNumber.ONE;
    c = BigNumber.ONE;
    currMax = 1;
    savet[0] = BigNumber.ZERO;
    savet[1] = BigNumber.ZERO;
}
var getSecondaryEquation = () => {
    
    let result = "\\begin{matrix}";
    result += "c = {" + c + "} \\ "
    result += "\\dot c=c_1c_2dt"
    if(qMilestone.level > 0){
        result += "\\\\";
        result += "q={" + q + "}";
        result += "\\ ";
        result += "\\dot q={q_1" 
        result += qMilestone.level > 1 ? "q_2" : ""
        result += "}/100";
    }
    //result += "\\\\"
    //result += "buys" + buys
    result += "\\end{matrix}";
    return result
}
var getTertiaryEquation = () => {
    let result = theory.latexSymbol + "=\\max\\rho";
    result += "\\ \\ "
    result += "t={" + t.toNumber().toFixed(2) + "}";
    result += "\\ ";
    result += "dt=" + getdt().toFixed(2);
    //result += "dt" + Math.pow(1/currMax, 0.75);
    return result;
}
var getPublicationMultiplier = (tau) => tau.pow(1/taupau).pow(0.1) / 10;
var getPublicationMultiplierFormula = (symbol) => symbol + "^{0.5} / 10";
var getTau = () => currency.value.abs().pow(taupau);
var get2DGraphValue = () => currency.value.sign * (BigNumber.ONE + currency.value.abs()).log10().toNumber();
var getF = (level) => (level * 100)/1000;
var getC1 = (level) => Utils.getStepwisePowerSum(level, 2, 15, 0);
var getC2 = (level) => BigNumber.TWO.pow(level);
var getQ1 = (level) => Utils.getStepwisePowerSum(level, 2, 10, 1) //BigNumber.from(level);
var getQ2 = (level) => BigNumber.THREE.pow(level);
var getP = (level) => BigNumber.from(1 + (level / 100)) ;
var getdt = () => 10 * min(0.1, Math.pow(1/currMax, 0.75));
var getC1Exponent = (level) => BigNumber.from(1 + 0.05 * level);
var getC2Exponent = (level) => BigNumber.from(1 + 0.05 * level);
//if you just need to serialise "t", here's an example: quoth philles gillipe
var setInternalState = (state) => { //set the internal state of values that need to be kept post switch that aren't levels
    let values = state.split(" "); //save values to a string
    if (values.length > 0) t = parseBigNumber(values[0]);
    if (values.length > 1) q = parseBigNumber(values[1]);
    if (values.length > 2) c = parseBigNumber(values[2]);
    if (values.length > 3) currMax = parseFloat(values[3]);
    if (values.length > 4) savet[0] = parseBigNumber(values[4]);
    if (values.length > 5) savet[1] = parseBigNumber(values[5]);
    
}

var getInternalState = () => {
    //resetToPIMult();
    //currency.value = 0;
    return `${t} ${q} ${c} ${currMax} ${savet[0]} ${savet[1]}`// ${currency.value}` //return the data saved 
}
init();
