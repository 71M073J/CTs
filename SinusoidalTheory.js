﻿import { ConstantCost, Cost, CustomCost, ExponentialCost, FreeCost, LinearCost, StepwiseCost } from "./api/Costs";
import { Localization } from "./api/Localization";
import { BigNumber } from "./api/BigNumber";
import { theory } from "./api/Theory";
import { Utils } from "./api/Utils";

var id = "Sinusoid Theory";
var name = "Sinusoid Theory";
var description = "A theory where you have to pay attention to sinusoidal changes in your function. Buying any upgrades reverts time to its last multiple of PI, allowing the function value to stay centered approximately at 0.";
var authors = "71~073~#7380";
var version = 1.3;

var currency;
var t = 0.0;
var f, c1, c2, q, q1, p, dt, unbreak;
var dtMilestone, c1Exp, c2Exp;
var dts = [0.1, 0.05, 0.025]
var achievement1, achievement2;
//var chapter1, chapter2;
var maxt;
var init = () => {
    currency = theory.createCurrency();
    //currency2 = theory.createCurrency();
    t = 0.0;
    maxt = 0.0;
    q = BigNumber.ONE;
    max = (a,b) => {
        if (a > b){return a} else {return b}
    };
    resetToPIMult = () => {
        t = max(t - (t % (2 * Math.PI)), maxt);
        if(t > maxt){
            maxt = t;
        }
    };
    ///////////////////
    // Regular Upgrades
    //f, free upgrade
    {
        let getDesc = (level) => "f={" + getF(level) + "}";
        let getInfo = (level) => "f=" + getF(level);
        f = theory.createUpgrade(0, currency, new FreeCost());
        f.getDescription = (_) => Utils.getMath(getDesc(f.level));
        f.getInfo = (amount) => Utils.getMathTo(getInfo(f.level), getInfo(f.level + amount));
    }
    //q will eventually be a milestone
    //q1
    {
        let getDesc = (level) => "q_1={" + level + "}";
        let getInfo = (level) => "q_1=" + getQ1(level).toString(0);
        q1 = theory.createUpgrade(1, currency, new ExponentialCost(1e2, Math.sqrt(2)));
        q1.getDescription = (_) => Utils.getMath(getDesc(q1.level));
        q1.getInfo = (amount) => Utils.getMathTo(getInfo(q1.level), getInfo(q1.level + amount));
        q1.boughtOrRefunded = (_) => resetToPIMult();
        q1.isAvailable = false

    }    
    // q2
    
    {
        let getDesc = (level) => "q_2=2^{" + level + "}";
        let getInfo = (level) => "q_2=" + getQ2(level).toString(0);
        q2 = theory.createUpgrade(5, currency, new ExponentialCost(1e15, 20));
        q2.getDescription = (_) => Utils.getMath(getDesc(q2.level));
        q2.getInfo = (amount) => Utils.getMathTo(getInfo(q2.level), getInfo(q2.level + amount));
        q2.boughtOrRefunded = (_) => resetToPIMult();
        q2.isAvailable = false
    }
    // p
    
    {
        let getDesc = (level) => "p={" + getP(level).toFixed(2) + "}";
        let getInfo = (level) => "p=" + getP(level).toFixed(2);
        p = theory.createUpgrade(4, currency, new ExponentialCost(1, 2));
        p.getDescription = (_) => Utils.getMath(getDesc(p.level));
        p.getInfo = (amount) => Utils.getMathTo(getInfo(p.level), getInfo(p.level + amount));
        p.boughtOrRefunded = (_) => resetToPIMult();
    }
    // c1
    
    {
        let getDesc = (level) => "c_1=" + getC1(level).toString(0);
        c1 = theory.createUpgrade(2, currency, new ExponentialCost(1, Math.log10(5)));
        c1.getDescription = (_) => Utils.getMath(getDesc(c1.level));
        c1.getInfo = (amount) => Utils.getMathTo(getDesc(c1.level), getDesc(c1.level + amount));
        c1.boughtOrRefunded = (_) => resetToPIMult();
    }

    // c2

    {
        let getDesc = (level) => "c_2=2^{" + level + "}";
        let getInfo = (level) => "c_2=" + getC2(level).toString(0);
        c2 = theory.createUpgrade(3, currency, new ExponentialCost(50, 2));
        c2.getDescription = (_) => Utils.getMath(getDesc(c2.level));
        c2.getInfo = (amount) => Utils.getMathTo(getInfo(c2.level), getInfo(c2.level + amount));
        c2.boughtOrRefunded = (_) => resetToPIMult();
    }

    /////////////////////
    // Permanent Upgrades
    {
        p1 = theory.createPublicationUpgrade(0, currency, 1e10);
        p1.boughtOrRefunded = (_) => {resetToPIMult();};
    }
    {
        p2 = theory.createBuyAllUpgrade(1, currency, 1e8);
        p1.boughtOrRefunded = (_) => resetToPIMult();
    }
    {
        p3 = theory.createAutoBuyerUpgrade(2, currency, 1e13);
        p1.boughtOrRefunded = (_) => resetToPIMult();
    }
    {
        unbreak = theory.createPermanentUpgrade(666, currency, new ConstantCost(0));
        unbreak.getDescription = (_) => "Unfucks the gamestate, if stuck negative"
        unbreak.getInfo = (_) => "Unfucks the gamestate, if stuck negative"
        unbreak.boughtOrRefunded = (_) => {resetToPIMult(); t += Math.PI; currency.value = BigNumber.ZERO;}
    }
    ///////////////////////
    //// Milestone Upgrades
    // TODO make q variable a milestone 
    theory.setMilestoneCost(new LinearCost(25, 25));
    //theory.setMilestoneCost(new LinearCost(0, 0));

    {
        dtMilestone = theory.createMilestoneUpgrade(0, 2);
        dtMilestone.description = Localization.getUpgradeMultCustomDesc("dt", "0.5") + " " + Localization.getUpgradeMultCustomDesc("p", "+1");
        dtMilestone.info = Localization.getUpgradeMultCustomInfo("dt", "0.5") + " " + Localization.getUpgradeMultCustomInfo("p", "+1");
        dtMilestone.boughtOrRefunded = (_) => {theory.invalidatePrimaryEquation(); resetToPIMult(); t = Math.sqrt(t)};
        dtMilestone.isAvailable = true;
    }
    
    {
        qMilestone = theory.createMilestoneUpgrade(1, 1);
        qMilestone.description = Localization.getUpgradeUnlockDesc("q_1");
        qMilestone.info = Localization.getUpgradeUnlockInfo("q_2");
        qMilestone.boughtOrRefunded = (_) => {theory.invalidatePrimaryEquation(); resetToPIMult(); updateAvailability();}
    }
    
    {
        qMilestone2 = theory.createMilestoneUpgrade(2, 1);
        qMilestone2.description = Localization.getUpgradeUnlockDesc("q_2");
        qMilestone2.info = Localization.getUpgradeUnlockInfo("q_2");
        qMilestone2.boughtOrRefunded = (_) => {theory.invalidatePrimaryEquation(); resetToPIMult(); updateAvailability();}
    }
    
    /////////////////
    //// Achievements
    //achievement1 = theory.createAchievement(0, "Achievement 1", "Description 1", () => c1.level > 1);
    //achievement2 = theory.createSecretAchievement(1, "Achievement 2", "Description 2", "Maybe you should buy two levels of c2?", () => c2.level > 1);

    //updateAvailability();
}

