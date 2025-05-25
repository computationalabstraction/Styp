<div align="center">
<picture>
  <source srcset="static/styp-dark.png" media="(prefers-color-scheme: dark)">
  <source srcset="static/styp-light.png" media="(prefers-color-scheme: light)">
  <img src="styp-light.png" alt="Styp Logo" height="80em" width="200em">
</picture>


<h3>Algebraic Sum Types for Javascript</h3>

<hr/>
</div>

Styp (Sum TYPes) is written in Javascript, the library provides mechanisms for creating *constructors* (for product types) and *sum types* (also known as disjoint union types or tagged unions). This library has been inspired by languages like `Haskell`, `F#` and `OCaml` which provide sum types natively. Styp has also taken inspiration from [daggy](https://github.com/fantasyland/daggy) (a library for creating sum types in Javascript).

#### `Example Code`

```javascript
import { tagged, sum, match } from "styp"; // Or: const { tagged, sum, match } = require("styp");

// Product Type (like a struct or record)
const Polar = tagged("Polar", ["r", "theta"]);

let p1 = Polar(3, 0.88);
console.log(p1.toString()); // -> Polar(3,0.88)
console.log(p1.unwrap()); // -> { $type: "Polar", r: 3, theta: 0.88 }

// Sum Type (Tagged Union)
const Maybe = sum("Maybe", {
    Just: ["val"],
    Nothing: []
});

let testJust = Maybe.Just(10);
let testNothing = Maybe.Nothing;

console.log(testJust.toString()); // -> Maybe.Just(10)
console.log(Maybe.is(testJust)); // -> true
console.log(Maybe.Just.is(testJust)); // -> true
console.log(Maybe.Nothing.is(testJust)); // -> false
console.log(testNothing.unwrap()); // -> { $type: "Nothing" }

// Using cata for matching
let value = testJust.cata({
    Just: ({ val }) => val,
    Nothing: () => 0
});
console.log(value * 5); // -> 50

// Using the match utility for matching
const getValue = match(Maybe)({
    Just: ({ val }) => val,
    Nothing: () => 0
});
console.log(getValue(testNothing) + 5); // -> 5
```

## Installation

### Node

```bash
npm i styp
```

### Browser

```html
<script src="https://unpkg.com/styp"></script>
```

Or from JSDelivr:

```html
<script src="https://cdn.jsdelivr.net/npm/styp"></script>
```

## Documentation
> Evolving! 

`⚠️ Note`: This doc tracks an unreleased update, published version may differ.

### `tagged(typename: String, fields: Array[String]) -> Function | Object`

This function creates a constructor for a "product type" (a type with a fixed set of named fields).

  * `typename`: A string representing the name of the type.
  * `fields`: An array of strings, where each string is a field name for the type.

**Returns:**

  * If `fields` is not empty, it returns a **constructor function**.
  * If `fields` is empty, it returns an **immutable singleton object** representing a type with only one possible value.

<!-- end list -->

```javascript
import { tagged } from "styp";

// Constructor for a Point type
const Point = tagged("Point", ["x", "y"]);
const p1 = Point(10, 20);
console.log(p1.x); // -> 10
console.log(p1 instanceof Point); // -> true

// Singleton type (e.g., for a custom null or unit type)
const Nil = tagged("Nil", []);
let temp = Nil;
console.log(Nil.is(temp)); // -> true
console.log(temp.toString()); // -> "Nil"
console.log(Nil.unwrap()); // -> { $type: "Nil" }
```

Instances created by `tagged` constructors are **immutable** (frozen with `Object.freeze`).

-----

### `sum(typename: String, constructors: Object) -> Object`

This function creates a "sum type" (or tagged union), which is a type that can take on one of several distinct forms (variants), each with its own potential fields.

  * `typename`: A string representing the name of the sum type.
  * `constructors`: An object where:
      * Keys are strings representing the names of the variant constructors (e.g., "Some", "None").
      * Values are arrays of strings, representing the field names for that specific variant. An empty array `[]` means the variant has no fields.

**Returns:** An **object** that acts as a namespace for the sum type and its variant constructors.

```javascript
import { sum } from "styp";

const Result = sum("Result", {
    Ok: ["data"],    // Variant 'Ok' with one field 'data'
    Err: ["message"] // Variant 'Err' with one field 'message'
});

const success = Result.Ok("Everything went well!");
const failure = Result.Err("Something broke.");

console.log(success.toString()); // -> Result.Ok(Everything went well!)
console.log(Result.Ok.is(success)); // -> true
console.log(Result.is(failure)); // -> true (it's an instance of the Result sum type)
console.log(failure.unwrap("kind")); // -> { kind: "Err", message: "Something broke." }

const HttpMethod = sum("HttpMethod", {
    GET: [],
    POST: [],
    PUT: [],
    DELETE: []
});

const method = HttpMethod.GET; // 'GET' is a singleton variant
console.log(HttpMethod.GET.toString()); // -> HttpMethod.GET
```

Each variant constructor (e.g., `Result.Ok`) behaves like a type created by `tagged()`. Instances of variants are also **immutable**.

-----

### `match(stype: Object) -> Function`

`⚠️ Note`: It is currently a thin wrapper around the `cata` method, offering a curried pointfree way to structure functions around case analysis. It serves as a placeholder for more advanced pattern matching capabilities planned for future versions of Styp. As such, its API and behavior are subject to significant changes in future releases.

Provides a functional approach for pattern matching on instances of a sum type. It helps ensure that all cases (variants) of a sum type are handled.

  * `stype`: The sum type object created by `sum()`.

**Returns:** A function that takes a `cases` object.
This function, in turn, returns another function that takes an instance of the sum type and applies the matching case.

  * `cases`: An object where:
      * Keys are the names of the variant constructors of the `stype`.
      * Values are functions that will be executed if the instance matches that variant. The function receives the instance (destructured or whole) as an argument.
      * A special key `_` (underscore) can be used as a wildcard or default case. If a specific variant is not listed in `cases` and no wildcard is provided, `match` will throw an error during its setup phase to enforce exhaustive matching. If a wildcard is provided, it must be a function.

<!-- end list -->

```javascript
import { sum, match } from "styp";

const Option = sum("Option", {
    Some: ["value"],
    None: []
});

const describeOption = match(Option)({
    Some: ({ value }) => `It's Some containing: ${value}`,
    None: () => "It's None"
});

