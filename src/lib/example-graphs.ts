import { Value } from "./micrograd/engine";
import { MLP } from "./micrograd/nn";

export const simpleArithmetic = (): Value => {
  // a = 2.0
  // b = -3.0
  // c = 10.0
  // f = -2.0
  // e = a * b
  // d = e + c
  // L = d * f
  const a = new Value(2.0, { label: "a" });
  const b = new Value(-3.0, { label: "b" });
  const c = new Value(10.0, { label: "c" });
  const f = new Value(-2.0, { label: "f" });
  const e = a.mul(b);
  e.label = "e";
  const d = e.add(c);
  d.label = "d";
  const L = d.mul(f);
  L.label = "L";

  return L;
};

export const simpleNeuron = (): Value => {
  // x1 = 2.0
  // x2 = 0.0
  // w1 = -3.0
  // w2 = 1.0
  // b = 6.8813735870195432
  // x1w1 = x1 * w1
  // x2w2 = x2 * w2
  // x1w1x2w2 = x1w1 + x2w2
  // n = x1w1x2w2 + b [scalar version of Ax + b]
  // o = n.tanh() [non-linearity]
  const x1 = new Value(2.0, { label: "x1" });
  const x2 = new Value(0.0, { label: "x2" });
  const w1 = new Value(-3.0, { label: "w1" });
  const w2 = new Value(1.0, { label: "w2" });
  const b = new Value(6.8813735870195432, { label: "b" });

  const x1w1 = x1.mul(w1);
  x1w1.label = "x1*w1";

  const x2w2 = x2.mul(w2);
  x2w2.label = "x2*w2";

  const x1w1x2w2 = x1w1.add(x2w2);
  x1w1x2w2.label = "x1*w1 + x2*w2";
  const n = x1w1x2w2.add(b);
  n.label = "n";
  const o = n.tanh();
  o.label = "o";

  return o;
};

export const multiLayerPerceptron = (): Value => {
  const x = [new Value(2), new Value(3)];
  const nn = new MLP(2, [2, 2, 1]);
  const out = nn.forward(x);
  return out[0];
};