var updateAvailability = () => {
    qMilestone2.isAvailable = qMilestone.level > 0;
    q1.isAvailable = qMilestone.level > 0;
    q2.isAvailable = qMilestone2.level > 0;
}

var tick = (elapsedTime, multiplier) => {
    let dt = BigNumber.from(elapsedTime * multiplier);
    let bonus = theory.publicationMultiplier;
    currency.value += dt * 
        bonus * 
        q *
        //(getF(f.level) + 
        //getC1(c1.level) *
        //getC2(c2.level)) *
        //(Math.pow(t, (dtMilestone.level + 1) *  getP(p.level)) /  (100*dts[dtMilestone.level])) *
        Math.cos(t);// - Math.sin(t) + Math.cos(t)) //.pow(getC2Exponent(c2Exp.level))
    t += dts[dtMilestone.level];
    q += (getQ1(q1.level) * getQ2(q2.level)) / 1e3
    theory.invalidateSecondaryEquation();
}

var getPrimaryEquation = () => {
    let result = "\\dot\\rho = f + c_1";

    //if (c1Exp.level == 1) result += "^{0.05}";
    //if (c1Exp.level == 2) result += "^{0.1}";
    //if (c1Exp.level == 3) result += "^{0.15}";

    result += "c_2";

    //if (c2Exp.level == 1) result += "^{0.05}";
    //if (c2Exp.level == 2) result += "^{0.1}";
    //if (c2Exp.level == 3) result += "^{0.15}";
    result += dtMilestone.level < 1 ? "\\frac{t" : "\\frac{t^" + (dtMilestone.level + 1)
    result += "^{p}"
    result += "}{100dt} \\ "
    result += qMilestone.level > 0 ? "q" : ""
    result += "\\sin{(t)}"
    
    return result;
}

