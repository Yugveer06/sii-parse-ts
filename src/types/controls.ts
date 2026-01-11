export interface ControlsSii {
  SiiNunit: ControlsSiiNunit;
}

export interface ControlsSiiNunit {
  input_config: InputConfig[];
}

export interface InputConfig {
  id: string;
  version: number;
  config_lines: string[];
}
