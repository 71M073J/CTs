import { CompositeCost, ConstantCost, Cost, CustomCost, ExponentialCost, FirstFreeCost, FreeCost, LinearCost, StepwiseCost } from "./api/Costs";
import { Localization } from "./api/Localization";
import { BigNumber, parseBigNumber } from "./api/BigNumber";
import { theory } from "./api/Theory";
import { Utils } from "./api/Utils";
import { game, Game } from "./api/Game";

var id = "Sinusoid Theory";
var name = "Sinusoid Theory";
var description = "A theory where you have to pay attention to sinusoidal changes in your function. Buying any upgrades reverts time to its last multiple of π, allowing the function value to stay centered approximately at 0.";
var authors = "71~073~#7380";
var version = 6;

var currency;
var f, c1, c2, q1, q2, p;
var pMilestone, qPowMilestone, qMilestone;
var a1, a2, a3, a4, a5, s1, s2;

var t = 0;
var savet = [0, 0];
var q = BigNumber.ONE;
var c = BigNumber.ONE;
var costs = [
    new FreeCost(),
    new ExponentialCost(1e25, Math.log2(10)),
    new ExponentialCost(1e35, Math.log2(1e5)),
    new ExponentialCost(1, Math.log2(2)), 
    new FirstFreeCost(new ExponentialCost(50, Math.log2(1.4))), 
    new ExponentialCost(1000, Math.log2(10))
];
var taupau = 0.1;
var lastTickWasAFK = false;
var elapsedTimeOffset = 0;

var resetToPIMult = () => {
    t = t - (t % (2 * Math.PI));

    // This ensure that the next call to this function within the same tick
    // won't decrease 't' to the PI multiple below it.
    t += t * 1e-6;
};
max = (a,b) => {
    if (a > b){return a} else {return b}
};
min = (a,b) => {
    if (a < b){return a} else {return b}
};

