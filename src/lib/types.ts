export type ValueNodeProps = {
  val: number;
  grad: number;
  label?: string;
};

export type OperatorNodeProps = {
  op: string;
};

export type ExampleType = "neuron" | "mlp" | "simple";
