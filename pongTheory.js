import { ExponentialCost, FirstFreeCost } from "../api/Costs";
import { Localization } from "../api/Localization";
import { BigNumber } from "../api/BigNumber";
import { theory } from "../api/Theory";
import { Utils } from "../api/Utils";


var id = "pong"
var name = "Pong Theory";
var description = "Pong in Exponential Idle. Yes, you read that right.";
var authors = "71~073~#7380";
var version = 1;

var state, center, scale, speed;
var c1, c2, c3, c4, c5;
var equation, c3Exp, c4Exp, c5Exp;

var systems = [(v) => new Vector3(10 * (v.y - v.x), v.x * (28 - v.z) - v.y, v.x * v.y - 8 * v.z / 3.0), // Lorenz
               (v) => new Vector3(10 * (40 * (v.y - v.x)), 10 * (-12 * v.x - v.x * v.z + 28 * v.y), 10 * (v.x * v.y - 3 * v.z)), // Chen
               (v) => new Vector3(500 * (-v.y - v.z), 500 * (v.x + 0.1 * v.y), 500 * (0.1 + v.z * (v.x - 14)))]; // Rossler

var bounds = [[-10,10],[-20,20]];

var defaultStates = [new Vector3(-6, -8, 26),
                     new Vector3(-10.6, -4.4, 28.6),
                     new Vector3(-6, 15, 0)];

var swizzles = [(v) => new Vector3(v.y, v.z, v.x),
                (v) => new Vector3(v.y, v.z, v.x),
                (v) => new Vector3(v.x, v.y, v.z)];

var dts = [0.02, 0.002, 0.00014];
var dot = new Vector3(0,0,0)
var init = () => {
    currency = theory.createCurrency();
    speed = new Vector3(1, 1, 0)
    state = new Vector3(0,0,0)
    center = new Vector3(0,0,0)
    scale = new Vector3(1,1,1)
    /////////////////////
    // Regular Upgrades

    

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
    
    if (Math.abs(state.x) > bounds[0][1]) speed.x = -speed.x;
    if (Math.abs(state.y) > bounds[0][1]) speed.y = -speed.y;
    if (Math.abs(state.z) > bounds[0][1]) speed.z = -speed.z;

    var dt = BigNumber.from(elapsedTime * multiplier);
    var bonus = theory.publicationMultiplier;

    


    //speed = new Vector3(1, -1, 1)

    state = state + dts[0] * 10 * new Vector3(speed.x, speed.y, speed.z)

   

    //var dx2Term = vc3 * (d.x * d.x);
    //var dy2Term = vc4 * (d.y * d.y);
    //var dz2Term = vc5 * (d.z * d.z);
    //currency.value += dt * bonus * vc1 * vc2 * (dx2Term + dy2Term + dz2Term).sqrt() / BigNumber.HUNDRED;

    theory.invalidateTertiaryEquation();
}

var getInternalState = () => `${state.x} ${state.y} ${state.z}`

var setInternalState = (stateString) => {
    let values = stateString.split(" ");
    state = new Vector3(state.x, state.y, state.z); // Make sure that we don't change the default state instances
    if (values.length > 0) state.x = parseFloat(values[0]);
    if (values.length > 1) state.y = parseFloat(values[1]);
    if (values.length > 2) state.z = parseFloat(values[2]);
}

var postPublish = () => {
    state = defaultStates[equation.level];
}

var recreateDynamicSystem = () => {
    state = defaultStates[equation.level];
    bound = bounds[equation.level];
    center = bound[0];
    scale = 2 / (bound[2] - bound[1]).maxComponent;
    theory.clearGraph();
}

var getPrimaryEquation = () => {
    return "";
}

var getSecondaryEquation = () => {
    return "";
}

var getTertiaryEquation = () => {
    return "";
}

var getCoordString = (x) => x.toFixed(x >= 0 ? (x < 10 ? 3 : 2) : (x <= -10 ? 1 : 2));

var getPublicationMultiplier = (tau) => tau.pow(0.15);
var getPublicationMultiplierFormula = (symbol) => "{" + symbol + "}^{0.15}";
var getTau = () => currency.value;
var get3DGraphPoint = () => swizzles[equation.level]((state - center) * scale);

var getC1 = (level) => Utils.getStepwisePowerSum(level, 2, 10, 0);
var getC2 = (level) => BigNumber.TWO.pow(level);
var getC3 = (level) => BigNumber.THREE.pow(level);
var getC4 = (level) => BigNumber.FIVE.pow(level);
var getC5 = (level) => BigNumber.SEVEN.pow(level);
var getC3Exp = (level) => BigNumber.from(1 + level * 0.05);
var getC4Exp = (level) => BigNumber.from(1 + level * 0.05);
var getC5Exp = (level) => BigNumber.from(1 + level * 0.05);

init();