var init = () => {
    currency = theory.createCurrency();

    theory.primaryEquationHeight = 50;
    theory.secondaryEquationHeight = 50;

    ///////////////////
    // Regular Upgrades
    
    //f, free upgrade
    {
        let getDesc = (level) => "f={" + getF(level) + "}";
        let getInfo = (level) => "f=" + getF(level);
        f = theory.createUpgrade(0, currency, costs[0]);
        f.getDescription = (_) => Utils.getMath(getDesc(f.level));
        f.getInfo = (amount) => Utils.getMathTo(getInfo(f.level), getInfo(f.level + amount));
    }
    //q will eventually be a milestone
    //q1
    {
        let getDesc = (level) => "q_1={" + getQ1(level).toString(0) + "}";
        let getInfo = (level) => "q_1=" + getQ1(level).toString(0);
        q1 = theory.createUpgrade(1, currency, costs[1]);
        q1.getDescription = (_) => Utils.getMath(getDesc(q1.level));
        q1.getInfo = (amount) => Utils.getMathTo(getInfo(q1.level), getInfo(q1.level + amount));
        q1.boughtOrRefunded = (_) => resetToPIMult();
        q1.isAvailable = false

    }    
    // q2
    
    {
        let getDesc = (level) => "q_2=3^{" + level + "}";
        let getInfo = (level) => "q_2=" + getQ2(level).toString(0);
        q2 = theory.createUpgrade(1e5, currency, costs[2]);
        q2.getDescription = (_) => Utils.getMath(getDesc(q2.level));
        q2.getInfo = (amount) => Utils.getMathTo(getInfo(q2.level), getInfo(q2.level + amount));
        q2.boughtOrRefunded = (_) => resetToPIMult();
        q2.isAvailable = false
    }
    // p
    
    {
        let getDesc = (level) => "p={" + getP(level).toNumber().toFixed(2) + "}\,\ t={" + (t * 0.99).toFixed(1) + "}\\\\ (t * 0.99)";
        let getInfo = (level) => "p=" + getP(level).toNumber().toFixed(2);
        p = theory.createUpgrade(4, currency, costs[3]);
        p.getDescription = (_) => Utils.getMath(getDesc(p.level));
        p.getInfo = (amount) => Utils.getMathTo(getInfo(p.level), getInfo(p.level + amount));
        p.boughtOrRefunded = (_) => resetToPIMult();
        p.bought = (levels) => t *= Math.pow(0.99, levels)
        
    }
    // c1
    
    {
        let getDesc = (level) => "c_1=" + getC1(level).toString(0);
        c1 = theory.createUpgrade(2, currency, costs[4]);
        c1.getDescription = (_) => Utils.getMath(getDesc(c1.level));
        c1.getInfo = (amount) => Utils.getMathTo(getDesc(c1.level), getDesc(c1.level + amount));
        c1.boughtOrRefunded = (_) => resetToPIMult();
    }

    // c2

    {
        let getDesc = (level) => "c_2=2^{" + level + "}";
        let getInfo = (level) => "c_2=" + getC2(level).toString(0);
        c2 = theory.createUpgrade(3, currency, costs[5]);
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
    
    ///////////////////////
    //// Milestone Upgrades
    theory.setMilestoneCost(new CompositeCost(7, new LinearCost(25*taupau, 25*taupau), new LinearCost(200*taupau, 50*taupau)));
    
    //dt milestone
    {
        pMilestone = theory.createMilestoneUpgrade(0, 2);
        pMilestone.description = Localization.getUpgradeMultCustomDesc("p", "\\sqrt{2}") + ", t = $t^{1/\\sqrt(2)}$";
        pMilestone.info = Localization.getUpgradeMultCustomInfo("p", "\\sqrt{2}") + ", t = $t^{1/\\sqrt(2)}$";
        pMilestone.bought = (_) => {theory.invalidatePrimaryEquation(); savet[pMilestone.level] = t; t = Math.pow(t, 1/Math.sqrt(2)); savet[pMilestone.level] = savet[pMilestone.level] - t; currency.value = BigNumber.ZERO;updateAvailability();};
        pMilestone.refunded = (_) => {theory.invalidatePrimaryEquation(); t += savet[pMilestone.level + 1]; resetToPIMult(); currency.value = BigNumber.ZERO; updateAvailability();}
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
    s1 = theory.createSecretAchievement(5, "Sleeper", "Reach 1000000 t","You Should Have Stopped",  () => t > 1000000);
    s2 = theory.createSecretAchievement(6, "Master Mixer", "have q larger than c", "How Do You Even Do That?", () => c < q);
    updateAvailability();
}

var updateAvailability = () => {
    q1.isAvailable = qMilestone.level > 0;
    q2.isAvailable = qMilestone.level > 1;
    qPowMilestone.isAvailable = qMilestone.level > 0;
}

var tick = (elapsedTime, multiplier) => {
    theory.invalidateTertiaryEquation();
    theory.invalidateSecondaryEquation();

    if (f.level == 0 && c1.level == 0)
        return;

    // When elapsedTime is too large, randomize it to avoid
    // constructive/destructive behavior when elapsedTime is close
    // to π. This also tends to regularize offline progress for
    // other values of elapsedTime.
    // Note: No time is lost. Every offset is compensated later.
    let newElapsedTimeOffset = 0;

    if (elapsedTime >= 0.5)
        newElapsedTimeOffset = elapsedTime * (Math.random() - 0.5);

    elapsedTime -= elapsedTimeOffset; // Compensate for the previous offset
    elapsedTime += newElapsedTimeOffset; // Add current offset
    elapsedTimeOffset = newElapsedTimeOffset;

    // Handles a corner case during simulation/offline progress when elapsedTime
    // goes from a very high number to very low, potentially making then offsetted
    // elapsedTime negative. Since the lowest elapsedTime is 0.1 in the game,
    // using 0.05 has a lower bound guarantees that if we're ahead of the time,
    // we will be getting 0.05s closer to the real time every tick. 
    if (elapsedTime < 0.05) {
        let clampedElapsedTime = Math.max(elapsedTime, 0.05);
        elapsedTimeOffset += clampedElapsedTime - elapsedTime;
        elapsedTime = clampedElapsedTime;
    }
    
    let bonus = theory.publicationMultiplier;
    let effectiveElapsedTime = elapsedTime * multiplier;
    let dt = getdt();
    //TODO need to account for t resets, there needs to be a penalty for this with large ticks
    
    let vt0 = BigNumber.from(t);
    t += dt * effectiveElapsedTime;
    let vt1 = BigNumber.from(t);
    let tExp = Math.pow(Math.sqrt(2), pMilestone.level) * getP(p.level);

    let vc0 = c;
    c += effectiveElapsedTime * getC1(c1.level) * getC2(c2.level) * dt;
    let vc1 = c;
    let cExp = BigNumber.from(cPowMilestone.level * 0.001 + 1);

    let vq0 = BigNumber.ONE;
    let vq1 = BigNumber.ONE;
    if(qMilestone.level > 0) {
        vq0 = q;
        q += effectiveElapsedTime * getQ1(q1.level) * getQ2(q2.level) / 100;
        vq1 = q;
    }
    let qExp = BigNumber.from(qPowMilestone.level * 0.05 + 1);

    let factor = 1 / (10*dt);

    // We approximate the integral of f(a*t)*cos(a*t) with f(a*t)*sin(a*t)/a, which behaves the same
    // as a full numerical integration in the long term.
    let dCurrency = bonus * (effectiveElapsedTime * getF(f.level) +
                             factor * (vc1.pow(cExp) * vq1.pow(qExp) * vt1.pow(tExp) * vt1.sin() -
                                       vc0.pow(cExp) * vq0.pow(qExp) * vt0.pow(tExp) * vt0.sin()) / dt)
    currency.value += dCurrency;

    if(game.isCalculatingOfflineProgress){
        lastTickWasAFK = true;
    }
    else if(lastTickWasAFK){
        resetToPIMult();
        currency.value = BigNumber.ZERO;
        lastTickWasAFK = false;        
    }
}

var getPrimaryEquation = () => {
    let result = "\\dot\\rho = f + c";
    result += cPowMilestone.level > 0 ? "^{" + (cPowMilestone.level * 0.001 + 1) + "}" : ""
    result += pMilestone.level < 1 ? "\\frac{t" : "\\frac{t^{" +( pMilestone.level > 1 ? (pMilestone.level) : "\\sqrt{" + (pMilestone.level * 2) + "}") + "}"
    result += "^{p}"
    result += "}{10 dt} \\ "
    result += qMilestone.level > 0 ? "q" + (qPowMilestone.level > 0 ? "^{" + (1 + qPowMilestone.level * 0.05) + "}" : "") : ""
    result += "\\cos{(t)}"
    
    return result;
}

var postPublish = () => {
    t = 0;
    savet = [0, 0];
    q = BigNumber.ONE;
    c = BigNumber.ONE;
}
var getSecondaryEquation = () => {
    
    let result = "\\begin{matrix}";
    result += theory.latexSymbol + "=(\\max\\rho)^{0.2}";
    result += ",\\;\\dot c=c_1c_2 \\, dt"
    if(qMilestone.level > 0){
        result += ",\\;\\dot q={q_1" 
        result += qMilestone.level > 1 ? "q_2" : ""
        result += "}/100";
    }
    result += "\\\\\\\\";
    result += "dt=\\min\\{1,\\log_{10}(c)^{0.75}\\}";
    result += "\\end{matrix}";
    return result
}
var getTertiaryEquation = () => {
    let result = "c=" + c;
    if(qMilestone.level > 0)
        result += ",\\;q=" + q;
    result += ",\\;t=" + t.toFixed(2);
    result += ",\\;dt=" + ((getdt() > 0.01) ? getdt().toFixed(5) : getdt().toExponential(1));
    return result;
}
var getPublicationMultiplier = (tau) => tau.pow(1/taupau).pow(0.10) * 5;
var getPublicationMultiplierFormula = (symbol) => "5 \\times " + symbol + "^{0.5}";
var getTau = () => currency.value.abs().pow(taupau);//1 e (log10(currency) / 5)
var getCurrencyFromTau = (tau) => [tau.max(BigNumber.ONE).pow(5), currency.symbol];
//var getCurrencyFromTau = (tau) => [tau.max(BigNumber.ONE).pow(1/taupau), currency.symbol];
var get2DGraphValue = () => currency.value.sign * (BigNumber.ONE + currency.value.abs()).log10().toNumber();
var getF = (level) => (level * 100)/1000;
var getC1 = (level) => Utils.getStepwisePowerSum(level, 2, 15, 0);
var getC2 = (level) => BigNumber.TWO.pow(level);
var getQ1 = (level) => Utils.getStepwisePowerSum(level, 2, 10, 1);
var getQ2 = (level) => BigNumber.THREE.pow(level);
var getP = (level) => BigNumber.from(1 + (level / 100));
//var getdt = () => Math.min(1,5/Math.sqrt(c.max(BigNumber.TEN).log10().toNumber())); //WAYYYYYY TOO HIGH LATEGAME
//var getdt = () => 10 * ((1/c.pow(0.03)).min(0.1).toNumber());
var getdt = () => {//TODO still want a bit steeper, but a bit later curve
    let possible_dt = 10/(c.log10()).pow(0.75)
    if (possible_dt > 1.0){
        return 1.0
    }else{
        return possible_dt.toNumber()
    }
}

var canResetStage = () => true;
var getResetStageMessage = () => "You are about to reset the current publication."
var resetStage = () => {
    for (let i = 0; i < theory.upgrades.length; ++i)
        theory.upgrades[i].level = 0;
    currency.value = 0;
    theory.clearGraph();
    postPublish();
}

//if you just need to serialise "t", here's an example: quoth philles gillipe
var setInternalState = (state) => { //set the internal state of values that need to be kept post switch that aren't levels
    let values = state.split(" "); //save values to a string
    if (values.length > 0) t = parseFloat(values[0]);
    if (values.length > 1) q = parseBigNumber(values[1]);
    if (values.length > 2) c = parseBigNumber(values[2]);
    //if (values.length > 3) currMax = parseFloat(values[3]); // Deprecated
    if (values.length > 4) savet[0] = parseFloat(values[4]);
    if (values.length > 5) savet[1] = parseFloat(values[5]);
}

var getInternalState = () => {
    return `${t} ${q} ${c} 0 ${savet[0]} ${savet[1]}` //return the data saved 
}

init();
