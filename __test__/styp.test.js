
const Point3D = tagged("Point3D", ["x","y","z"]);
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

const Option = sum("Option", {
    Some: ["x"],
    None: []
});

let temp = Option.Some(10);
console.log(temp.toString());
console.log(Option.is(temp));
console.log(Option.is({}));
console.log(Option.Some.is(temp));
console.log(Option.None.is(Option.None));

Option.prototype.map = function(f) {
    return this.cata({
        Some: ({ x }) => Option.Some(f(x)),
        None: () => this
    });
}

console.log("here!");
console.log(temp.map(x => x*2).toString());
console.log(Option.None.cata({
    None: () => Option.Some(0)
}).toString())