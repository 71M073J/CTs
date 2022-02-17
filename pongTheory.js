import { CompositeCost, ConstantCost, Cost, CustomCost, ExponentialCost, FirstFreeCost, FreeCost, LinearCost, StepwiseCost } from "./api/Costs";
import { Localization } from "./api/Localization";
import { BigNumber, parseBigNumber } from "./api/BigNumber";
import { theory } from "./api/Theory";
import { Utils } from "./api/Utils";
import { game, Game } from "./api/Game";

var id = "pong"
var name = "Pong Theory";
var description = "Pong in Exponential Idle. Yes, you read that right.";
var authors = "71~073~#7380";
var version = 1;

var state, center, scale, speed;
var c1, c2, c3, c4, c5;
var equation, c3Exp, c4Exp, c5Exp;


var bounds = [[new Vector3(0, 0, 24.5), new Vector3(-20, -27, 1), new Vector3(20, 27, 30)]];

var defaultStates = [new Vector3(0, 0, 0)];

var swizzles = [(v) => new Vector3(v.x, v.y, v.z),
                (v) => new Vector3(v.y, v.z, v.x),
                (v) => new Vector3(v.x, v.y, v.z)];

var dts = [0.05, 0.002, 0.00014];
var dot = new Vector3(0,0,0)
var init = () => {
    currency = theory.createCurrency();
    speed = new Vector3(1, 0, 0);
    /////////////////////
    // Regular Upgrades
    updateSpeed = () => {
        sign = new Vector3(speed.x > 0 ? 1 : -1, speed.y > 0 ? 1 : -1, speed.z > 0 ? 1 : -1);
        speed = new Vector3((1 + xspeed.level) * sign.x * 2 , yspeed.level * sign.y * 1.5, zspeed.level * sign.z)
    }
    //x speed
    {
        let getDesc = (level) => "x_{speed}={" + (level*2) + "}";
        let getInfo = (level) => "x_{speed}=" + (level*2);
        xspeed = theory.createUpgrade(1, currency, new ExponentialCost(1, 5));
        xspeed.getDescription = (_) => Utils.getMath(getDesc(xspeed.level));
        xspeed.getInfo = (amount) => Utils.getMathTo(getInfo(xspeed.level), getInfo(xspeed.level + amount));
        xspeed.boughtOrRefunded = (_) => {updateSpeed();theory.invalidatePrimaryEquation();}
    }    
    //y speed
    {
        let getDesc = (level) => "y_{speed}={" + (level*1.5) + "}";
        let getInfo = (level) => "y_{speed}=" + (level*1.5);
        yspeed = theory.createUpgrade(2, currency, new ExponentialCost(1, 6));
        yspeed.getDescription = (_) => Utils.getMath(getDesc(yspeed.level));
        yspeed.getInfo = (amount) => Utils.getMathTo(getInfo(yspeed.level), getInfo(yspeed.level + amount));
        yspeed.boughtOrRefunded = (_) => {updateSpeed();theory.invalidatePrimaryEquation();}
    }    
    //z speed
    {
        let getDesc = (level) => "z_{speed}={" + level + "}";
        let getInfo = (level) => "z_{speed}=" + level;
        zspeed = theory.createUpgrade(3, currency, new ExponentialCost(1, 7));
        zspeed.getDescription = (_) => Utils.getMath(getDesc(zspeed.level));
        zspeed.getInfo = (amount) => Utils.getMathTo(getInfo(zspeed.level), getInfo(zspeed.level + amount));
        zspeed.boughtOrRefunded = (_) => {updateSpeed();theory.invalidatePrimaryEquation();}
    }    
    /////////////////////
    // Permanent Upgrades
    theory.createPublicationUpgrade(0, currency, 0);
    theory.createBuyAllUpgrade(1, currency, 0);
    theory.createAutoBuyerUpgrade(2, currency, 0);

    /////////////////////
    // Checkpoint Upgrades
    theory.setMilestoneCost(new LinearCost(20, 20));

    {
        let getDesc = (_) => equation.level == 0 ? Localization.getUpgradeChenAttractor() : Localization.getUpgradeRosslerAttractor();
        equation = theory.createMilestoneUpgrade(0, 2);
        equation.getDescription = getDesc;
        equation.getInfo = getDesc;
        equation.boughtOrRefunded = (_) => { theory.invalidateSecondaryEquation(); recreateDynamicSystem(); }
    }

    {
        c3Exp = theory.createMilestoneUpgrade(1, 3);
        c3Exp.description = Localization.getUpgradeIncCustomExpDesc("c_3", "0.05");
        c3Exp.info = Localization.getUpgradeIncCustomExpInfo("c_3", "0.05");
        c3Exp.boughtOrRefunded = (_) => theory.invalidatePrimaryEquation();
    }

    {
        c4Exp = theory.createMilestoneUpgrade(2, 3);
        c4Exp.description = Localization.getUpgradeIncCustomExpDesc("c_4", "0.05");
        c4Exp.info = Localization.getUpgradeIncCustomExpInfo("c_4", "0.05");
        c4Exp.boughtOrRefunded = (_) => theory.invalidatePrimaryEquation();
    }

    {
        c5Exp = theory.createMilestoneUpgrade(3, 3);
        c5Exp.description = Localization.getUpgradeIncCustomExpDesc("c_5", "0.05");
        c5Exp.info = Localization.getUpgradeIncCustomExpInfo("c_5", "0.05");
        c5Exp.boughtOrRefunded = (_) => theory.invalidatePrimaryEquation();
    }

    recreateDynamicSystem();
}

