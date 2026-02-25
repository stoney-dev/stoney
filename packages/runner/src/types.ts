// packages/runner/src/types.ts
export type StepKind = "http" | "exec" | "sql";

export type StepResultBase = {
  ok: boolean;
  kind: StepKind;
  title: string;
  notes: string[];
};

export type HttpStepResult = StepResultBase & {
  kind: "http";
  status?: number;
  method?: string;
  url?: string;
};

export type ExecStepResult = StepResultBase & {
  kind: "exec";
  exitCode?: number | null;
  signal?: string;
  duration_ms?: number;
  stdout?: string;
  stderr?: string;
};

export type SqlStepResult = StepResultBase & {
  kind: "sql";
  rows?: number;
};

export type StepResult = HttpStepResult | ExecStepResult | SqlStepResult;

export type WorkItemRef = {
  key: string;
  says?: string;
  links?: string[];
};

export type ScenarioResult = {
  id: string;
  ok: boolean;

  work_item?: WorkItemRef;

  method?: string;
  url?: string;
  status?: number;

  notes: string[];
  steps: StepResult[];
};