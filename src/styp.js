const $type = Symbol("Type");
const $sumT = Symbol("SumType");
const $schema = Symbol("Schema");
const $cons = Symbol("Constructors");

const tfrom = function (obj) { return this(...this.prototype[$schema].map((v) => obj[v])); }
const tis = function (r) { return r instanceof this; }
const tctoString = function() {return this.prototype[$type]}
const titoString = function() {
    return `${this[$type]}(${this[$schema].map(f => this[f]).join(",")})`;
};
const sis = function(obj) {
    return this.prototype[$cons]
            .reduce((acc,v) => acc || this[v].is(obj),false);
}
const cata = function (sel) {
    return this[$cons].reduce((acc, v) => !acc?this[$sumT][v].is(this)?sel[v](this):null:acc,null);
};
const nis = function(obj) { return obj == this; };
const ntoString = function() { return this[$type] };

function tagged(typename, fields) {
    const constructor = function (...values) {
        if(values.length < fields.length) throw new TypeError(`This constructor requires ${fields.length} values`);
        let obj = {};
        fields.forEach((v,i) => obj[v] = values[i]);
        obj.__proto__ = constructor.prototype;
        return Object.freeze(obj);
    };
    Object.assign(constructor.prototype, { [$type]:typename, [$schema]:fields, toString:titoString });
    Object.assign(constructor, { from:tfrom, is:tis, toString:tctoString });
    return constructor;
}

function sum(typename, constructors) {
    let stype = { is:sis };
    stype.prototype = {
        [$sumT]: stype,
        [$cons]: Object.keys(constructors),
        cata:cata
    };
    stype.prototype[$cons].forEach(cons => {
        if(constructors[cons].length) {
            stype[cons] = tagged(`${typename}.${cons}`,constructors[cons]);
            stype[cons].prototype.__proto__ = stype.prototype;
        } else {
            stype[cons] = {
                [$type]: `${typename}.${cons}`,
                is:nis,
                toString:ntoString,
                __proto__:stype.prototype
            };
        }
    });
    return Object.freeze(stype);
}

const styp = Object.freeze({
    tagged: tagged,
    sum: sum
});

if(typeof module != "undefined") module.exports = styp;