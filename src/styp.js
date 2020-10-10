const $type = Symbol("Type");
const $schema = Symbol("Schema");
const $cons = Symbol("Constructors");

// Add validation and checks
// Generate errors
// Abstract common code
function tagged(typename, fields) {
    const constructor = function (...values) {
        let obj = {};
        fields.forEach((v,i) => obj[v] = values[i]);
        obj.__proto__ = constructor.prototype;
        return Object.freeze(obj);
    };
    constructor.prototype[$type] = typename;
    constructor.prototype[$schema] = fields;
    constructor.from = function(obj) { 
        return constructor(...fields.map((v) => obj[v]));
    };
    constructor.is = function(r) {
        return r instanceof constructor;
    };
    constructor.toString = function() {
        return typename;
    };
    constructor.prototype.toString = function() {
        return `${typename}(${fields.map(f => this[f]).join(",")})`;
    };
    return Object.freeze(constructor);
}

function sum(typename, constructors) {
    let stype = {};
    stype.prototype = {
        [$cons]: []
    };
    for(let c in constructors) stype.prototype[$cons].push(c);
    stype.is = function(obj) {
        return stype.prototype[$cons]
                .reduce((acc,v) => acc || stype[v].is(obj),false);
    }
    stype.prototype.cata = function (sel) {
        return stype.prototype[$cons].reduce((acc, v) => !acc?stype[v].is(this)?sel[v](this):null:acc,null);
    };
    stype.prototype[$cons].forEach(cons => {
        if(constructors[cons].length) {
            stype[cons] = tagged(`${typename}.${cons}`,constructors[cons]);
            stype[cons].prototype.__proto__ = stype.prototype;
        } else {
            stype[cons] = {};
            stype[cons].is = function(obj) {
                return obj == stype[cons];
            }
            stype[cons].toString = function() {
                return `${typename}.${cons}`
            }
            stype[cons].__proto__ = stype.prototype;
            stype[cons] = Object.freeze(stype[cons]);
        }
    });
    return Object.freeze(stype);
}

const styp = Object.freeze({
    tagged: tagged,
    sum: sum
});

if(typeof module != "undefined") module.exports = styp;