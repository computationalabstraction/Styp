const { tagged, sum, match } = require('../dist/styp.cjs');

describe('styp', () => {
  describe('Testing Examples', () => {
    test('styp.tagged', () => {
      const Point3D = tagged("Point3D", ["x", "y", "z"])
      const a = Point3D(1, 2, 3)
      expect(Point3D.toString()).toEqual("Point3D")
      expect(a).toEqual({ x: 1, y: 2, z: 3 })
      expect(a.x == 1 && a.y == 2 && a.z == 3).toEqual(true)
      expect(a.toString()).toEqual("Point3D(1,2,3)")
      expect(Point3D.is(a)).toEqual(true)
      Point3D.prototype.scale = function (n) {
        return Point3D(this.x * n, this.y * n, this.z * n)
      }
      const b = a.scale(2)
      expect(b.toString()).toEqual("Point3D(2,4,6)")
      const c = Point3D.from({ y: 2, x: 1, z: 3 })
      expect(c).toEqual({ x: 1, y: 2, z: 3 })
      expect(c.toString()).toEqual("Point3D(1,2,3)")
      expect(() => {
        Point3D(1, 2)
      }).toThrow(TypeError);
    });

    test('styp.sum', () => {
      const Option = sum("Option", {
        Some: ["x"],
        None: []
      });
      let temp = Option.Some(10);
      expect(temp.toString()).toEqual("Option.Some(10)");
      expect(Option.None.toString()).toEqual("Option.None");
      expect(Option.is(temp)).toEqual(true);
      expect(Option.is({})).toEqual(false);
      expect(Option.Some.is(temp)).toEqual(true);
      expect(Option.None.is(Option.None)).toEqual(true);
      Option.prototype.map = function (f) {
        return this.cata({
          Some: ({ x }) => Option.Some(f(x)),
          None: () => this
        });
      }
      temp = temp.map(x => x * 2);
      expect(temp.toString()).toEqual("Option.Some(20)")
      temp = Option.None.map(x => x * 2);
      expect(Option.None.is(temp)).toEqual(true);

      const Expr = sum("Expr", {
        Var: ["name"],
        App: ["e1", "e2"],
        Lit: ["type", "val"],
        Lam: ["param", "body"],
        Cond: ["cond", "e1", "e2"],
        Let: ["name", "e1", "e2"],
        BinOp: ["op", "l", "r"],
        UnOp: ["op", "v"],
        Pair: ["fst", "snd"],
        Fix: ["e"]
      });

      expect(Expr.Lit("bool", false).cata({
        Lit: x => x.val,
        _: x => x
      })).toEqual(false);

      expect(Expr.Lit("bool", true).cata({

        Lit: x => x.val,
        _: x => x
      })).toEqual(true);

      expect(Expr.Lit("null", null).cata({
        Lit: x => x.val,
        _: x => x
      })).toEqual(null);

      expect(Expr.Lit("undef", undefined).cata({
        Lit: x => x.val,
        _: x => x
      })).toEqual(undefined);

      expect(Expr.Lit("temp", [true, false]).cata({
        Lit: x => x.val,
        _: x => x
      })).toEqual([true, false]);
    });
  });

  describe('tagged(typename, fields)', () => {
    describe('Valid Inputs and Basic Functionality', () => {
      const Point = tagged("Point", ["x", "y"]);
      const Color = tagged("Color", ["r", "g", "b", "a"]);
      const Unit = tagged("Unit", []); // Singleton

      test('constructor function properties', () => {
        expect(typeof Point).toBe('function');
        expect(Point.prototype).toBeDefined();
        expect(Point.toString()).toBe("Point");
        expect(Color.toString()).toBe("Color");
      });

      test('singleton type properties', () => {
        expect(typeof Unit).toBe('object');
        expect(Unit.toString()).toBe("Unit");
      });

      test('instance creation with new keyword', () => {
        const p1 = new Point(10, 20);
        expect(p1.x).toBe(10);
        expect(p1.y).toBe(20);
        expect(p1 instanceof Point).toBe(true);
      });

      test('instance creation without new keyword (if supported by constructor logic)', () => {
        const p1 = Point(10, 20);
        expect(p1.x).toBe(10);
        expect(p1.y).toBe(20);
        expect(p1 instanceof Point).toBe(true);
      });

      test('instance properties are correct and enumerable', () => {
        const p1 = Point(1, 2);
        expect(p1).toHaveProperty('x', 1);
        expect(p1).toHaveProperty('y', 2);
        expect(p1).toEqual({ x: 1, y: 2 });
        expect(Object.keys(p1)).toEqual(['x', 'y']);
      });

      test('instance properties are immutable (non-writable)', () => {
        "use strict";
        const p1 = Point(5, 5);
        expect(() => { p1.x = 10; }).toThrow(TypeError);
        expect(p1.x).toBe(5);
      });

      test('instance toString() method', () => {
        const p1 = Point(3, 4);
        expect(p1.toString()).toBe("Point(3,4)");
        const c1 = Color(255, 0, 128, 1);
        expect(c1.toString()).toBe("Color(255,0,128,1)");
      });

      test('constructor is() method', () => {
        const p1 = Point(0, 0);
        const c1 = Color(0, 0, 0, 0);
        expect(Point.is(p1)).toBe(true);
        expect(Point.is(c1)).toBe(false);
        expect(Point.is(null)).toBe(false);
        expect(Point.is(undefined)).toBe(false);
        expect(Point.is({})).toBe(false);
        expect(Point.is(Unit)).toBe(false);
      });

      test('singleton is() method', () => {
        const SameUnit = Unit;
        const OtherSingleton = tagged("OtherUnit", []);
        expect(Unit.is(Unit)).toBe(true);
        expect(Unit.is(SameUnit)).toBe(true);
        expect(Unit.is(null)).toBe(false);
        expect(Unit.is({})).toBe(false);
        expect(Unit.is(OtherSingleton)).toBe(false);
      });

      test('constructor from() method', () => {
        const pSource = { x: 7, y: 8, z: 9 };
        const p1 = Point.from(pSource);
        expect(p1 instanceof Point).toBe(true);
        expect(p1.x).toBe(7);
        expect(p1.y).toBe(8);
        expect(p1).not.toHaveProperty('z');
        expect(p1.toString()).toBe("Point(7,8)");

        const cSource = { r: 10, g: 20, b: 30, a: 0.5 };
        const c1 = Color.from(cSource);
        expect(c1).toEqual({ r: 10, g: 20, b: 30, a: 0.5 });
      });

      test('instance unwrap() method', () => {
        const p1 = Point(15, 25);
        const unwrappedP1 = p1.unwrap();
        expect(unwrappedP1).toEqual({ $type: "Point", x: 15, y: 25 });
        expect(Object.getPrototypeOf(unwrappedP1)).toBe(Object.prototype);

        const unwrappedUnit = Unit.unwrap();
        expect(unwrappedUnit).toEqual({ $type: "Unit" });
      });

      test('different tagged types are distinct', () => {
        const PointAgain = tagged("Point", ["x", "y"]);
        const p1 = Point(1, 1);
        const p2 = PointAgain(1, 1);
        expect(Point.is(p1)).toBe(true);
        expect(PointAgain.is(p2)).toBe(true);
        expect(Point.is(p2)).toBe(false);
        expect(p1 instanceof Point).toBe(true);
        expect(p2 instanceof PointAgain).toBe(true);
        expect(p1 instanceof PointAgain).toBe(false);
      });

      test('field values can be various types', () => {
        const ComplexType = tagged("Complex", ["s", "n", "b", "nul", "undef", "arr", "obj"]);
        const arr = [1, 2];
        const obj = { a: 1 };
        const instance = ComplexType("str", 10, true, null, undefined, arr, obj);
        expect(instance.s).toBe("str");
        expect(instance.n).toBe(10);
        expect(instance.b).toBe(true);
        expect(instance.nul).toBeNull();
        expect(instance.undef).toBeUndefined();
        expect(instance.arr).toBe(arr);
        expect(instance.obj).toBe(obj);
        expect(instance.toString()).toBe("Complex(str,10,true,null,undefined,1,2,[object Object])");
      });
    });

    describe('Error Handling and Edge Cases for tagged()', () => {
      test('throws TypeError for invalid typename', () => {
        expect(() => tagged(123, ["x"])).toThrow(TypeError);
        expect(() => tagged("", ["x"])).toThrow(TypeError);
        expect(() => tagged(null, ["x"])).toThrow(TypeError);
      });

      test('throws TypeError for invalid fields argument', () => {
        expect(() => tagged("Test", "not-an-array")).toThrow(TypeError);
        expect(() => tagged("Test", null)).toThrow(TypeError);
        expect(() => tagged("Test", [123])).toThrow(TypeError);
      });

      test('constructor throws TypeError for incorrect number of arguments', () => {
        const TestType = tagged("TestType", ["a", "b"]);
        expect(() => TestType(1)).toThrow(TypeError);
        expect(() => TestType(1, 2, 3)).toThrow(TypeError);
        expect(() => new TestType(1)).toThrow(TypeError);
      });

      test('from() throws TypeError if argument is not an object', () => {
        const TestType = tagged("TestType", ["a"]);
        expect(() => TestType.from(null)).toThrow(TypeError);
        expect(() => TestType.from(undefined)).toThrow(TypeError);
        expect(() => TestType.from(123)).toThrow(TypeError);
      });

      test('from() throws TypeError if fields are missing from input object', () => {
        const TestType = tagged("TestType", ["a", "b"]);
        expect(() => TestType.from({ a: 1 })).toThrow(TypeError);
        expect(() => TestType.from({})).toThrow(TypeError);
      });

      // Not applicable -----
      // test('prototype properties are not writable/configurable', () => {
      //   const ProtoTest = tagged("ProtoTest", ["val"]);
      //   const originalToString = ProtoTest.prototype.toString;
      //   expect(() => { ProtoTest.prototype.toString = () => "hacked"; }).toThrow();
      //   expect(ProtoTest.prototype.toString).toBe(originalToString);
      // });

      // test('tagged type with no fields (singleton) does not have .from', () => {
      //   const SingletonNoFrom = tagged("SingletonNoFrom", []);
      //   expect(SingletonNoFrom.from).toBeUndefined(); // Or should it throw? Current _tagged doesn't add .from for singletons
      // });
      // ------
    });
  });

  describe('sum(typename, constructors)', () => {
    const Option = sum("Option", {
      Some: ["value"],
      None: []
    });

    const Result = sum("Result", {
      Ok: ["data"],
      Err: ["error"]
    });

    const EmptySum = sum("EmptySum", {});

    describe('Valid Inputs and Basic Functionality', () => {
      test('sum type object properties', () => {
        expect(typeof Option).toBe('object');
        expect(Option.toString()).toBe("Option");
        expect(typeof Option.Some).toBe('function');
        expect(typeof Option.None).toBe('object');

        expect(typeof Result.Ok).toBe('function');
        expect(typeof Result.Err).toBe('function');
      });

      test('variant constructors behave like tagged types', () => {
        expect(Option.Some.toString()).toBe("Option.Some");
        expect(Option.None.toString()).toBe("Option.None");

        const s1 = Option.Some(10);
        expect(s1.value).toBe(10);
        expect(s1.toString()).toBe("Option.Some(10)");
        expect(s1 instanceof Option.Some).toBe(true);

        const n1 = Option.None;
        expect(n1 instanceof Option.None).toBe(true);
        expect(Option.None.is(n1)).toBe(true);
      });

      test('instances of variants are immutable', () => {
        "use strict";
        const s1 = Option.Some(100);
        expect(() => { s1.value = 200; }).toThrow(TypeError);
        expect(s1.value).toBe(100);
      });

      test('sum type is() method', () => {
        const s1 = Option.Some(1);
        const n1 = Option.None;
        const rOk = Result.Ok("data");

        expect(Option.is(s1)).toBe(true);
        expect(Option.is(n1)).toBe(true);
        expect(Option.is(rOk)).toBe(false);
        expect(Option.is(null)).toBe(false);
        expect(Option.is({})).toBe(false);
      });

      test('variant constructor is() method', () => {
        const s1 = Option.Some(1);
        const n1 = Option.None;
        expect(Option.Some.is(s1)).toBe(true);
        expect(Option.Some.is(n1)).toBe(false);
        expect(Option.None.is(n1)).toBe(true);
        expect(Option.None.is(s1)).toBe(false);
      });

      test('sum type from() method', () => {
        const sFrom = Option.from({ $type: "Some", value: 123 });
        expect(Option.Some.is(sFrom)).toBe(true);
        expect(sFrom.value).toBe(123);

        const nFrom = Option.from({ $type: "None" });
        expect(Option.None.is(nFrom)).toBe(true);

        const rFrom = Result.from({ $type: "Err", error: "failure" });
        expect(Result.Err.is(rFrom)).toBe(true);
        expect(rFrom.error).toBe("failure");
      });

      test('instance cata() method - exhaustive', () => {
        const s1 = Option.Some(50);
        const n1 = Option.None;

        const processOption = (opt) => opt.cata({
          Some: ({ value }) => `Some(${value})`,
          None: () => "NoneValue"
        });

        expect(processOption(s1)).toBe("Some(50)");
        expect(processOption(n1)).toBe("NoneValue");
      });

      test('instance cata() method - with wildcard', () => {
        const rOk = Result.Ok("success");
        const rErr = Result.Err("oops");

        const processResult = (res) => res.cata({
          Ok: ({ data }) => `OK: ${data}`,
          _: (inst) => `Error or other: ${inst.error}`
        });
        expect(processResult(rOk)).toBe("OK: success");
        expect(processResult(rErr)).toBe("Error or other: oops");
      });

      test('instance unwrap() method for sum type variants', () => {
        const s1 = Option.Some("hello");
        expect(s1.unwrap()).toEqual({ $type: "Some", value: "hello" }); // type should be the $tag

        const n1 = Option.None;
        expect(n1.unwrap()).toEqual({ $type: "None" });
      });

      test('prototype chain for variants', () => {
        const s1 = Option.Some(1);
        expect(Object.getPrototypeOf(s1)).toBe(Option.Some.prototype);
        expect(Object.getPrototypeOf(Option.Some.prototype)).toBe(Option.prototype);
        expect(Object.getPrototypeOf(Object.getPrototypeOf(Option.None))).toBe(Option.prototype);
      });

      test('sum type with many variants and fields', () => {
        const Many = sum("Many", {
          A: [], B: ["b1"], C: ["c1", "c2"], D: [], E: ["e1", "e2", "e3"]
        });
        const instB = Many.B("valB");
        const instC = Many.C(1, 2);
        expect(Many.B.is(instB)).toBe(true);
        expect(instB.b1).toBe("valB");
        expect(Many.C.is(instC)).toBe(true);
        expect(instC.c2).toBe(2);
        expect(Many.A.is(Many.A)).toBe(true);
      });
    });

    describe('Error Handling and Edge Cases for sum()', () => {
      test('throws TypeError for invalid sum typename', () => {
        expect(() => sum(123, {})).toThrow(TypeError);
        expect(() => sum("", {})).toThrow(TypeError);
      });

      test('throws TypeError for invalid constructors object', () => {
        expect(() => sum("TestSum", null)).toThrow(TypeError);
        expect(() => sum("TestSum", "not-an-object")).toThrow(TypeError);
        expect(() => sum("TestSum", [])).toThrow(TypeError);
      });

      test('throws TypeError for invalid constructor names', () => {
        expect(() => sum("TestSum", { "_": [] })).toThrow(TypeError); // Underscore
        // Duplicate name check needs to be internal to sum or _tagged if variants share a namespace
        // The current sum implementation checks if `cons in stype` which covers this.
        // expect(() => sum("TestSum", { "A": [], "A": ["x"] })).toThrow(); // Javascript object literals override, hard to test this way
        expect(() => sum("TestSum", { "TestSum": [] })).toThrow(TypeError); // Name same as sum type
      });

      test('throws TypeError if constructor field definition is not an array', () => {
        expect(() => sum("TestSum", { "VariantA": "not-an-array" })).toThrow(TypeError);
      });

      test('sum type from() error handling', () => {
        expect(() => Option.from(null)).toThrow(TypeError);
        expect(() => Option.from({})).toThrow(TypeError);
        expect(() => Option.from({ type: "NonExistent" })).toThrow(TypeError);
        expect(() => Option.from({ type: "Some" })).toThrow(TypeError);
        expect(() => Option.from({ type: 123 })).toThrow(TypeError);
      });

      test('instance cata() error handling', () => {
        const s1 = Option.Some(1);
        expect(() => s1.cata({})).toThrow(Error);
        expect(() => s1.cata({ Some: "not-a-function" })).toThrow(Error);
        expect(() => s1.cata({ None: () => { }, _: "not-a-function" })).toThrow(Error);
      });

      test('sum type with no constructors', () => {
        expect(EmptySum.toString()).toBe("EmptySum");
        expect(EmptySum.is(null)).toBe(false);
        expect(() => EmptySum.from({ type: "A" })).toThrow(TypeError);
      });
    });
  });

  describe('Structural Typing with `structural` flag and instanceof', () => {
    describe('tagged() - structural vs. nominal instanceof', () => {
      const NominalPoint = tagged("NominalPoint", ["x", "y"]);
      const StructuralPoint = tagged("StructuralPoint", ["x", "y"], true); // structural = true
      const AnotherNominalPoint = tagged("AnotherNominalPoint", ["x", "y"]);
      const DifferentShape = tagged("DifferentShape", ["a", "b"]);

      const np1 = NominalPoint(1, 2);
      const sp1 = StructuralPoint(1, 2);
      const anp1 = AnotherNominalPoint(1, 2);
      const plainObjXY = { x: 1, y: 2 };
      const plainObjAB = { a: 1, b: 2 };
      const plainObjWithExtra = { x: 1, y: 2, z: 3 };
      const plainObjMissing = { x: 1 };

      test('Nominal tagged type instanceof checks', () => {
        expect(np1 instanceof NominalPoint).toBe(true);
        expect(sp1 instanceof NominalPoint).toBe(false);
        expect(anp1 instanceof NominalPoint).toBe(false);
        expect(plainObjXY instanceof NominalPoint).toBe(false);
      });

      test('Structural tagged type instanceof checks', () => {
        expect(sp1 instanceof StructuralPoint).toBe(true);
        expect(np1 instanceof StructuralPoint).toBe(true);
        expect(anp1 instanceof StructuralPoint).toBe(true);
        expect(plainObjXY instanceof StructuralPoint).toBe(true);
        expect(plainObjWithExtra instanceof StructuralPoint).toBe(true);
        expect(plainObjMissing instanceof StructuralPoint).toBe(false);
        expect(plainObjAB instanceof StructuralPoint).toBe(false);
        expect(null instanceof StructuralPoint).toBe(false);
        expect(undefined instanceof StructuralPoint).toBe(false);
        expect(DifferentShape(1, 2) instanceof StructuralPoint).toBe(false);
      });

      test('Nominal tagged type .is() checks (should align with nominal instanceof)', () => {
        expect(NominalPoint.is(np1)).toBe(true);
        expect(NominalPoint.is(sp1)).toBe(false);
      });

      test('Structural tagged type .is() checks (should align with structural instanceof)', () => {
        expect(StructuralPoint.is(sp1)).toBe(true);
        expect(StructuralPoint.is(np1)).toBe(true);
        expect(StructuralPoint.is(plainObjXY)).toBe(true);
      });

      const NominalUnitS = tagged("NominalUnitS", [], false);
      const StructuralUnitS = tagged("StructuralUnitS", [], true);

      test('Nominal singleton instanceof checks', () => {
        expect(NominalUnitS instanceof NominalUnitS).toBe(true);
        expect(StructuralUnitS instanceof NominalUnitS).toBe(false);
        expect({} instanceof NominalUnitS).toBe(false);
      });

      test('Structural singleton instanceof checks (field presence is key, empty schema means any object with no *required* fields matches)', () => {
        expect(StructuralUnitS instanceof StructuralUnitS).toBe(true);
        expect(NominalUnitS instanceof StructuralUnitS).toBe(true);
        expect({} instanceof StructuralUnitS).toBe(true);
        expect({ a: 1 } instanceof StructuralUnitS).toBe(true);
        expect(null instanceof StructuralUnitS).toBe(false);
      });
    });

    describe('sum() - structural vs. nominal instanceof', () => {
      const NomOption = sum("NomOption", {
        Some: ["value"],
        None: []
      }, false);

      const StructOption = sum("StructOption", {
        Some: ["value"],
        None: []
      }, true);

      const nomSome = NomOption.Some(10);
      const nomNone = NomOption.None;
      const structSome = StructOption.Some(10);
      const structNone = StructOption.None;
      const plainObjValue = { value: 10 };
      const plainObjEmpty = {};

      test('Nominal sum type (NomOption) instanceof checks for the sum type itself', () => {
        expect(nomSome instanceof NomOption).toBe(true);
        expect(nomNone instanceof NomOption).toBe(true);
        expect(structSome instanceof NomOption).toBe(false);
        expect(plainObjValue instanceof NomOption).toBe(false);
      });

      test('Structural sum type (StructOption) instanceof checks for the sum type itself', () => {
        expect(structSome instanceof StructOption).toBe(true);
        expect(structNone instanceof StructOption).toBe(true);

        expect(nomSome instanceof StructOption).toBe(true);

        expect(nomNone instanceof StructOption).toBe(true);

        expect(plainObjValue instanceof StructOption).toBe(true);
        expect(plainObjEmpty instanceof StructOption).toBe(true);
        expect({ unrelated: 1 } instanceof StructOption).toBe(true);

        const AnotherStructType = tagged("AnotherStruct", ["value"], true);
        const anotherStructInstance = AnotherStructType(100);
        expect(anotherStructInstance instanceof StructOption).toBe(true);

        const MismatchedStructType = tagged("MismatchedStruct", ["val"], true);
        const mismatchedInstance = MismatchedStructType(100);
        expect(mismatchedInstance instanceof StructOption).toBe(true); // Matches None (singleton matches any object)
      });

      test('Nominal sum type variant (NomOption.Some) instanceof checks', () => {
        expect(nomSome instanceof NomOption.Some).toBe(true);
        expect(structSome instanceof NomOption.Some).toBe(false);
        expect(plainObjValue instanceof NomOption.Some).toBe(false);
      });

      test('Structural sum type variant (StructOption.Some) instanceof checks', () => {
        expect(structSome instanceof StructOption.Some).toBe(true);
        expect(nomSome instanceof StructOption.Some).toBe(true);
        expect(plainObjValue instanceof StructOption.Some).toBe(true);
        expect({ value: 20, extra: 1 } instanceof StructOption.Some).toBe(true);
        expect({ val: 10 } instanceof StructOption.Some).toBe(false);
        expect(structNone instanceof StructOption.Some).toBe(false);
      });

      test('Structural sum type singleton variant (StructOption.None) instanceof checks', () => {
        expect(structNone instanceof StructOption.None).toBe(true);
        expect(nomNone instanceof StructOption.None).toBe(true);
        expect(plainObjEmpty instanceof StructOption.None).toBe(true);
        expect(plainObjValue instanceof StructOption.None).toBe(true);
        expect(null instanceof StructOption.None).toBe(false);
      });

      // Test interaction with .is()
      test('Nominal sum type .is() checks', () => {
        expect(NomOption.is(nomSome)).toBe(true);
        expect(NomOption.is(structSome)).toBe(false);
        expect(NomOption.Some.is(nomSome)).toBe(true);
        expect(NomOption.Some.is(structSome)).toBe(false);
      });

      test('Structural sum type .is() checks (relies on instanceof)', () => {
        expect(StructOption.is(structSome)).toBe(true);
        expect(StructOption.is(nomSome)).toBe(true);
        expect(StructOption.is(plainObjValue)).toBe(true);

        expect(StructOption.Some.is(structSome)).toBe(true);
        expect(StructOption.Some.is(nomSome)).toBe(true);
        expect(StructOption.Some.is(plainObjValue)).toBe(true);
      });
    });

    describe('Structural checks with different field orders in plain objects', () => {
      const StructuralOrder = tagged("StructuralOrder", ["a", "b", "c"], true);
      const objABC = { a: 1, b: 2, c: 3 };
      const objCBA = { c: 3, b: 2, a: 1 };
      const objBAC = { b: 2, a: 1, c: 3 };

      test('instanceof should not depend on field order in plain objects for structural types', () => {
        expect(objABC instanceof StructuralOrder).toBe(true);
        expect(objCBA instanceof StructuralOrder).toBe(true);
        expect(objBAC instanceof StructuralOrder).toBe(true);
      });
    });

  //   describe('Structural checks with prototypal inheritance in plain objects', () => {
  //     const StructuralProto = tagged("StructuralProto", ["x", "y"], true);
  //     const parentObj = { x: 1 };
  //     const childObj = Object.create(parentObj);
  //     childObj.y = 2; // x is on parent, y is on child

  //     const childObjOwn = { x: 1, y: 2 }; // All own properties

  //     test('instanceof structural check should find properties on prototype chain', () => {
  //       expect(childObj instanceof StructuralProto).toBe(true);
  //       expect(childObjOwn instanceof StructuralProto).toBe(true);
  //     });

  //     const StructuralStrictOwn = tagged("StructuralStrictOwn", ["x", "y"], true);
  //     // If you wanted a structural check that ONLY considers own properties:
  //     // You'd have to modify Symbol.hasInstance to use instance.hasOwnProperty(field)
  //     // For now, we test the current behavior (using 'in').
  //   });
  });

  describe('match(stype)', () => {
    const Option = sum("Option", {
      Some: ["value"],
      None: []
    });
    const EmptySum = sum("EmptySumForMatch", {});

    describe('Valid Usage', () => {
      const matchOption = match(Option);

      test('creates a matcher function', () => {
        expect(typeof matchOption).toBe('function');
      });

      test('matcher function requires cases object', () => {
        const handleCases = matchOption({
          Some: ({ value }) => value,
          None: () => "default"
        });
        expect(typeof handleCases).toBe('function');
      });

      test('executes correct case for variant', () => {
        const handleCases = matchOption({
          Some: ({ value }) => `Is Some: ${value}`,
          None: () => "Is None"
        });
        expect(handleCases(Option.Some(10))).toBe("Is Some: 10");
        expect(handleCases(Option.None)).toBe("Is None");
      });

      test('executes wildcard case', () => {
        const handleCases = matchOption({
          Some: ({ value }) => value,
          _: () => "wildcard hit"
        });
        expect(handleCases(Option.Some(20))).toBe(20);
        expect(handleCases(Option.None)).toBe("wildcard hit");
      });

      test('constraints argument does not affect behavior (as currently implemented)', () => {
        const matchOptionWithConstraints = match(Option, "constraint1", 123);
        const handleCases = matchOptionWithConstraints({
          Some: ({ value }) => value,
          None: () => "default"
        });
        expect(handleCases(Option.Some(5))).toBe(5);
      });
    });

    describe('Error Handling for match()', () => {
      test('throws TypeError if stype is not a valid sum type', () => {
        expect(() => match(null)).toThrow(TypeError);
        expect(() => match({})).toThrow(TypeError);
        expect(() => match(tagged("Point", []))).toThrow(TypeError);
      });

      test('throws TypeError if sum type has no constructors', () => {
        expect(() => match(EmptySum)).toThrow(TypeError);
      });

      test('throws TypeError if cases object is not provided or not an object', () => {
        const matchOption = match(Option);
        expect(() => matchOption()).toThrow(TypeError);
        expect(() => matchOption(null)).toThrow(TypeError);
        expect(() => matchOption("not-an-object")).toThrow(TypeError);
      });

      test('throws TypeError for non-exhaustive cases (no wildcard)', () => {
        const matchOption = match(Option);
        expect(() => matchOption({ Some: () => { } })).toThrow(TypeError);
      });

      test('throws TypeError if a case handler is not a function', () => {
        const matchOption = match(Option);
        expect(() => matchOption({ Some: "not-a-function", None: () => { } })).toThrow(TypeError);
        expect(() => matchOption({ Some: () => { }, _: "not-a-function-wildcard" })).toThrow(TypeError);
      });

      test('matcher execution throws TypeError if node is not an instance of the sum type', () => {
        const matchOption = match(Option);
        const handleCases = matchOption({ Some: () => { }, None: () => { } });
        const AnotherSum = sum("Another", { Variant: [] });

        expect(() => handleCases(null)).toThrow(TypeError);
        expect(() => handleCases({})).toThrow(TypeError);
        expect(() => handleCases(AnotherSum.Variant)).toThrow(TypeError);
      });
    });
  });

  describe('General Immutability and Integrity', () => {
    test('attempting to modify internal Symbol-keyed properties on prototypes should fail silently or throw', () => {
      const TestType = tagged("TestImm", ["a"]);
      // This is hard to test directly without exporting symbols.
      // We rely on 'prop' using defineProperty with configurable:false.
      // A direct attempt like TestType.prototype[Symbol.for("Type")] = "Hacked";
      // might not throw if the symbol isn't identical, or might work if it's a new property.
      // The protection is against accidental overwrite of the *exact* symbol-keyed property.
      const originalTypeName = TestType.prototype[Object.getOwnPropertySymbols(TestType.prototype).find(s => s.toString() === 'Symbol(_styp_Type)')];
      try {
        TestType.prototype[Object.getOwnPropertySymbols(TestType.prototype).find(s => s.toString() === 'Symbol(_styp_Type)')] = "Hacked";
      } catch (e) {
        // Expected to throw or be prevented
      }
      expect(TestType.prototype[Object.getOwnPropertySymbols(TestType.prototype).find(s => s.toString() === 'Symbol(_styp_Type)')]).toBe(originalTypeName);

    });

    test('Object.freeze on instances prevents adding new properties', () => {
      "use strict";
      const p = tagged("P", ["x"])(1);
      expect(() => { p.newProp = 123; }).toThrow(TypeError);
      expect(p.newProp).toBeUndefined();
    });
  });
});