var postPublish = () => {
    t = 0.0;
    maxt = 0.0;
    q = BigNumber.ONE;
}
var getSecondaryEquation = () => {
    
    let result = "\\begin{matrix}";
    result += "t={" + t.toFixed(2) + "}";
    result += "\\ ";
    result += "dt=" + dts[dtMilestone.level];
    if(qMilestone.level > 0){
        result += "\\\\";
        result += "q={" + q + "}";
        result += "\\ ";
        result += "\\dot q={q_1" 
        result += qMilestone2.level > 0 ? "q_2" : ""
        result += "}/1000";
    }
    result += "\\end{matrix}";
    return result
}
var getTertiaryEquation = () => theory.latexSymbol + "=\\max\\rho";
var getPublicationMultiplier = (tau) => tau.pow(0.164) / BigNumber.THREE;
var getPublicationMultiplierFormula = (symbol) => "\\frac{{" + symbol + "}^{0.164}}{3}";
var getMilestone
var getTau = () => currency.value;
var get2DGraphValue = () => currency.value.sign * (BigNumber.ONE + currency.value.abs()).log10().toNumber();
var getF = (level) => (level * 100)/1000
var getC1 = (level) => Utils.getStepwisePowerSum(level, 2, 10, 1);
var getC2 = (level) => BigNumber.TWO.pow(level);
var getdt = (level) => BigNumber.TWO.pow(level);
var getQ1 = (level) => BigNumber.from(level);
var getQ2 = (level) => BigNumber.THREE.pow(level);
var getP = (level) => 1 + (level / 100) 
var getC1Exponent = (level) => BigNumber.from(1 + 0.05 * level);
var getC2Exponent = (level) => BigNumber.from(1 + 0.05 * level);
//if you just need to serialise "t", here's an example: quoth philles gillipe
var setInternalState = (state) => { //set the internal state of values that need to be kept post switch that aren't levels
    let values = state.split(" "); //save values to a string
    if (values.length > 0) t = parseFloat(values[0]);
    if (values.length > 1) q = parseBigNumber(values[1]);
    //if (values.length > 2) currency.value = parseBigNumber(values[2]);
}

var getInternalState = () => {
    resetToPIMult();
    currency.value = 0;
    return `${t} ${q}`// ${currency.value}` //return the data saved 
}
init();