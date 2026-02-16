export type StepResult = {
    ok: boolean;
    kind: "http" | "exec" | "sql";
    title: string;
    status?: number;
    method?: string;
    url?: string;
    notes: string[];
  };
  
  export type ScenarioResult = {
    id: string;
    ok: boolean;
    method?: string;
    url?: string;
    status?: number;
    notes: string[];
    steps: StepResult[];
  };
  