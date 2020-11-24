<div align="center">

<img src="static/styp.png" height="120em" width="240em"/>

<h3>Algebraic Sum Types for Javascript</h3>

<hr/>
</div>

Styp (Sum TYPes) is written in Javascript, the library provides mechanisms for creating *constructors* and *sum types* or *disjoint union types*, the distribution size of the library is **611** bytes(Gzipped). This libary has been inspired by languages like `Haskell`, `F#` and `OCaml` which provide sum types natively. Styp has also taken inspiration from [daggy](https://github.com/fantasyland/daggy)(a library for creating sum types in Javascript).

#### `Example Code`
```javascript
const { tagged, sum } = require("styp");

const Polar = tagged("Polar", ["r", "theta"]);

let p1 = Polar(3, 0.88);
console.log(p1.toString()); // -> Polar(3,0.88)

const Maybe = sum("Maybe", {
    Just: ["val"],
    Nothing: []
});

let test1 = Maybe.Just(10);

console.log(test1.toString()); // -> Maybe.Just(10)
console.log(Maybe.is(test1)); // -> true
console.log(Maybe.Just.is(test1)); // -> true
console.log(Maybe.Nothing.is(test1)); // -> false

let times = Maybe.Nothing
    .cata({
        Just: x => x.val,
        Nothing: () => 1
    });

console.log(times * 5); // -> 5
```

## Installation

### Node
```
npm i styp
```
### Browser
```
<script src="https://unpkg.com/styp"></script>
```

## Documentation
> Underconstruction!

#### `tagged(typename: String, fields: Array[String]) -> Function | Object`
This function takes *typename* and *fields* as params and returns a constructor function for the specified data type. In case of an empty *fields* array this function will return an object which you can use like one valued type.

```javascript
const { tagged } = require("styp");

const Point = tagged("Point", ["x","y"]);
const nil = tagged("nil", []); // -> my custom null type 

const p1 = Point(10,20);
const p2 = Point(5,5);

let temp = nil;
console.log(nil.is(temp));
console.log(temp.toString());
```

Every constructor functor has these methods: **`is`**, **`from`**,**`toString`**. The instance created by constructor has **`toString`** method and more methods can be added by the user more details are given below in the constructors section.

#### `sum(typename: String, constructors: Object) -> Object`
This function helps create a sum type (which is represented as an Object) it takes *typename* and an object which contains names of constructors and their fields(if any). The function returns an object which has all constructor functions (as specified in the passed *constructors* param).

```javascript
const { sum } = require("styp");

const SafeDiv = sum("SafeDiv", [
    Succ:["v"],
    byZero: []
]);

const safelyDivide = (n,d) => d? SafeDiv.Succ(n/d): SafeDiv.byZero;

console.log(safelyDivide(10,2).toString());
console.log(safelyDivide(2,0).toString());
```

### Constructors
Every constructor function/sum type object has the following methods defined -

* #### toString
* #### is

and

* #### from (only defined on constructor functions)

#### `{constructor}.toString() -> String`
```javascript
const { tagged } = require("styp");

const Point = sum("Point", {
    Cartesian: ["x","y","z"],
    Polar: ["r","theta"]
});

console.log(Point.toString()); // -> Point
```

#### `{constructor}.is(obj: Object) -> Boolean`
```javascript
const { tagged } = require("styp");

const Point = tagged("Point", ["x","y"]);
let p1 = Point(2, 7);

console.log(Point.is(p1));  // -> true
console.log(Point.is({ random:true }));  // -> false
```

#### `{constructor}.from(obj: Object) -> Object`
```javascript
const { tagged } = require("styp");

const Point = tagged("Point", ["x","y"]);
let p1 = Point.from({ x:10, y:3, extra:"anything" });

console.log(p1.toString()); // -> Point(10,3)
```

### Instances
...