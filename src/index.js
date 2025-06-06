const $type = Symbol.for("_styp_Type");
const $sumT = Symbol.for("_styp_SumType");
const $schema = Symbol.for("_styp_Schema");
const $cons = Symbol.for("_styp_Constructors");
const $tag = Symbol.for("_styp_Tag");

// Helper for const properties
const prop = (obj, prop, value, enumerable=false) => {
    Object.defineProperty(obj, prop, { 
        value: value, 
        writable: false, 
        configurable: false,
        enumerable: enumerable
    });
    return obj;
};

const tis = function (r) { return r instanceof this; }
const tctoString = function () { return this.prototype[$type] }
const titoString = function () {
    return `${this[$type]}(${this[$schema].map(f => {
        const val = this[f];
        if(val === undefined) return "undefined";
        if(val === null) return "null";
        if(val?.[$type]) return val.toString();
        return val;
    }).join(",")})`;
};
const stoString = function() { return this[$type]; }

const sis = function (obj) {
    return this.prototype[$cons].some(v => this[v].is(obj));
}
const cata = function (sel) {
    const fn = sel?.[this[$tag]] || sel?._;
    if (!fn) throw new Error(`No match for constructor: ${this[$tag]}`);
    if (typeof fn !== "function") throw new TypeError(`Expected function, got ${typeof fn}`);
    return fn(this);
};
// const nis = function (obj) { return obj === this; };
const ntoString = function () { return this[$type]; };

const unwrap = function (typefield="$type") { 
    const obj = Object.create(Object.prototype);
    obj[typefield] = this[$tag] || this[$type];
    for (const k of this[$schema]) obj[k] = this[k];
    return obj;
};

const tfrom = function (obj) { 
    if (typeof obj !== "object" || obj == null) throw new TypeError(`Object expected, got ${typeof obj}`);
    const result = [];
    for (const field of this.prototype[$schema]) {
        if (!(field in obj)) throw new TypeError(`Missing property: ${field}`);
        result.push(obj[field]);
    }
    return this(...result);
}

const sfrom = function (obj,typefield="$type") {
    if(!obj?.[typefield]) throw new TypeError(`Object must have a '${typefield}' property. Received: ${JSON.stringify(obj)}`);
    if(!(obj[typefield] in this)) throw new TypeError(`No such constructor ${obj[typefield]} in sum ${this[$type]}`);
    return this[obj[typefield]].from(obj);
};

const _reserved = (() => {
  const o = Object.create(null);
  ['toString','unwrap','cata',
    'is','from', '$type', '$sumT', 
    '$schema', '$cons', '$tag'].forEach(k => { o[k] = 1 });
  return Object.freeze(o);
})();

function validateFields (fields) {
  const seen = Object.create(null)
  for (let i = 0, n = fields.length; i < n; i++) {
    const f = fields[i]
    if (typeof f !== 'string' || !f.length) throw new TypeError(`Field names must be non-empty strings: Received '${f}'`)
    if (seen[f]) throw new TypeError(`Duplicate field: ${f}`)
    if (_reserved[f]) throw new TypeError(`Reserved field name: '${f}'. Cannot use names like toString, is, from, etc. or internal symbols as data fields.`)
    seen[f] = 1
  }
}

