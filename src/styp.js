const $type = Symbol("Type");
const $schema = Symbol("Schema");
const $cons = Symbol("Constructors");

function tagged(typename, fields) {
    const constructor = function (...values) {
        let obj = {};
        fields.forEach((v,i) => obj[v] = values[i]);
        obj.__proto__ = constructor.prototype;
        return obj;
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
    return constructor;
}

function sum(typename, constructors) {
    let stype = {};
    stype.prototype = {
        $cons:[]
    };
    for(let c in constructors) stype.prototype[$cons].push(c);
    stype.is = function(obj) {
        return stype.prototype[$cons]
                .reduce((acc,v) => acc || stype[v].is(obj),false);
    }
    stype.cata = function (sel) {
        return this.$cons.reduce((acc, v) => !acc?stype[v].is(this)?sel[v](this):0:0,0);
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
        }
    });
    return stype;
}

const Point3D = record("Point3D", ["x","y","z"]);
console.log(Point3D.toString());
const a = Point3D(1, 2, 3) // { x: 1, y: 2, z: 3 }
console.log(a.x == 1 && a.y == 2 && a.z == 3) // true
console.log(a.toString()) // 'Point3D(1, 2, 3)'
console.log(Point3D.is(a)) // true
Point3D.prototype.scale = function(n){
  return Point3D(this.x * n, this.y * n, this.z * n)
}
const b = a.scale(2) // { x: 2, y: 4, z: 6 }
console.log(b.toString()) // 'Point3D(2, 4, 6)'
const c = Point3D.from({y: 2, x: 1, z: 3}) // { x: 1, y: 2, z: 3 }
console.log(c.toString())