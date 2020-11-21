<div align="center">

<img src="static/styp.png" height="120em" width="240em"/>

<h3>Algebraic Sum Types for Javascript</h3>

<hr/>
</div>

Styp (Sum TYPes) in Javascript. The library provides `tagged` and `tagged sum` types the distribution of the library is `611` bytes.

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

let test = Maybe.Just(10)
console.log(test.toString())
console.log()
console.log(
    test.cata({
        Just: i => i,
        Nothing: () => Maybe.Just(0)
    }).toString();
); // -> Maybe.Just(10)

console.log(
    test.cata({
        Just: i => i,
        Nothing: () => Maybe.Just(0)
    }).toString();
); // -> Maybe.Just(10)

```