const option1 = Option.Some(42);
const option2 = Option.None;

console.log(describeOption(option1)); // -> "It's Some containing: 42"
console.log(describeOption(option2)); // -> "It's None"

// Example with wildcard
const handleResult = match(Result)({ // Assuming 'Result' sum type from previous example
    Ok: ({ data }) => `Success: ${data}`,
    _: (errInstance) => `An error occurred: ${errInstance.message || 'Unknown error'}` // Handles Err
});

console.log(handleResult(Result.Ok("Data loaded")));
console.log(handleResult(Result.Err("Network timeout")));
```

-----

### Methods on Constructors, Sum Types, and Singletons

#### `toString() -> String`

Returns a string representation of the type or constructor.

  * **For Tagged Constructors/Singletons:** `Point.toString()` -\> `"Point"`, `Nil.toString()` -\> `"Nil"`
  * **For Sum Types:** `Result.toString()` -\> `"Result"`
  * **For Variant Constructors:** `Result.Ok.toString()` -\> `"Result.Ok"`

#### `is(obj: Object) -> Boolean`

Checks if the given `obj` is an instance of this specific type/constructor or, for sum types, an instance of any of its variants.

  * **For Tagged Constructors:** `Point.is(p1)`
  * **For Singletons:** `Nil.is(Nil)`
  * **For Sum Types:** `Result.is(success)` (true if `success` is `Result.Ok` or `Result.Err`)
  * **For Variant Constructors:** `Result.Ok.is(success)`

<!-- end list -->

```javascript
import { tagged, sum } from "styp";

const Point = tagged("Point", ["x","y"]);
const p1 = Point(2, 7);
console.log(Point.is(p1));  // -> true
console.log(Point.is({ x:2, y:7 }));  // -> false (not an instance)

const Maybe = sum("Maybe", { Just: ["v"], Nothing: [] });
const mJust = Maybe.Just(10);
console.log(Maybe.is(mJust));       // -> true
console.log(Maybe.Just.is(mJust));  // -> true
console.log(Maybe.Nothing.is(mJust)); // -> false
```

#### `from(obj: Object, typefield: String = "$type") -> Object (Instance)`

  * **For Tagged Constructors (e.g., `Point.from(obj)`)**:

      * Creates an instance of the tagged type from a plain object `obj`.
      * `obj` must contain properties matching the field names defined for the tagged type. Extra properties in `obj` are ignored.
      * The `typefield` parameter is not used by `tagged.from()`.

    <!-- end list -->

    ```javascript
    const Point = tagged("Point", ["x","y"]);
    let pFromObj = Point.from({ x:10, y:3, extra:"ignored" });
    console.log(pFromObj.toString()); // -> Point(10,3)
    ```

  * **For Sum Types (e.g., `Maybe.from(obj, typefield?)`)**:

      * Creates an instance of one of the sum type's variants from a plain object `obj`.
      * `obj` **must** have a property (whose key is specified by `typefield`, defaulting to `"$type"`) that indicates which variant constructor to use. The value of this property must be the name of a variant (e.g., "Just", "Nothing").
      * Other properties of `obj` are used as fields for that variant.

    <!-- end list -->

    ```javascript
    const Maybe = sum("Maybe", { Just: ["value"], Nothing: [] });

    let justInstance = Maybe.from({ $type: "Just", value: 100 });
    console.log(justInstance.toString()); // -> Maybe.Just(100)

    let nothingInstance = Maybe.from({ $type: "Nothing" });
    console.log(nothingInstance.toString()); // -> Maybe.Nothing

    // Using a custom typefield
    let justInstanceCustom = Maybe.from({ kind: "Just", value: 200 }, "kind");
    console.log(justInstanceCustom.toString()); // -> Maybe.Just(200)
    ```

-----

### Methods on Instances

All instances created by `styp` constructors are **immutable** (`Object.freeze()` is applied).

#### `{instance}.toString() -> String`

Returns a string representation of the instance, including its type and field values.

```javascript
const Point = tagged("Point", ["x","y"]);
console.log(Point(5,5).toString()); // -> Point(5,5)

