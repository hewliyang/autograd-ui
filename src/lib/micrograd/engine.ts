import { v4 as uuidv4 } from "uuid";

export type Meta = {
  _children?: Value[];
  _op?: string;
  label?: string;
};

// store backprop info in queue for lazy visualization
export type BackwardInfo = {
  src: string; // src node
  dst: string; // dst node in reverse (<-)
  arithmetic: string; // concated string of the operation & operand
};

export class Value {
  uid: string;
  val: number;
  grad: number;
  label: string;
  // _backward is a void function, but for the sake of
  // visualisation we return the string representation of
  // the arithmetic that is happening internally
  _backward: () => Array<BackwardInfo> | void;
  _prev: Set<Value>;
  _op: string;

  constructor(
    val: number,
    { _children = [], _op = "", label = "" }: Meta = {}
  ) {
    this.uid = uuidv4();
    this.val = val;
    this.grad = 0.0;
    this.label = label;
    this._backward = () => {};
    this._prev = new Set(_children);
    this._op = _op;
  }

  add(_other: Value | number): Value {
    let other = _other instanceof Value ? _other : new Value(_other);
    const out = new Value(this.val + other.val, {
      _children: [this, other],
      _op: "+",
    });

    out._backward = () => {
      const math = [
        {
          src: out.uid,
          dst: this.uid,
          arithmetic: `${this.grad.toFixed(2)}+${out.grad.toFixed(2)}`,
        },
        {
          src: out.uid,
          dst: other.uid,
          arithmetic: `${other.grad.toFixed(2)}+${out.grad.toFixed(2)}`,
        },
      ];
      this.grad += out.grad;
      other.grad += out.grad;
      return math;
    };

    return out;
  }

  mul(_other: Value | number): Value {
    let other = _other instanceof Value ? _other : new Value(_other);
    const out = new Value(this.val * other.val, {
      _children: [this, other],
      _op: "*",
    });

    out._backward = () => {
      this.grad += other.val * out.grad;
      other.grad += this.val * out.grad;
      return [
        {
          src: out.uid,
          dst: this.uid,
          arithmetic: `${other.val.toFixed(2)}*${out.grad.toFixed(2)}`,
        },
        {
          src: out.uid,
          dst: other.uid,
          arithmetic: `${this.val.toFixed(2)}*${out.grad.toFixed(2)}`,
        },
      ];
    };

    return out;
  }

  pow(_other: number): Value {
    const out = new Value(this.val ** _other, {
      _children: [this],
      _op: `**${_other}`,
    });

    out._backward = () => {
      this.grad += _other * this.val ** (_other - 1) * out.grad;
      return [
        {
          src: out.uid,
          dst: this.uid,
          arithmetic: `(${_other}*${this.val.toFixed(2)})^{${_other.toFixed(
            2
          )}-1*${out.grad.toFixed(2)}}`,
        },
      ];
    };

    return out;
  }

  relu(): Value {
    const x = this.val;
    const out = new Value(x < 0 ? 0 : x, { _children: [this], _op: "ReLU" });

    out._backward = () => {
      this.grad += Number(out.val > 0) * out.grad;
      return [
        {
          src: out.uid,
          dst: this.uid,
          arithmetic: `${Number(out.val > 0)}*${out.grad.toFixed(2)}`,
        },
      ];
    };

    return out;
  }

  exp(): Value {
    const x = this.val;
    const out = new Value(Math.exp(x), { _children: [this], _op: "exp" });

    out._backward = () => {
      this.grad += out.val * out.grad;

      return [
        {
          src: out.uid,
          dst: this.uid,
          arithmetic: `${out.val.toFixed(2)}*${out.grad.toFixed(2)}`,
        },
      ];
    };

    return out;
  }

  tanh(): Value {
    const x = this.val;
    const t = (Math.exp(2 * x) - 1) / (Math.exp(2 * x) + 1);
    const out = new Value(t, { _children: [this], _op: "tanh" });

    out._backward = () => {
      this.grad += (1 - t ** 2) * out.grad;
      return [
        {
          src: out.uid,
          dst: this.uid,
          arithmetic: `(1-${t.toFixed(2)}^2)*${out.grad.toFixed(2)}`,
        },
      ];
    };

    return out;
  }

  topoSort(): Value[] {
    const topo = [] as Value[];
    const visited = new Set() as Set<Value>;

    function buildTopo(v: Value): void {
      if (!visited.has(v)) {
        visited.add(v);
        v._prev.forEach((child) => buildTopo(child));
        topo.push(v);
      }
    }

    buildTopo(this);

    return topo;
  }

  backward(): void {
    const topo = this.topoSort();

    this.grad = 1.0;

    for (const v of topo.reverse()) {
      v._backward();
    }
  }

  verboseBackward(): Array<BackwardInfo> {
    const topo = this.topoSort();
    const q = [];

    this.grad = 1.0;
    for (const v of topo.reverse()) {
      const ops = v._backward();
      if (ops) {
        q.push(...ops);
      }
    }

    return q;
  }

  math(): Array<string> {
    // backtrack through the toposort to recover the
    // symbolic representations of computation
    return ["hi"];
  }

  toString(): string {
    return `Value(val=${this.val}, grad=${this.grad})`;
  }
}