var resume = () => {
    let previousState = state;
    recreateDynamicSystem();
    state = previousState;
}

var tick = (elapsedTime, multiplier) => {


    var dt = BigNumber.from(elapsedTime * multiplier);
    var bonus = theory.publicationMultiplier;

    let bounces = 0;
    if (Math.abs(state.x) > 50){
        speed.x = -speed.x;
        bounces += 1;
        theory.invalidatePrimaryEquation();
    } if (Math.abs(state.y) > 10){
        speed.y = -speed.y;
        bounces += 1;
        theory.invalidatePrimaryEquation();
    } 
    if (Math.abs(state.z) > 5){
        speed.z = -speed.z;
        bounces += 1;
        theory.invalidatePrimaryEquation();
    } 
    
    state = state + dts[0] * new Vector3(speed.x, speed.y, speed.z)
    if (bounces > 0){
        currency.value += bonus * 10 * elapsedTime * (bounces * currency.value.pow(0.8) + 1)
    }
    //var dx2Term = vc3 * (d.x * d.x);
    //var dy2Term = vc4 * (d.y * d.y);
    //var dz2Term = vc5 * (d.z * d.z);
    //currency.value += dt * bonus * vc1 * vc2 * (dx2Term + dy2Term + dz2Term).sqrt() / BigNumber.HUNDRED;

    theory.invalidateTertiaryEquation();
}

var getInternalState = () => `${state.x} ${state.y} ${state.z} ${speed.x} ${speed.y} ${speed.z}`

var setInternalState = (stateString) => {
    let values = stateString.split(" ");
    state = new Vector3(state.x, state.y, state.z); // Make sure that we don't change the default state instances
    speed = new Vector3(speed.x, speed.y, speed.z);
    if (values.length > 0) state.x = parseFloat(values[0]);
    if (values.length > 1) state.y = parseFloat(values[1]);
    if (values.length > 2) state.z = parseFloat(values[2]);
    if (values.length > 3) speed.x = parseFloat(values[3]);
    if (values.length > 4) speed.y = parseFloat(values[4]);
    if (values.length > 5) speed.z = parseFloat(values[5]);
}

var postPublish = () => {
    state = defaultStates[equation.level];
    speed = new Vector3(1, 0, 0);
}

var recreateDynamicSystem = () => {
    state = defaultStates[equation.level];
    bound = bounds[equation.level];
    center = bound[0];
    scale = 2 / (bound[2] - bound[1]).maxComponent;
    theory.clearGraph();
}

var getPrimaryEquation = () => {
    return speed.toString();
}

var getSecondaryEquation = () => {
    return "";
}

var getTertiaryEquation = () => {
    return state.toString();
}

var getCoordString = (x) => x.toFixed(x >= 0 ? (x < 10 ? 3 : 2) : (x <= -10 ? 1 : 2));

var getPublicationMultiplier = (tau) => tau.pow(0.15);
var getPublicationMultiplierFormula = (symbol) => "{" + symbol + "}^{0.15}";
var getTau = () => currency.value;
var get3DGraphPoint = () => swizzles[equation.level]((state) * scale);



init();
