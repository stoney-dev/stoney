type StepKind = "http" | "exec" | "sql";
type StepResultBase = {
    ok: boolean;
    kind: StepKind;
    title: string;
    notes: string[];
};
type HttpStepResult = StepResultBase & {
    kind: "http";
    status?: number;
    method?: string;
    url?: string;
};
type ExecStepResult = StepResultBase & {
    kind: "exec";
    exit_code?: number | null;
    signal?: string;
    duration_ms?: number;
    stdout?: string;
    stderr?: string;
};
type SqlStepResult = StepResultBase & {
    kind: "sql";
    rows?: number;
};
type StepResult = HttpStepResult | ExecStepResult | SqlStepResult;
type WorkItemRef = {
    key: string;
    says?: string;
    links?: string[];
};
type ScenarioResult = {
    id: string;
    ok: boolean;
    work_item?: WorkItemRef;
    method?: string;
    url?: string;
    status?: number;
    notes: string[];
    steps: StepResult[];
};

export type { ExecStepResult, HttpStepResult, ScenarioResult, SqlStepResult, StepKind, StepResult, StepResultBase, WorkItemRef };