function _tagged(typename, fields, structural=false, process = x => x) {
    if (typeof typename != "string") throw new TypeError("Type name must be a string");
    if (!typename.length) throw new TypeError("Type name cannot be empty");
    if (!Array.isArray(fields)) throw new TypeError("Fields must be an array");
    if (!fields.length) {
        const proto = Object.create(Object.prototype);
        prop(proto, "is", tis);
        prop(proto, "from", function () { return this; });
        prop(proto, "toString", ntoString);
        prop(proto, "unwrap", unwrap);
        prop(proto, "prototype", proto);
        prop(proto, $type, typename);
        prop(proto, $schema, Object.freeze([]));
        const singleton = Object.create(proto);
        if (structural) {
            prop(singleton, Symbol.hasInstance, (instance) => {
                return typeof instance === "object" && instance != null;
            });
        } 
        else {
            prop(proto, Symbol.hasInstance, (instance) => instance === singleton);
        }
        return process(singleton, typename, fields);
    }
    validateFields(fields);
    const constructor = function (...values) {
        if (values.length !== fields.length) throw new TypeError(`This constructor requires ${fields.length} values`);
        let obj = Object.create(constructor.prototype);
        for(let i = 0; i < fields.length; i++) obj[fields[i]] = values[i];
        // fields.forEach((v, i) => obj[v] = values[i]);
        obj = process(obj, typename, fields);
        return Object.freeze(obj);
    };
    prop(constructor.prototype, $type, typename);
    prop(constructor.prototype, $schema, Object.freeze([...fields]));
    prop(constructor.prototype, "toString", titoString);
    prop(constructor.prototype, "unwrap", unwrap);
    if(structural) {
        prop(constructor, Symbol.hasInstance, (instance) => {
                if (typeof instance !== "object" || instance == null) return false;
                for (const field of fields) {
                    if(!instance.hasOwnProperty(field)) return false;
                    // if (!(field in instance)) return false;
                }
                return true;
            }
        );
    }
    else {
        prop(constructor, Symbol.hasInstance, (instance) => 
            instance != null && Object.getPrototypeOf(instance) === constructor.prototype);
    }
    prop(constructor, "is", tis);
    prop(constructor, "from", tfrom);
    prop(constructor, "toString", tctoString);
    return constructor;
}

function tagged(typename, fields, structural=false) {
    return _tagged(typename, fields, structural);
}

function sum(typename, constructors, structural=false) {
    if (typeof typename != "string") throw new TypeError("Type name must be a string");
    if (!typename.length) throw new TypeError("Type name cannot be empty");
    if (typeof constructors != "object" || Array.isArray(constructors)) throw new TypeError("Constructors must be an object");
    const stype = Object.create(null);
    prop(stype, $type, typename);
    prop(stype, "is", sis);
    prop(stype, "from", sfrom);
    prop(stype, "toString", stoString);
    if(structural) {
        prop(stype, Symbol.hasInstance, (instance) => 
            stype.prototype[$cons].some(variant => instance instanceof stype[variant]));
    }
    else {
        prop(stype, Symbol.hasInstance, (instance) => 
            typeof instance === "object" && instance?.[$sumT] === stype);
    }
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
            structural,
            obj => prop(obj, $tag, cons)
        ));

        Object.setPrototypeOf(stype[cons].prototype, stype.prototype);
    });
    return stype;
}

function match(stype) {
    const ctors = stype?.prototype[$cons];
    if(!ctors) throw new TypeError("Type is not a sum type");
    if (!ctors.length) throw new TypeError("Type has no constructors");
    return (cases) => {
        if("_" in cases && typeof cases._ !== "function") throw new TypeError("Wildcard case must be a function");
        const wild = cases._;
        const sel = Object.create(null);

        for (const k of ctors) {
            if (k in cases) {
                if (typeof cases[k] !== "function") throw new TypeError(`Case '${k}' must be a function`);
                sel[k] = cases[k];
            }
            else if (wild) sel[k] = wild;
            else throw new TypeError(`non-exhaustive match, missing branch '${k}'`);
        }

        return (node) => {
            if (!stype?.is(node)) throw new TypeError(`match: expected instance of ${stype}, got ${node}`);
            if(node[$tag] !== undefined) return node.cata(sel);
            else {
                // for structurally matched plain objects.
                throw new Error(`Object structurally matches some variant of sum type '${stype}' but 'match' (via 'cata') is not currently supported on plain objects. Consider converting to a true instance using '.from()' first.`);
            }
        };
    };
};

export { tagged, sum, match };