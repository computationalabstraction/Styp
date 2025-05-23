const $type = Symbol("Type");
const $sumT = Symbol("SumType");
const $schema = Symbol("Schema");
const $cons = Symbol("Constructors");
const $tag = Symbol("Tag");

// Helper for const properties
const prop = (obj, prop, value, enumerable=true) => {
    Object.defineProperty(obj, prop, { 
        value: value, 
        writable: false, 
        configurable: false,
        enumerable: enumerable
    });
    return obj;
};

const tfrom = function (obj) { return this(...this.prototype[$schema].map((v) => obj?.[v])); }
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
const stoString = function() { return this[$tag]; }

const sis = function (obj) {
    return this.prototype[$cons].some(v => this[v].is(obj));
}
const cata = function (sel) {
    const fn = sel?.[this[$tag]] || sel?._;
    if (!fn) throw new Error(`No match for constructor: ${this[$type]}`);
    return fn(this);
};
const nis = function (obj) { return obj === this; };
const ntoString = function () { return this[$type]; };

const unwrap = function () { 
    const obj = Object.create(Object.prototype);
    obj.type = this[$tag] || this[$type];
    for (const k of this[$schema]) obj[k] = this[k];
    return obj;
};

const sfrom = function (obj) {
    if(!obj?.type) throw new TypeError(`Object must have a 'type' property. Received: ${JSON.stringify(obj)}`);
    if(!(obj.type in this)) throw new TypeError(`No such constructor ${obj.type} in sum ${this[$tag]}`);
    return this[obj.type].from(obj);
};

function _tagged(typename, fields, process = x => x) {
    if (typeof typename != "string") throw new TypeError("Type name must be a string");
    if (!typename.length) throw new TypeError("Type name cannot be empty");
    if (!Array.isArray(fields)) throw new TypeError("Fields must be an array");
    if (!fields.length) {
        const proto = Object.create(Object.prototype);
        prop(proto, "is", nis);
        prop(proto, "from", function () { return this; });
        prop(proto, "toString", ntoString);
        prop(proto, "unwrap", unwrap);
        prop(proto, "prototype", proto);
        prop(proto, $type, typename);
        prop(proto, $schema, fields);
        const singleton = Object.create(proto);
        prop(proto, Symbol.hasInstance, (instance) => {
            if(instance === singleton) return true;
            return false;     
        });
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
    prop(constructor.prototype, "unwrap", unwrap);
    prop(constructor, "is", tis);
    prop(constructor, "from", tfrom);
    prop(constructor, "toString", tctoString);
    return constructor;
}

function tagged(typename, fields) {
    return _tagged(typename, fields);
}

function sum(typename, constructors) {
    if (typeof typename != "string") throw new TypeError("Type name must be a string");
    if (!typename.length) throw new TypeError("Type name cannot be empty");
    if (typeof constructors != "object" || Array.isArray(constructors)) throw new TypeError("Constructors must be an object");
    const stype = Object.create(null);
    prop(stype, $tag, typename);
    prop(stype, "is", sis);
    prop(stype, "from", sfrom);
    prop(stype, "toString", stoString);
    prop(stype, Symbol.hasInstance, (instance) => {
        if(instance?.[$sumT] === stype) return true;
        return false;
    });
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

        Object.setPrototypeOf(stype[cons].prototype, stype.prototype);
    });
    return stype;
}

export { tagged, sum };