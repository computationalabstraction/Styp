<div align="center">

<img src="static/styp.png" height="120em" width="240em"/>

<h3>Algebraic Sum Types for Javascript</h3>

<hr/>
</div>

Styp (Sum TYPes) in Javascript. The library provides *tagged* and *tagged sum* types, the distribution size of the library is **611** bytes(Gzipped). This libary has been inspired by languages like `Haskell`, `F#` and `OCaml` which provide sum types natively. Styp has also taken inspiration from [daggy]() (a library for creating sum types in Javascript).

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

let test2 = Maybe.Nothing
    .cata({
        Just: x => x,
        Nothing: () => Maybe.Just(0)
    });

console.log(test2.toString()); // -> Maybe.Just(0)
```

## Installation
> Not yet published on NPM (will be soon)

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

#### `tagged(name: String, fields: Array[String]) -> Function`
This function returns a constructor function for the specified data type.

```javascript
const { tagged } = require("styp");

const Point = tagged("Point", ["x","y"]);

const p1 = Point(10,20);
const p2 = Point(5,5);
```

Every constructor function has these functions: **`is`**, **`from`**,**`toString`**. The instance created by constructor has **`toString`** method and more methods can be added.

