const $type = Symbol("Type");
const $sumT = Symbol("SumType");
const $schema = Symbol("Schema");
const $cons = Symbol("Constructors");
const $tag = Symbol("Tag");

const tfrom = function (obj) { return this(...this.prototype[$schema].map((v) => obj[v])); }
const tis = function (r) { return r instanceof this; }
const tctoString = function () { return this.prototype[$type] }
const titoString = function () {
    return `${this[$type]}(${this[$schema].map(f => this[f]).join(",")})`;
};
const stoString = function() { return `${this[$tag]}(${this[$schema].map(f => this[f]).join("+")})`; }

const sis = function (obj) {
    return this.prototype[$cons].some(v => this[v].is(obj));
}
const cata = function (sel) {
    const fn = sel[this[$tag]] || sel._;
    if (!fn) throw new Error(`No match for constructor: ${this[$type]}`);
    return fn(this);
};
const nis = function (obj) { return obj === this; };
const ntoString = function () { return this[$type]; };
const prop = (obj, prop, value) => {
    Object.defineProperty(obj, prop, { value: value, writable: false, configurable: false });
    return obj;
};
const unwrap = function () { 
    const obj = Object.create(Object.prototype);
    obj.type = this[$tag] || this[$type];
    for (const k of this[$schema]) obj[k] = this[k];
    return obj;
};

const sfrom = function (obj) {
    if(!obj?.type) throw new TypeError(`Cannot create instance of sum type '${sumTypeName}'. Input object must have a 'type' property. Received: ${JSON.stringify(obj)}`);
    const cons = `${this[$tag]}.${obj.type}`;
    if(!(cons in this)) throw new TypeError(`No such constructor ${obj.type} in ${this}`);
    return this[obj.type].from(obj);
};

function _tagged(typename, fields, process = x => x) {
    if (typeof typename != "string") throw new TypeError("Type name must be a string");
    if (!typename.length) throw new TypeError("Type name cannot be empty");
    if (!Array.isArray(fields)) throw new TypeError("Fields must be an array");
    if (!fields.length) {
        const proto = Object.create(Object.prototype);
        prop(proto, "is", nis);
        prop(proto, "toString", ntoString);
        const singleton = Object.create(proto);
        prop(singleton, $type, typename);
        return process(singleton, typename, fields);
    }
    const constructor = function (...values) {
        if (values.length !== fields.length) throw new TypeError(`This constructor requires ${fields.length} values`);
        let obj = Object.create(constructor.prototype);
        fields.forEach((v, i) => obj[v] = values[i]);
        obj = process(obj, typename, fields);
        return Object.freeze(obj);
    };
    prop(constructor.prototype, $type, typename);
    prop(constructor.prototype, $schema, fields);
    prop(constructor.prototype, "toString", titoString);
    prop(constructor, "is", tis);
    prop(constructor, "from", tfrom);
    prop(constructor, "toString", tctoString);
    return constructor;
}

function tagged(typename, fields) {
    return _tagged(typename, fields);
}

function sum(typename, constructors) {
    const stype = Object.create(null);
    prop(stype, $tag, typename);
    prop(stype, "is", sis);
    prop(stype, "from", sfrom);
    prop(stype, "toString", stoString);
    stype.prototype = Object.create(Object.prototype);
    prop(stype.prototype, $sumT, stype);
    prop(stype.prototype, $cons, Object.keys(constructors));
    prop(stype.prototype, "cata", cata);
    stype.prototype[$cons].forEach(cons => {
        if (cons === "_") throw new TypeError("Constructor name cannot be '_'");
        if (cons in stype) throw new TypeError(`Constructor name '${cons}' already exists`);
        if (cons === typename) throw new TypeError(`Constructor name cannot be the same as the type name '${typename}'`);

        prop(stype, cons, _tagged(
            `${typename}.${cons}`,
            constructors[cons],
            obj => prop(obj, $tag, cons)
        ));
        
        if (constructors[cons].length) {
            Object.setPrototypeOf(stype[cons].prototype, stype.prototype);
        } else {
            Object.setPrototypeOf(Object.getPrototypeOf(stype[cons]), stype.prototype);
        }
    });
    return stype;
}

// constraints are not used yet, but they are here for future use.
const match = (stype, ...constraints) => {
    const ctors = stype?.prototype[$cons];
    if(!ctors) throw new TypeError("Type is not a sum type");
    if (!ctors.length) throw new TypeError("Type has no constructors");
    return (cases) => {
        const wild = cases._;
        const sel = Object.create(null);

        for (const k of ctors) {
            if (k in cases) sel[k] = cases[k];
            else if (wild) sel[k] = wild;
            else throw new TypeError(`non-exhaustive match, missing branch '${k}'`);
        }

        return (node) => {
            if (!stype?.is(node)) throw new TypeError(`match: expected instance of ${stype}, got ${node}`);
            return node.cata(sel);
        };
    };
};

export { tagged, sum, match };