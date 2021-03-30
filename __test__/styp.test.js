const { tagged, sum } = require('../dist/styp.min')

// add more tests
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
        Var: x => x,
        App: x => x,
        Lit: x => x.val,
        Lam: x => x,
        Cond: x => x,
        Let: x => x,
        BinOp: x => x,
        UnOp: x => x,
        Pair: x => x,
        Fix: x => x,
    })).toEqual(false);

    expect(Expr.Lit("bool", true).cata({
        Var: x => x,
        App: x => x,
        Lit: x => x.val,
        Lam: x => x,
        Cond: x => x,
        Let: x => x,
        BinOp: x => x,
        UnOp: x => x,
        Pair: x => x,
        Fix: x => x,
    })).toEqual(true);

    expect(Expr.Lit("null", null).cata({
        Var: x => x,
        App: x => x,
        Lit: x => x.val,
        Lam: x => x,
        Cond: x => x,
        Let: x => x,
        BinOp: x => x,
        UnOp: x => x,
        Pair: x => x,
        Fix: x => x,
    })).toEqual(null);

    expect(Expr.Lit("undef", undefined).cata({
        Var: x => x,
        App: x => x,
        Lit: x => x.val,
        Lam: x => x,
        Cond: x => x,
        Let: x => x,
        BinOp: x => x,
        UnOp: x => x,
        Pair: x => x,
        Fix: x => x,
    })).toEqual(undefined);

    expect(Expr.Lit("temp", [true,false]).cata({
        Var: x => x,
        App: x => x,
        Lit: x => x.val,
        Lam: x => x,
        Cond: x => x,
        Let: x => x,
        BinOp: x => x,
        UnOp: x => x,
        Pair: x => x,
        Fix: x => x,
    })).toEqual([true,false]);
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
    expect(Option.None.is(temp)).toEqual(true)
});