const Maybe = sum("Maybe", { Just: ["val"], Nothing: [] });
console.log(Maybe.Just("hello").toString()); // -> Maybe.Just(hello)
console.log(Maybe.Nothing.toString());     // -> Maybe.Nothing (for singleton variants)
```

#### `{instance}.unwrap(typefield: String = "$type") -> Object`

Returns a new, plain JavaScript object representation of the instance. This is useful for serialization or interop with code that expects plain objects.

  * `typefield`: An optional string specifying the property name in the output object that will hold the type/variant name. Defaults to `"$type"`.

  * **For instances of `tagged` types**: The `typefield` property in the result will be the `typename` (e.g., "Point").

  * **For instances of `sum` type variants**: The `typefield` property in the result will be the **variant's constructor name / tag** (e.g., "Just", "Err").

<!-- end list -->

```javascript
const Point = tagged("Point", ["x", "y"]);
const p = Point(10, 20);
console.log(p.unwrap()); // -> { $type: "Point", x: 10, y: 20 }
console.log(p.unwrap("kind")); // -> { kind: "Point", x: 10, y: 20 }

const Option = sum("Option", { Some: ["value"], None: [] });
const someVal = Option.Some(42);
const noVal = Option.None;

console.log(someVal.unwrap()); // -> { $type: "Some", value: 42 }
console.log(noVal.unwrap());   // -> { $type: "None" }
```

#### `{sumInstance}.cata(cases: Object) -> any`
(Available only on instances of variants from a `sum` type).

Performs case analysis (matching based on the variant type) on the instance. `cata` is short for catamorphism. It allows you to execute different code paths depending on the specific variant of the sum type instance.

  * `cases`: An object where:
      * Keys are the names of the variant constructors (e.g., "Just", "Nothing").
      * Values are functions that will be executed if the instance matches that variant. The function receives the instance (you can destructure its fields) as an argument.
      * A special key `_` (underscore) can be used as a wildcard or default case if not all variants are explicitly handled.
      * If the instance's variant is not found in `cases` and no `_` wildcard is provided, `cata` will throw an error.

<!-- end list -->

```javascript
const Result = sum("Result", { Ok: ["data"], Err: ["error"] });

let success = Result.Ok("Data processed!");
let appError = Result.Err("Failed to load resource");

function handleResult(res) {
    return res.cata({
        Ok: ({ data }) => `Success: ${data}`,
        Err: ({ error }) => `Failure: ${error}`
    });
}

console.log(handleResult(success));  // -> Success: Data processed!
console.log(handleResult(appError)); // -> Failure: Failed to load resource

// With wildcard
function getMessageOrDefault(res) {
    return res.cata({
        Ok: ({ data }) => data,
        _: () => "No specific data found." // Handles Err or any other variant
    });
}
console.log(getMessageOrDefault(success)); // -> "Data processed!"
console.log(getMessageOrDefault(appError)); // -> "No specific data found."
```

### Extending Prototypes

You can add methods to the `prototype` of constructor functions (from `tagged` or variants within `sum`) to provide shared behavior for all instances of that type.

```javascript
import { tagged, sum } from "styp";

const Point = tagged("Point", ["x", "y"]);

Point.prototype.scale = function(n) {
    return Point(this.x * n, this.y * n); // Create a new instance
}
console.log(Point(5, 5).scale(2).toString()); // -> Point(10,10)

const Option = sum("Option", { Some: ["x"], None: [] });

// Add map to the Option sum type's prototype
Option.prototype.map = function(fn) {
    return this.cata({
        Some: ({ x }) => Option.Some(fn(x)),
        None: () => Option.None // or `this` if you prefer
    });
};

let anOption = Option.Some(5);
console.log(anOption.map(v => v * 2).toString()); // -> Option.Some(10)
console.log(Option.None.map(v => v * 2).toString()); // -> Option.None
```

-----