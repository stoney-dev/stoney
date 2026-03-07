import { z } from 'zod';

declare const ExpectationSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodNumber>;
    json: z.ZodOptional<z.ZodAny>;
    bodyContains: z.ZodOptional<z.ZodString>;
    exit_code: z.ZodOptional<z.ZodNumber>;
    stdout_contains: z.ZodOptional<z.ZodString>;
    stderr_contains: z.ZodOptional<z.ZodString>;
    stdout_not_contains: z.ZodOptional<z.ZodString>;
    stderr_not_contains: z.ZodOptional<z.ZodString>;
    stdout_regex: z.ZodOptional<z.ZodString>;
    stderr_regex: z.ZodOptional<z.ZodString>;
    stdout_empty: z.ZodOptional<z.ZodBoolean>;
    stderr_empty: z.ZodOptional<z.ZodBoolean>;
    max_duration_ms: z.ZodOptional<z.ZodNumber>;
    rows: z.ZodOptional<z.ZodNumber>;
    equals: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    status?: number | undefined;
    json?: any;
    bodyContains?: string | undefined;
    exit_code?: number | undefined;
    stdout_contains?: string | undefined;
    stderr_contains?: string | undefined;
    stdout_not_contains?: string | undefined;
    stderr_not_contains?: string | undefined;
    stdout_regex?: string | undefined;
    stderr_regex?: string | undefined;
    stdout_empty?: boolean | undefined;
    stderr_empty?: boolean | undefined;
    max_duration_ms?: number | undefined;
    rows?: number | undefined;
    equals?: Record<string, any> | undefined;
}, {
    status?: number | undefined;
    json?: any;
    bodyContains?: string | undefined;
    exit_code?: number | undefined;
    stdout_contains?: string | undefined;
    stderr_contains?: string | undefined;
    stdout_not_contains?: string | undefined;
    stderr_not_contains?: string | undefined;
    stdout_regex?: string | undefined;
    stderr_regex?: string | undefined;
    stdout_empty?: boolean | undefined;
    stderr_empty?: boolean | undefined;
    max_duration_ms?: number | undefined;
    rows?: number | undefined;
    equals?: Record<string, any> | undefined;
}>;
declare const HttpBodySchema: z.ZodEffects<z.ZodObject<{
    json: z.ZodOptional<z.ZodAny>;
    jsonFile: z.ZodOptional<z.ZodString>;
    text: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    json?: any;
    jsonFile?: string | undefined;
    text?: string | undefined;
}, {
    json?: any;
    jsonFile?: string | undefined;
    text?: string | undefined;
}>, {
    json?: any;
    jsonFile?: string | undefined;
    text?: string | undefined;
}, {
    json?: any;
    jsonFile?: string | undefined;
    text?: string | undefined;
}>;
declare const HttpStepSchema: z.ZodObject<{
    method: z.ZodString;
    path: z.ZodString;
    headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    query: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>>>;
    /**
     * Back-compat + UX:
     * - body: { json: ... }      (preferred)
     * - body: { jsonFile: ... }  (preferred)
     * - body: { text: ... }      (preferred)
     * - body: { ... }            (legacy direct JSON object allowed)
     * - body: "raw string"       (legacy)
     */
    body: z.ZodOptional<z.ZodUnion<[z.ZodEffects<z.ZodObject<{
        json: z.ZodOptional<z.ZodAny>;
        jsonFile: z.ZodOptional<z.ZodString>;
        text: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        json?: any;
        jsonFile?: string | undefined;
        text?: string | undefined;
    }, {
        json?: any;
        jsonFile?: string | undefined;
        text?: string | undefined;
    }>, {
        json?: any;
        jsonFile?: string | undefined;
        text?: string | undefined;
    }, {
        json?: any;
        jsonFile?: string | undefined;
        text?: string | undefined;
    }>, z.ZodString, z.ZodRecord<z.ZodString, z.ZodAny>, z.ZodArray<z.ZodAny, "many">, z.ZodNumber, z.ZodBoolean, z.ZodNull]>>;
    timeout_ms: z.ZodOptional<z.ZodNumber>;
    retries: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    path: string;
    method: string;
    headers?: Record<string, string> | undefined;
    query?: Record<string, string | number | boolean> | undefined;
    body?: string | number | boolean | any[] | Record<string, any> | {
        json?: any;
        jsonFile?: string | undefined;
        text?: string | undefined;
    } | null | undefined;
    timeout_ms?: number | undefined;
    retries?: number | undefined;
}, {
    path: string;
    method: string;
    headers?: Record<string, string> | undefined;
    query?: Record<string, string | number | boolean> | undefined;
    body?: string | number | boolean | any[] | Record<string, any> | {
        json?: any;
        jsonFile?: string | undefined;
        text?: string | undefined;
    } | null | undefined;
    timeout_ms?: number | undefined;
    retries?: number | undefined;
}>;
declare const ExecStepSchema: z.ZodObject<{
    run: z.ZodString;
    cwd: z.ZodOptional<z.ZodString>;
    env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    timeout_ms: z.ZodOptional<z.ZodNumber>;
    retries: z.ZodOptional<z.ZodNumber>;
    max_output_chars: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    run: string;
    timeout_ms?: number | undefined;
    retries?: number | undefined;
    cwd?: string | undefined;
    env?: Record<string, string> | undefined;
    max_output_chars?: number | undefined;
}, {
    run: string;
    timeout_ms?: number | undefined;
    retries?: number | undefined;
    cwd?: string | undefined;
    env?: Record<string, string> | undefined;
    max_output_chars?: number | undefined;
}>;
declare const SqlStepSchema: z.ZodObject<{
    driver: z.ZodLiteral<"postgres">;
    url_env: z.ZodString;
    query: z.ZodString;
    timeout_ms: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    query: string;
    driver: "postgres";
    url_env: string;
    timeout_ms?: number | undefined;
}, {
    query: string;
    driver: "postgres";
    url_env: string;
    timeout_ms?: number | undefined;
}>;
declare const StepSchema: z.ZodUnion<[z.ZodObject<{
    http: z.ZodObject<{
        method: z.ZodString;
        path: z.ZodString;
        headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        query: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>>>;
        /**
         * Back-compat + UX:
         * - body: { json: ... }      (preferred)
         * - body: { jsonFile: ... }  (preferred)
         * - body: { text: ... }      (preferred)
         * - body: { ... }            (legacy direct JSON object allowed)
         * - body: "raw string"       (legacy)
         */
        body: z.ZodOptional<z.ZodUnion<[z.ZodEffects<z.ZodObject<{
            json: z.ZodOptional<z.ZodAny>;
            jsonFile: z.ZodOptional<z.ZodString>;
            text: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            json?: any;
            jsonFile?: string | undefined;
            text?: string | undefined;
        }, {
            json?: any;
            jsonFile?: string | undefined;
            text?: string | undefined;
        }>, {
            json?: any;
            jsonFile?: string | undefined;
            text?: string | undefined;
        }, {
            json?: any;
            jsonFile?: string | undefined;
            text?: string | undefined;
        }>, z.ZodString, z.ZodRecord<z.ZodString, z.ZodAny>, z.ZodArray<z.ZodAny, "many">, z.ZodNumber, z.ZodBoolean, z.ZodNull]>>;
        timeout_ms: z.ZodOptional<z.ZodNumber>;
        retries: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        path: string;
        method: string;
        headers?: Record<string, string> | undefined;
        query?: Record<string, string | number | boolean> | undefined;
        body?: string | number | boolean | any[] | Record<string, any> | {
            json?: any;
            jsonFile?: string | undefined;
            text?: string | undefined;
        } | null | undefined;
        timeout_ms?: number | undefined;
        retries?: number | undefined;
    }, {
        path: string;
        method: string;
        headers?: Record<string, string> | undefined;
        query?: Record<string, string | number | boolean> | undefined;
        body?: string | number | boolean | any[] | Record<string, any> | {
            json?: any;
            jsonFile?: string | undefined;
            text?: string | undefined;
        } | null | undefined;
        timeout_ms?: number | undefined;
        retries?: number | undefined;
    }>;
    expect: z.ZodOptional<z.ZodObject<{
        status: z.ZodOptional<z.ZodNumber>;
        json: z.ZodOptional<z.ZodAny>;
        bodyContains: z.ZodOptional<z.ZodString>;
        exit_code: z.ZodOptional<z.ZodNumber>;
        stdout_contains: z.ZodOptional<z.ZodString>;
        stderr_contains: z.ZodOptional<z.ZodString>;
        stdout_not_contains: z.ZodOptional<z.ZodString>;
        stderr_not_contains: z.ZodOptional<z.ZodString>;
        stdout_regex: z.ZodOptional<z.ZodString>;
        stderr_regex: z.ZodOptional<z.ZodString>;
        stdout_empty: z.ZodOptional<z.ZodBoolean>;
        stderr_empty: z.ZodOptional<z.ZodBoolean>;
        max_duration_ms: z.ZodOptional<z.ZodNumber>;
        rows: z.ZodOptional<z.ZodNumber>;
        equals: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        status?: number | undefined;
        json?: any;
        bodyContains?: string | undefined;
        exit_code?: number | undefined;
        stdout_contains?: string | undefined;
        stderr_contains?: string | undefined;
        stdout_not_contains?: string | undefined;
        stderr_not_contains?: string | undefined;
        stdout_regex?: string | undefined;
        stderr_regex?: string | undefined;
        stdout_empty?: boolean | undefined;
        stderr_empty?: boolean | undefined;
        max_duration_ms?: number | undefined;
        rows?: number | undefined;
        equals?: Record<string, any> | undefined;
    }, {
        status?: number | undefined;
        json?: any;
        bodyContains?: string | undefined;
        exit_code?: number | undefined;
        stdout_contains?: string | undefined;
        stderr_contains?: string | undefined;
        stdout_not_contains?: string | undefined;
        stderr_not_contains?: string | undefined;
        stdout_regex?: string | undefined;
        stderr_regex?: string | undefined;
        stdout_empty?: boolean | undefined;
        stderr_empty?: boolean | undefined;
        max_duration_ms?: number | undefined;
        rows?: number | undefined;
        equals?: Record<string, any> | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    http: {
        path: string;
        method: string;
        headers?: Record<string, string> | undefined;
        query?: Record<string, string | number | boolean> | undefined;
        body?: string | number | boolean | any[] | Record<string, any> | {
            json?: any;
            jsonFile?: string | undefined;
            text?: string | undefined;
        } | null | undefined;
        timeout_ms?: number | undefined;
        retries?: number | undefined;
    };
    expect?: {
        status?: number | undefined;
        json?: any;
        bodyContains?: string | undefined;
        exit_code?: number | undefined;
        stdout_contains?: string | undefined;
        stderr_contains?: string | undefined;
        stdout_not_contains?: string | undefined;
        stderr_not_contains?: string | undefined;
        stdout_regex?: string | undefined;
        stderr_regex?: string | undefined;
        stdout_empty?: boolean | undefined;
        stderr_empty?: boolean | undefined;
        max_duration_ms?: number | undefined;
        rows?: number | undefined;
        equals?: Record<string, any> | undefined;
    } | undefined;
}, {
    http: {
        path: string;
        method: string;
        headers?: Record<string, string> | undefined;
        query?: Record<string, string | number | boolean> | undefined;
        body?: string | number | boolean | any[] | Record<string, any> | {
            json?: any;
            jsonFile?: string | undefined;
            text?: string | undefined;
        } | null | undefined;
        timeout_ms?: number | undefined;
        retries?: number | undefined;
    };
    expect?: {
        status?: number | undefined;
        json?: any;
        bodyContains?: string | undefined;
        exit_code?: number | undefined;
        stdout_contains?: string | undefined;
        stderr_contains?: string | undefined;
        stdout_not_contains?: string | undefined;
        stderr_not_contains?: string | undefined;
        stdout_regex?: string | undefined;
        stderr_regex?: string | undefined;
        stdout_empty?: boolean | undefined;
        stderr_empty?: boolean | undefined;
        max_duration_ms?: number | undefined;
        rows?: number | undefined;
        equals?: Record<string, any> | undefined;
    } | undefined;
}>, z.ZodObject<{
    exec: z.ZodObject<{
        run: z.ZodString;
        cwd: z.ZodOptional<z.ZodString>;
        env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        timeout_ms: z.ZodOptional<z.ZodNumber>;
        retries: z.ZodOptional<z.ZodNumber>;
        max_output_chars: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        run: string;
        timeout_ms?: number | undefined;
        retries?: number | undefined;
        cwd?: string | undefined;
        env?: Record<string, string> | undefined;
        max_output_chars?: number | undefined;
    }, {
        run: string;
        timeout_ms?: number | undefined;
        retries?: number | undefined;
        cwd?: string | undefined;
        env?: Record<string, string> | undefined;
        max_output_chars?: number | undefined;
    }>;
    expect: z.ZodOptional<z.ZodObject<{
        status: z.ZodOptional<z.ZodNumber>;
        json: z.ZodOptional<z.ZodAny>;
        bodyContains: z.ZodOptional<z.ZodString>;
        exit_code: z.ZodOptional<z.ZodNumber>;
        stdout_contains: z.ZodOptional<z.ZodString>;
        stderr_contains: z.ZodOptional<z.ZodString>;
        stdout_not_contains: z.ZodOptional<z.ZodString>;
        stderr_not_contains: z.ZodOptional<z.ZodString>;
        stdout_regex: z.ZodOptional<z.ZodString>;
        stderr_regex: z.ZodOptional<z.ZodString>;
        stdout_empty: z.ZodOptional<z.ZodBoolean>;
        stderr_empty: z.ZodOptional<z.ZodBoolean>;
        max_duration_ms: z.ZodOptional<z.ZodNumber>;
        rows: z.ZodOptional<z.ZodNumber>;
        equals: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        status?: number | undefined;
        json?: any;
        bodyContains?: string | undefined;
        exit_code?: number | undefined;
        stdout_contains?: string | undefined;
        stderr_contains?: string | undefined;
        stdout_not_contains?: string | undefined;
        stderr_not_contains?: string | undefined;
        stdout_regex?: string | undefined;
        stderr_regex?: string | undefined;
        stdout_empty?: boolean | undefined;
        stderr_empty?: boolean | undefined;
        max_duration_ms?: number | undefined;
        rows?: number | undefined;
        equals?: Record<string, any> | undefined;
    }, {
        status?: number | undefined;
        json?: any;
        bodyContains?: string | undefined;
        exit_code?: number | undefined;
        stdout_contains?: string | undefined;
        stderr_contains?: string | undefined;
        stdout_not_contains?: string | undefined;
        stderr_not_contains?: string | undefined;
        stdout_regex?: string | undefined;
        stderr_regex?: string | undefined;
        stdout_empty?: boolean | undefined;
        stderr_empty?: boolean | undefined;
        max_duration_ms?: number | undefined;
        rows?: number | undefined;
        equals?: Record<string, any> | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    exec: {
        run: string;
        timeout_ms?: number | undefined;
        retries?: number | undefined;
        cwd?: string | undefined;
        env?: Record<string, string> | undefined;
        max_output_chars?: number | undefined;
    };
    expect?: {
        status?: number | undefined;
        json?: any;
        bodyContains?: string | undefined;
        exit_code?: number | undefined;
        stdout_contains?: string | undefined;
        stderr_contains?: string | undefined;
        stdout_not_contains?: string | undefined;
        stderr_not_contains?: string | undefined;
        stdout_regex?: string | undefined;
        stderr_regex?: string | undefined;
        stdout_empty?: boolean | undefined;
        stderr_empty?: boolean | undefined;
        max_duration_ms?: number | undefined;
        rows?: number | undefined;
        equals?: Record<string, any> | undefined;
    } | undefined;
}, {
    exec: {
        run: string;
        timeout_ms?: number | undefined;
        retries?: number | undefined;
        cwd?: string | undefined;
        env?: Record<string, string> | undefined;
        max_output_chars?: number | undefined;
    };
    expect?: {
        status?: number | undefined;
        json?: any;
        bodyContains?: string | undefined;
        exit_code?: number | undefined;
        stdout_contains?: string | undefined;
        stderr_contains?: string | undefined;
        stdout_not_contains?: string | undefined;
        stderr_not_contains?: string | undefined;
        stdout_regex?: string | undefined;
        stderr_regex?: string | undefined;
        stdout_empty?: boolean | undefined;
        stderr_empty?: boolean | undefined;
        max_duration_ms?: number | undefined;
        rows?: number | undefined;
        equals?: Record<string, any> | undefined;
    } | undefined;
}>, z.ZodObject<{
    sql: z.ZodObject<{
        driver: z.ZodLiteral<"postgres">;
        url_env: z.ZodString;
        query: z.ZodString;
        timeout_ms: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        query: string;
        driver: "postgres";
        url_env: string;
        timeout_ms?: number | undefined;
    }, {
        query: string;
        driver: "postgres";
        url_env: string;
        timeout_ms?: number | undefined;
    }>;
    expect: z.ZodOptional<z.ZodObject<{
        status: z.ZodOptional<z.ZodNumber>;
        json: z.ZodOptional<z.ZodAny>;
        bodyContains: z.ZodOptional<z.ZodString>;
        exit_code: z.ZodOptional<z.ZodNumber>;
        stdout_contains: z.ZodOptional<z.ZodString>;
        stderr_contains: z.ZodOptional<z.ZodString>;
        stdout_not_contains: z.ZodOptional<z.ZodString>;
        stderr_not_contains: z.ZodOptional<z.ZodString>;
        stdout_regex: z.ZodOptional<z.ZodString>;
        stderr_regex: z.ZodOptional<z.ZodString>;
        stdout_empty: z.ZodOptional<z.ZodBoolean>;
        stderr_empty: z.ZodOptional<z.ZodBoolean>;
        max_duration_ms: z.ZodOptional<z.ZodNumber>;
        rows: z.ZodOptional<z.ZodNumber>;
        equals: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        status?: number | undefined;
        json?: any;
        bodyContains?: string | undefined;
        exit_code?: number | undefined;
        stdout_contains?: string | undefined;
        stderr_contains?: string | undefined;
        stdout_not_contains?: string | undefined;
        stderr_not_contains?: string | undefined;
        stdout_regex?: string | undefined;
        stderr_regex?: string | undefined;
        stdout_empty?: boolean | undefined;
        stderr_empty?: boolean | undefined;
        max_duration_ms?: number | undefined;
        rows?: number | undefined;
        equals?: Record<string, any> | undefined;
    }, {
        status?: number | undefined;
        json?: any;
        bodyContains?: string | undefined;
        exit_code?: number | undefined;
        stdout_contains?: string | undefined;
        stderr_contains?: string | undefined;
        stdout_not_contains?: string | undefined;
        stderr_not_contains?: string | undefined;
        stdout_regex?: string | undefined;
        stderr_regex?: string | undefined;
        stdout_empty?: boolean | undefined;
        stderr_empty?: boolean | undefined;
        max_duration_ms?: number | undefined;
        rows?: number | undefined;
        equals?: Record<string, any> | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    sql: {
        query: string;
        driver: "postgres";
        url_env: string;
        timeout_ms?: number | undefined;
    };
    expect?: {
        status?: number | undefined;
        json?: any;
        bodyContains?: string | undefined;
        exit_code?: number | undefined;
        stdout_contains?: string | undefined;
        stderr_contains?: string | undefined;
        stdout_not_contains?: string | undefined;
        stderr_not_contains?: string | undefined;
        stdout_regex?: string | undefined;
        stderr_regex?: string | undefined;
        stdout_empty?: boolean | undefined;
        stderr_empty?: boolean | undefined;
        max_duration_ms?: number | undefined;
        rows?: number | undefined;
        equals?: Record<string, any> | undefined;
    } | undefined;
}, {
    sql: {
        query: string;
        driver: "postgres";
        url_env: string;
        timeout_ms?: number | undefined;
    };
    expect?: {
        status?: number | undefined;
        json?: any;
        bodyContains?: string | undefined;
        exit_code?: number | undefined;
        stdout_contains?: string | undefined;
        stderr_contains?: string | undefined;
        stdout_not_contains?: string | undefined;
        stderr_not_contains?: string | undefined;
        stdout_regex?: string | undefined;
        stderr_regex?: string | undefined;
        stdout_empty?: boolean | undefined;
        stderr_empty?: boolean | undefined;
        max_duration_ms?: number | undefined;
        rows?: number | undefined;
        equals?: Record<string, any> | undefined;
    } | undefined;
}>]>;
declare const WorkItemObjectSchema: z.ZodObject<{
    key: z.ZodString;
    says: z.ZodOptional<z.ZodString>;
    links: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    key: string;
    says?: string | undefined;
    links?: string[] | undefined;
}, {
    key: string;
    says?: string | undefined;
    links?: string[] | undefined;
}>;
declare const WorkItemSchema: z.ZodUnion<[z.ZodString, z.ZodObject<{
    key: z.ZodString;
    says: z.ZodOptional<z.ZodString>;
    links: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    key: string;
    says?: string | undefined;
    links?: string[] | undefined;
}, {
    key: string;
    says?: string | undefined;
    links?: string[] | undefined;
}>]>;
declare const CheckSchema: z.ZodObject<{
    id: z.ZodString;
    /**
     * Supported forms:
     *
     * 1) Simple:
     *    work_item: "KAN-123"
     *    says: "..."
     *    links: ["..."]
     *
     * 2) Structured:
     *    work_item:
     *      key: "KAN-123"
     *      says: "..."
     *      links: ["..."]
     *
     * Top-level says/links remain supported for backward compatibility
     * and can be used as fallbacks when work_item is a string.
     */
    work_item: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        key: z.ZodString;
        says: z.ZodOptional<z.ZodString>;
        links: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        key: string;
        says?: string | undefined;
        links?: string[] | undefined;
    }, {
        key: string;
        says?: string | undefined;
        links?: string[] | undefined;
    }>]>>;
    says: z.ZodOptional<z.ZodString>;
    links: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    steps: z.ZodArray<z.ZodUnion<[z.ZodObject<{
        http: z.ZodObject<{
            method: z.ZodString;
            path: z.ZodString;
            headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            query: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>>>;
            /**
             * Back-compat + UX:
             * - body: { json: ... }      (preferred)
             * - body: { jsonFile: ... }  (preferred)
             * - body: { text: ... }      (preferred)
             * - body: { ... }            (legacy direct JSON object allowed)
             * - body: "raw string"       (legacy)
             */
            body: z.ZodOptional<z.ZodUnion<[z.ZodEffects<z.ZodObject<{
                json: z.ZodOptional<z.ZodAny>;
                jsonFile: z.ZodOptional<z.ZodString>;
                text: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                json?: any;
                jsonFile?: string | undefined;
                text?: string | undefined;
            }, {
                json?: any;
                jsonFile?: string | undefined;
                text?: string | undefined;
            }>, {
                json?: any;
                jsonFile?: string | undefined;
                text?: string | undefined;
            }, {
                json?: any;
                jsonFile?: string | undefined;
                text?: string | undefined;
            }>, z.ZodString, z.ZodRecord<z.ZodString, z.ZodAny>, z.ZodArray<z.ZodAny, "many">, z.ZodNumber, z.ZodBoolean, z.ZodNull]>>;
            timeout_ms: z.ZodOptional<z.ZodNumber>;
            retries: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            path: string;
            method: string;
            headers?: Record<string, string> | undefined;
            query?: Record<string, string | number | boolean> | undefined;
            body?: string | number | boolean | any[] | Record<string, any> | {
                json?: any;
                jsonFile?: string | undefined;
                text?: string | undefined;
            } | null | undefined;
            timeout_ms?: number | undefined;
            retries?: number | undefined;
        }, {
            path: string;
            method: string;
            headers?: Record<string, string> | undefined;
            query?: Record<string, string | number | boolean> | undefined;
            body?: string | number | boolean | any[] | Record<string, any> | {
                json?: any;
                jsonFile?: string | undefined;
                text?: string | undefined;
            } | null | undefined;
            timeout_ms?: number | undefined;
            retries?: number | undefined;
        }>;
        expect: z.ZodOptional<z.ZodObject<{
            status: z.ZodOptional<z.ZodNumber>;
            json: z.ZodOptional<z.ZodAny>;
            bodyContains: z.ZodOptional<z.ZodString>;
            exit_code: z.ZodOptional<z.ZodNumber>;
            stdout_contains: z.ZodOptional<z.ZodString>;
            stderr_contains: z.ZodOptional<z.ZodString>;
            stdout_not_contains: z.ZodOptional<z.ZodString>;
            stderr_not_contains: z.ZodOptional<z.ZodString>;
            stdout_regex: z.ZodOptional<z.ZodString>;
            stderr_regex: z.ZodOptional<z.ZodString>;
            stdout_empty: z.ZodOptional<z.ZodBoolean>;
            stderr_empty: z.ZodOptional<z.ZodBoolean>;
            max_duration_ms: z.ZodOptional<z.ZodNumber>;
            rows: z.ZodOptional<z.ZodNumber>;
            equals: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            status?: number | undefined;
            json?: any;
            bodyContains?: string | undefined;
            exit_code?: number | undefined;
            stdout_contains?: string | undefined;
            stderr_contains?: string | undefined;
            stdout_not_contains?: string | undefined;
            stderr_not_contains?: string | undefined;
            stdout_regex?: string | undefined;
            stderr_regex?: string | undefined;
            stdout_empty?: boolean | undefined;
            stderr_empty?: boolean | undefined;
            max_duration_ms?: number | undefined;
            rows?: number | undefined;
            equals?: Record<string, any> | undefined;
        }, {
            status?: number | undefined;
            json?: any;
            bodyContains?: string | undefined;
            exit_code?: number | undefined;
            stdout_contains?: string | undefined;
            stderr_contains?: string | undefined;
            stdout_not_contains?: string | undefined;
            stderr_not_contains?: string | undefined;
            stdout_regex?: string | undefined;
            stderr_regex?: string | undefined;
            stdout_empty?: boolean | undefined;
            stderr_empty?: boolean | undefined;
            max_duration_ms?: number | undefined;
            rows?: number | undefined;
            equals?: Record<string, any> | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        http: {
            path: string;
            method: string;
            headers?: Record<string, string> | undefined;
            query?: Record<string, string | number | boolean> | undefined;
            body?: string | number | boolean | any[] | Record<string, any> | {
                json?: any;
                jsonFile?: string | undefined;
                text?: string | undefined;
            } | null | undefined;
            timeout_ms?: number | undefined;
            retries?: number | undefined;
        };
        expect?: {
            status?: number | undefined;
            json?: any;
            bodyContains?: string | undefined;
            exit_code?: number | undefined;
            stdout_contains?: string | undefined;
            stderr_contains?: string | undefined;
            stdout_not_contains?: string | undefined;
            stderr_not_contains?: string | undefined;
            stdout_regex?: string | undefined;
            stderr_regex?: string | undefined;
            stdout_empty?: boolean | undefined;
            stderr_empty?: boolean | undefined;
            max_duration_ms?: number | undefined;
            rows?: number | undefined;
            equals?: Record<string, any> | undefined;
        } | undefined;
    }, {
        http: {
            path: string;
            method: string;
            headers?: Record<string, string> | undefined;
            query?: Record<string, string | number | boolean> | undefined;
            body?: string | number | boolean | any[] | Record<string, any> | {
                json?: any;
                jsonFile?: string | undefined;
                text?: string | undefined;
            } | null | undefined;
            timeout_ms?: number | undefined;
            retries?: number | undefined;
        };
        expect?: {
            status?: number | undefined;
            json?: any;
            bodyContains?: string | undefined;
            exit_code?: number | undefined;
            stdout_contains?: string | undefined;
            stderr_contains?: string | undefined;
            stdout_not_contains?: string | undefined;
            stderr_not_contains?: string | undefined;
            stdout_regex?: string | undefined;
            stderr_regex?: string | undefined;
            stdout_empty?: boolean | undefined;
            stderr_empty?: boolean | undefined;
            max_duration_ms?: number | undefined;
            rows?: number | undefined;
            equals?: Record<string, any> | undefined;
        } | undefined;
    }>, z.ZodObject<{
        exec: z.ZodObject<{
            run: z.ZodString;
            cwd: z.ZodOptional<z.ZodString>;
            env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            timeout_ms: z.ZodOptional<z.ZodNumber>;
            retries: z.ZodOptional<z.ZodNumber>;
            max_output_chars: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            run: string;
            timeout_ms?: number | undefined;
            retries?: number | undefined;
            cwd?: string | undefined;
            env?: Record<string, string> | undefined;
            max_output_chars?: number | undefined;
        }, {
            run: string;
            timeout_ms?: number | undefined;
            retries?: number | undefined;
            cwd?: string | undefined;
            env?: Record<string, string> | undefined;
            max_output_chars?: number | undefined;
        }>;
        expect: z.ZodOptional<z.ZodObject<{
            status: z.ZodOptional<z.ZodNumber>;
            json: z.ZodOptional<z.ZodAny>;
            bodyContains: z.ZodOptional<z.ZodString>;
            exit_code: z.ZodOptional<z.ZodNumber>;
            stdout_contains: z.ZodOptional<z.ZodString>;
            stderr_contains: z.ZodOptional<z.ZodString>;
            stdout_not_contains: z.ZodOptional<z.ZodString>;
            stderr_not_contains: z.ZodOptional<z.ZodString>;
            stdout_regex: z.ZodOptional<z.ZodString>;
            stderr_regex: z.ZodOptional<z.ZodString>;
            stdout_empty: z.ZodOptional<z.ZodBoolean>;
            stderr_empty: z.ZodOptional<z.ZodBoolean>;
            max_duration_ms: z.ZodOptional<z.ZodNumber>;
            rows: z.ZodOptional<z.ZodNumber>;
            equals: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            status?: number | undefined;
            json?: any;
            bodyContains?: string | undefined;
            exit_code?: number | undefined;
            stdout_contains?: string | undefined;
            stderr_contains?: string | undefined;
            stdout_not_contains?: string | undefined;
            stderr_not_contains?: string | undefined;
            stdout_regex?: string | undefined;
            stderr_regex?: string | undefined;
            stdout_empty?: boolean | undefined;
            stderr_empty?: boolean | undefined;
            max_duration_ms?: number | undefined;
            rows?: number | undefined;
            equals?: Record<string, any> | undefined;
        }, {
            status?: number | undefined;
            json?: any;
            bodyContains?: string | undefined;
            exit_code?: number | undefined;
            stdout_contains?: string | undefined;
            stderr_contains?: string | undefined;
            stdout_not_contains?: string | undefined;
            stderr_not_contains?: string | undefined;
            stdout_regex?: string | undefined;
            stderr_regex?: string | undefined;
            stdout_empty?: boolean | undefined;
            stderr_empty?: boolean | undefined;
            max_duration_ms?: number | undefined;
            rows?: number | undefined;
            equals?: Record<string, any> | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        exec: {
            run: string;
            timeout_ms?: number | undefined;
            retries?: number | undefined;
            cwd?: string | undefined;
            env?: Record<string, string> | undefined;
            max_output_chars?: number | undefined;
        };
        expect?: {
            status?: number | undefined;
            json?: any;
            bodyContains?: string | undefined;
            exit_code?: number | undefined;
            stdout_contains?: string | undefined;
            stderr_contains?: string | undefined;
            stdout_not_contains?: string | undefined;
            stderr_not_contains?: string | undefined;
            stdout_regex?: string | undefined;
            stderr_regex?: string | undefined;
            stdout_empty?: boolean | undefined;
            stderr_empty?: boolean | undefined;
            max_duration_ms?: number | undefined;
            rows?: number | undefined;
            equals?: Record<string, any> | undefined;
        } | undefined;
    }, {
        exec: {
            run: string;
            timeout_ms?: number | undefined;
            retries?: number | undefined;
            cwd?: string | undefined;
            env?: Record<string, string> | undefined;
            max_output_chars?: number | undefined;
        };
        expect?: {
            status?: number | undefined;
            json?: any;
            bodyContains?: string | undefined;
            exit_code?: number | undefined;
            stdout_contains?: string | undefined;
            stderr_contains?: string | undefined;
            stdout_not_contains?: string | undefined;
            stderr_not_contains?: string | undefined;
            stdout_regex?: string | undefined;
            stderr_regex?: string | undefined;
            stdout_empty?: boolean | undefined;
            stderr_empty?: boolean | undefined;
            max_duration_ms?: number | undefined;
            rows?: number | undefined;
            equals?: Record<string, any> | undefined;
        } | undefined;
    }>, z.ZodObject<{
        sql: z.ZodObject<{
            driver: z.ZodLiteral<"postgres">;
            url_env: z.ZodString;
            query: z.ZodString;
            timeout_ms: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            query: string;
            driver: "postgres";
            url_env: string;
            timeout_ms?: number | undefined;
        }, {
            query: string;
            driver: "postgres";
            url_env: string;
            timeout_ms?: number | undefined;
        }>;
        expect: z.ZodOptional<z.ZodObject<{
            status: z.ZodOptional<z.ZodNumber>;
            json: z.ZodOptional<z.ZodAny>;
            bodyContains: z.ZodOptional<z.ZodString>;
            exit_code: z.ZodOptional<z.ZodNumber>;
            stdout_contains: z.ZodOptional<z.ZodString>;
            stderr_contains: z.ZodOptional<z.ZodString>;
            stdout_not_contains: z.ZodOptional<z.ZodString>;
            stderr_not_contains: z.ZodOptional<z.ZodString>;
            stdout_regex: z.ZodOptional<z.ZodString>;
            stderr_regex: z.ZodOptional<z.ZodString>;
            stdout_empty: z.ZodOptional<z.ZodBoolean>;
            stderr_empty: z.ZodOptional<z.ZodBoolean>;
            max_duration_ms: z.ZodOptional<z.ZodNumber>;
            rows: z.ZodOptional<z.ZodNumber>;
            equals: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            status?: number | undefined;
            json?: any;
            bodyContains?: string | undefined;
            exit_code?: number | undefined;
            stdout_contains?: string | undefined;
            stderr_contains?: string | undefined;
            stdout_not_contains?: string | undefined;
            stderr_not_contains?: string | undefined;
            stdout_regex?: string | undefined;
            stderr_regex?: string | undefined;
            stdout_empty?: boolean | undefined;
            stderr_empty?: boolean | undefined;
            max_duration_ms?: number | undefined;
            rows?: number | undefined;
            equals?: Record<string, any> | undefined;
        }, {
            status?: number | undefined;
            json?: any;
            bodyContains?: string | undefined;
            exit_code?: number | undefined;
            stdout_contains?: string | undefined;
            stderr_contains?: string | undefined;
            stdout_not_contains?: string | undefined;
            stderr_not_contains?: string | undefined;
            stdout_regex?: string | undefined;
            stderr_regex?: string | undefined;
            stdout_empty?: boolean | undefined;
            stderr_empty?: boolean | undefined;
            max_duration_ms?: number | undefined;
            rows?: number | undefined;
            equals?: Record<string, any> | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        sql: {
            query: string;
            driver: "postgres";
            url_env: string;
            timeout_ms?: number | undefined;
        };
        expect?: {
            status?: number | undefined;
            json?: any;
            bodyContains?: string | undefined;
            exit_code?: number | undefined;
            stdout_contains?: string | undefined;
            stderr_contains?: string | undefined;
            stdout_not_contains?: string | undefined;
            stderr_not_contains?: string | undefined;
            stdout_regex?: string | undefined;
            stderr_regex?: string | undefined;
            stdout_empty?: boolean | undefined;
            stderr_empty?: boolean | undefined;
            max_duration_ms?: number | undefined;
            rows?: number | undefined;
            equals?: Record<string, any> | undefined;
        } | undefined;
    }, {
        sql: {
            query: string;
            driver: "postgres";
            url_env: string;
            timeout_ms?: number | undefined;
        };
        expect?: {
            status?: number | undefined;
            json?: any;
            bodyContains?: string | undefined;
            exit_code?: number | undefined;
            stdout_contains?: string | undefined;
            stderr_contains?: string | undefined;
            stdout_not_contains?: string | undefined;
            stderr_not_contains?: string | undefined;
            stdout_regex?: string | undefined;
            stderr_regex?: string | undefined;
            stdout_empty?: boolean | undefined;
            stderr_empty?: boolean | undefined;
            max_duration_ms?: number | undefined;
            rows?: number | undefined;
            equals?: Record<string, any> | undefined;
        } | undefined;
    }>]>, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    steps: ({
        http: {
            path: string;
            method: string;
            headers?: Record<string, string> | undefined;
            query?: Record<string, string | number | boolean> | undefined;
            body?: string | number | boolean | any[] | Record<string, any> | {
                json?: any;
                jsonFile?: string | undefined;
                text?: string | undefined;
            } | null | undefined;
            timeout_ms?: number | undefined;
            retries?: number | undefined;
        };
        expect?: {
            status?: number | undefined;
            json?: any;
            bodyContains?: string | undefined;
            exit_code?: number | undefined;
            stdout_contains?: string | undefined;
            stderr_contains?: string | undefined;
            stdout_not_contains?: string | undefined;
            stderr_not_contains?: string | undefined;
            stdout_regex?: string | undefined;
            stderr_regex?: string | undefined;
            stdout_empty?: boolean | undefined;
            stderr_empty?: boolean | undefined;
            max_duration_ms?: number | undefined;
            rows?: number | undefined;
            equals?: Record<string, any> | undefined;
        } | undefined;
    } | {
        exec: {
            run: string;
            timeout_ms?: number | undefined;
            retries?: number | undefined;
            cwd?: string | undefined;
            env?: Record<string, string> | undefined;
            max_output_chars?: number | undefined;
        };
        expect?: {
            status?: number | undefined;
            json?: any;
            bodyContains?: string | undefined;
            exit_code?: number | undefined;
            stdout_contains?: string | undefined;
            stderr_contains?: string | undefined;
            stdout_not_contains?: string | undefined;
            stderr_not_contains?: string | undefined;
            stdout_regex?: string | undefined;
            stderr_regex?: string | undefined;
            stdout_empty?: boolean | undefined;
            stderr_empty?: boolean | undefined;
            max_duration_ms?: number | undefined;
            rows?: number | undefined;
            equals?: Record<string, any> | undefined;
        } | undefined;
    } | {
        sql: {
            query: string;
            driver: "postgres";
            url_env: string;
            timeout_ms?: number | undefined;
        };
        expect?: {
            status?: number | undefined;
            json?: any;
            bodyContains?: string | undefined;
            exit_code?: number | undefined;
            stdout_contains?: string | undefined;
            stderr_contains?: string | undefined;
            stdout_not_contains?: string | undefined;
            stderr_not_contains?: string | undefined;
            stdout_regex?: string | undefined;
            stderr_regex?: string | undefined;
            stdout_empty?: boolean | undefined;
            stderr_empty?: boolean | undefined;
            max_duration_ms?: number | undefined;
            rows?: number | undefined;
            equals?: Record<string, any> | undefined;
        } | undefined;
    })[];
    says?: string | undefined;
    links?: string[] | undefined;
    work_item?: string | {
        key: string;
        says?: string | undefined;
        links?: string[] | undefined;
    } | undefined;
}, {
    id: string;
    steps: ({
        http: {
            path: string;
            method: string;
            headers?: Record<string, string> | undefined;
            query?: Record<string, string | number | boolean> | undefined;
            body?: string | number | boolean | any[] | Record<string, any> | {
                json?: any;
                jsonFile?: string | undefined;
                text?: string | undefined;
            } | null | undefined;
            timeout_ms?: number | undefined;
            retries?: number | undefined;
        };
        expect?: {
            status?: number | undefined;
            json?: any;
            bodyContains?: string | undefined;
            exit_code?: number | undefined;
            stdout_contains?: string | undefined;
            stderr_contains?: string | undefined;
            stdout_not_contains?: string | undefined;
            stderr_not_contains?: string | undefined;
            stdout_regex?: string | undefined;
            stderr_regex?: string | undefined;
            stdout_empty?: boolean | undefined;
            stderr_empty?: boolean | undefined;
            max_duration_ms?: number | undefined;
            rows?: number | undefined;
            equals?: Record<string, any> | undefined;
        } | undefined;
    } | {
        exec: {
            run: string;
            timeout_ms?: number | undefined;
            retries?: number | undefined;
            cwd?: string | undefined;
            env?: Record<string, string> | undefined;
            max_output_chars?: number | undefined;
        };
        expect?: {
            status?: number | undefined;
            json?: any;
            bodyContains?: string | undefined;
            exit_code?: number | undefined;
            stdout_contains?: string | undefined;
            stderr_contains?: string | undefined;
            stdout_not_contains?: string | undefined;
            stderr_not_contains?: string | undefined;
            stdout_regex?: string | undefined;
            stderr_regex?: string | undefined;
            stdout_empty?: boolean | undefined;
            stderr_empty?: boolean | undefined;
            max_duration_ms?: number | undefined;
            rows?: number | undefined;
            equals?: Record<string, any> | undefined;
        } | undefined;
    } | {
        sql: {
            query: string;
            driver: "postgres";
            url_env: string;
            timeout_ms?: number | undefined;
        };
        expect?: {
            status?: number | undefined;
            json?: any;
            bodyContains?: string | undefined;
            exit_code?: number | undefined;
            stdout_contains?: string | undefined;
            stderr_contains?: string | undefined;
            stdout_not_contains?: string | undefined;
            stderr_not_contains?: string | undefined;
            stdout_regex?: string | undefined;
            stderr_regex?: string | undefined;
            stdout_empty?: boolean | undefined;
            stderr_empty?: boolean | undefined;
            max_duration_ms?: number | undefined;
            rows?: number | undefined;
            equals?: Record<string, any> | undefined;
        } | undefined;
    })[];
    says?: string | undefined;
    links?: string[] | undefined;
    work_item?: string | {
        key: string;
        says?: string | undefined;
        links?: string[] | undefined;
    } | undefined;
}>;
declare const ContractSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    checks: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        /**
         * Supported forms:
         *
         * 1) Simple:
         *    work_item: "KAN-123"
         *    says: "..."
         *    links: ["..."]
         *
         * 2) Structured:
         *    work_item:
         *      key: "KAN-123"
         *      says: "..."
         *      links: ["..."]
         *
         * Top-level says/links remain supported for backward compatibility
         * and can be used as fallbacks when work_item is a string.
         */
        work_item: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            key: z.ZodString;
            says: z.ZodOptional<z.ZodString>;
            links: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            key: string;
            says?: string | undefined;
            links?: string[] | undefined;
        }, {
            key: string;
            says?: string | undefined;
            links?: string[] | undefined;
        }>]>>;
        says: z.ZodOptional<z.ZodString>;
        links: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        steps: z.ZodArray<z.ZodUnion<[z.ZodObject<{
            http: z.ZodObject<{
                method: z.ZodString;
                path: z.ZodString;
                headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
                query: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>>>;
                /**
                 * Back-compat + UX:
                 * - body: { json: ... }      (preferred)
                 * - body: { jsonFile: ... }  (preferred)
                 * - body: { text: ... }      (preferred)
                 * - body: { ... }            (legacy direct JSON object allowed)
                 * - body: "raw string"       (legacy)
                 */
                body: z.ZodOptional<z.ZodUnion<[z.ZodEffects<z.ZodObject<{
                    json: z.ZodOptional<z.ZodAny>;
                    jsonFile: z.ZodOptional<z.ZodString>;
                    text: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    json?: any;
                    jsonFile?: string | undefined;
                    text?: string | undefined;
                }, {
                    json?: any;
                    jsonFile?: string | undefined;
                    text?: string | undefined;
                }>, {
                    json?: any;
                    jsonFile?: string | undefined;
                    text?: string | undefined;
                }, {
                    json?: any;
                    jsonFile?: string | undefined;
                    text?: string | undefined;
                }>, z.ZodString, z.ZodRecord<z.ZodString, z.ZodAny>, z.ZodArray<z.ZodAny, "many">, z.ZodNumber, z.ZodBoolean, z.ZodNull]>>;
                timeout_ms: z.ZodOptional<z.ZodNumber>;
                retries: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                path: string;
                method: string;
                headers?: Record<string, string> | undefined;
                query?: Record<string, string | number | boolean> | undefined;
                body?: string | number | boolean | any[] | Record<string, any> | {
                    json?: any;
                    jsonFile?: string | undefined;
                    text?: string | undefined;
                } | null | undefined;
                timeout_ms?: number | undefined;
                retries?: number | undefined;
            }, {
                path: string;
                method: string;
                headers?: Record<string, string> | undefined;
                query?: Record<string, string | number | boolean> | undefined;
                body?: string | number | boolean | any[] | Record<string, any> | {
                    json?: any;
                    jsonFile?: string | undefined;
                    text?: string | undefined;
                } | null | undefined;
                timeout_ms?: number | undefined;
                retries?: number | undefined;
            }>;
            expect: z.ZodOptional<z.ZodObject<{
                status: z.ZodOptional<z.ZodNumber>;
                json: z.ZodOptional<z.ZodAny>;
                bodyContains: z.ZodOptional<z.ZodString>;
                exit_code: z.ZodOptional<z.ZodNumber>;
                stdout_contains: z.ZodOptional<z.ZodString>;
                stderr_contains: z.ZodOptional<z.ZodString>;
                stdout_not_contains: z.ZodOptional<z.ZodString>;
                stderr_not_contains: z.ZodOptional<z.ZodString>;
                stdout_regex: z.ZodOptional<z.ZodString>;
                stderr_regex: z.ZodOptional<z.ZodString>;
                stdout_empty: z.ZodOptional<z.ZodBoolean>;
                stderr_empty: z.ZodOptional<z.ZodBoolean>;
                max_duration_ms: z.ZodOptional<z.ZodNumber>;
                rows: z.ZodOptional<z.ZodNumber>;
                equals: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            }, "strip", z.ZodTypeAny, {
                status?: number | undefined;
                json?: any;
                bodyContains?: string | undefined;
                exit_code?: number | undefined;
                stdout_contains?: string | undefined;
                stderr_contains?: string | undefined;
                stdout_not_contains?: string | undefined;
                stderr_not_contains?: string | undefined;
                stdout_regex?: string | undefined;
                stderr_regex?: string | undefined;
                stdout_empty?: boolean | undefined;
                stderr_empty?: boolean | undefined;
                max_duration_ms?: number | undefined;
                rows?: number | undefined;
                equals?: Record<string, any> | undefined;
            }, {
                status?: number | undefined;
                json?: any;
                bodyContains?: string | undefined;
                exit_code?: number | undefined;
                stdout_contains?: string | undefined;
                stderr_contains?: string | undefined;
                stdout_not_contains?: string | undefined;
                stderr_not_contains?: string | undefined;
                stdout_regex?: string | undefined;
                stderr_regex?: string | undefined;
                stdout_empty?: boolean | undefined;
                stderr_empty?: boolean | undefined;
                max_duration_ms?: number | undefined;
                rows?: number | undefined;
                equals?: Record<string, any> | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            http: {
                path: string;
                method: string;
                headers?: Record<string, string> | undefined;
                query?: Record<string, string | number | boolean> | undefined;
                body?: string | number | boolean | any[] | Record<string, any> | {
                    json?: any;
                    jsonFile?: string | undefined;
                    text?: string | undefined;
                } | null | undefined;
                timeout_ms?: number | undefined;
                retries?: number | undefined;
            };
            expect?: {
                status?: number | undefined;
                json?: any;
                bodyContains?: string | undefined;
                exit_code?: number | undefined;
                stdout_contains?: string | undefined;
                stderr_contains?: string | undefined;
                stdout_not_contains?: string | undefined;
                stderr_not_contains?: string | undefined;
                stdout_regex?: string | undefined;
                stderr_regex?: string | undefined;
                stdout_empty?: boolean | undefined;
                stderr_empty?: boolean | undefined;
                max_duration_ms?: number | undefined;
                rows?: number | undefined;
                equals?: Record<string, any> | undefined;
            } | undefined;
        }, {
            http: {
                path: string;
                method: string;
                headers?: Record<string, string> | undefined;
                query?: Record<string, string | number | boolean> | undefined;
                body?: string | number | boolean | any[] | Record<string, any> | {
                    json?: any;
                    jsonFile?: string | undefined;
                    text?: string | undefined;
                } | null | undefined;
                timeout_ms?: number | undefined;
                retries?: number | undefined;
            };
            expect?: {
                status?: number | undefined;
                json?: any;
                bodyContains?: string | undefined;
                exit_code?: number | undefined;
                stdout_contains?: string | undefined;
                stderr_contains?: string | undefined;
                stdout_not_contains?: string | undefined;
                stderr_not_contains?: string | undefined;
                stdout_regex?: string | undefined;
                stderr_regex?: string | undefined;
                stdout_empty?: boolean | undefined;
                stderr_empty?: boolean | undefined;
                max_duration_ms?: number | undefined;
                rows?: number | undefined;
                equals?: Record<string, any> | undefined;
            } | undefined;
        }>, z.ZodObject<{
            exec: z.ZodObject<{
                run: z.ZodString;
                cwd: z.ZodOptional<z.ZodString>;
                env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
                timeout_ms: z.ZodOptional<z.ZodNumber>;
                retries: z.ZodOptional<z.ZodNumber>;
                max_output_chars: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                run: string;
                timeout_ms?: number | undefined;
                retries?: number | undefined;
                cwd?: string | undefined;
                env?: Record<string, string> | undefined;
                max_output_chars?: number | undefined;
            }, {
                run: string;
                timeout_ms?: number | undefined;
                retries?: number | undefined;
                cwd?: string | undefined;
                env?: Record<string, string> | undefined;
                max_output_chars?: number | undefined;
            }>;
            expect: z.ZodOptional<z.ZodObject<{
                status: z.ZodOptional<z.ZodNumber>;
                json: z.ZodOptional<z.ZodAny>;
                bodyContains: z.ZodOptional<z.ZodString>;
                exit_code: z.ZodOptional<z.ZodNumber>;
                stdout_contains: z.ZodOptional<z.ZodString>;
                stderr_contains: z.ZodOptional<z.ZodString>;
                stdout_not_contains: z.ZodOptional<z.ZodString>;
                stderr_not_contains: z.ZodOptional<z.ZodString>;
                stdout_regex: z.ZodOptional<z.ZodString>;
                stderr_regex: z.ZodOptional<z.ZodString>;
                stdout_empty: z.ZodOptional<z.ZodBoolean>;
                stderr_empty: z.ZodOptional<z.ZodBoolean>;
                max_duration_ms: z.ZodOptional<z.ZodNumber>;
                rows: z.ZodOptional<z.ZodNumber>;
                equals: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            }, "strip", z.ZodTypeAny, {
                status?: number | undefined;
                json?: any;
                bodyContains?: string | undefined;
                exit_code?: number | undefined;
                stdout_contains?: string | undefined;
                stderr_contains?: string | undefined;
                stdout_not_contains?: string | undefined;
                stderr_not_contains?: string | undefined;
                stdout_regex?: string | undefined;
                stderr_regex?: string | undefined;
                stdout_empty?: boolean | undefined;
                stderr_empty?: boolean | undefined;
                max_duration_ms?: number | undefined;
                rows?: number | undefined;
                equals?: Record<string, any> | undefined;
            }, {
                status?: number | undefined;
                json?: any;
                bodyContains?: string | undefined;
                exit_code?: number | undefined;
                stdout_contains?: string | undefined;
                stderr_contains?: string | undefined;
                stdout_not_contains?: string | undefined;
                stderr_not_contains?: string | undefined;
                stdout_regex?: string | undefined;
                stderr_regex?: string | undefined;
                stdout_empty?: boolean | undefined;
                stderr_empty?: boolean | undefined;
                max_duration_ms?: number | undefined;
                rows?: number | undefined;
                equals?: Record<string, any> | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            exec: {
                run: string;
                timeout_ms?: number | undefined;
                retries?: number | undefined;
                cwd?: string | undefined;
                env?: Record<string, string> | undefined;
                max_output_chars?: number | undefined;
            };
            expect?: {
                status?: number | undefined;
                json?: any;
                bodyContains?: string | undefined;
                exit_code?: number | undefined;
                stdout_contains?: string | undefined;
                stderr_contains?: string | undefined;
                stdout_not_contains?: string | undefined;
                stderr_not_contains?: string | undefined;
                stdout_regex?: string | undefined;
                stderr_regex?: string | undefined;
                stdout_empty?: boolean | undefined;
                stderr_empty?: boolean | undefined;
                max_duration_ms?: number | undefined;
                rows?: number | undefined;
                equals?: Record<string, any> | undefined;
            } | undefined;
        }, {
            exec: {
                run: string;
                timeout_ms?: number | undefined;
                retries?: number | undefined;
                cwd?: string | undefined;
                env?: Record<string, string> | undefined;
                max_output_chars?: number | undefined;
            };
            expect?: {
                status?: number | undefined;
                json?: any;
                bodyContains?: string | undefined;
                exit_code?: number | undefined;
                stdout_contains?: string | undefined;
                stderr_contains?: string | undefined;
                stdout_not_contains?: string | undefined;
                stderr_not_contains?: string | undefined;
                stdout_regex?: string | undefined;
                stderr_regex?: string | undefined;
                stdout_empty?: boolean | undefined;
                stderr_empty?: boolean | undefined;
                max_duration_ms?: number | undefined;
                rows?: number | undefined;
                equals?: Record<string, any> | undefined;
            } | undefined;
        }>, z.ZodObject<{
            sql: z.ZodObject<{
                driver: z.ZodLiteral<"postgres">;
                url_env: z.ZodString;
                query: z.ZodString;
                timeout_ms: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                query: string;
                driver: "postgres";
                url_env: string;
                timeout_ms?: number | undefined;
            }, {
                query: string;
                driver: "postgres";
                url_env: string;
                timeout_ms?: number | undefined;
            }>;
            expect: z.ZodOptional<z.ZodObject<{
                status: z.ZodOptional<z.ZodNumber>;
                json: z.ZodOptional<z.ZodAny>;
                bodyContains: z.ZodOptional<z.ZodString>;
                exit_code: z.ZodOptional<z.ZodNumber>;
                stdout_contains: z.ZodOptional<z.ZodString>;
                stderr_contains: z.ZodOptional<z.ZodString>;
                stdout_not_contains: z.ZodOptional<z.ZodString>;
                stderr_not_contains: z.ZodOptional<z.ZodString>;
                stdout_regex: z.ZodOptional<z.ZodString>;
                stderr_regex: z.ZodOptional<z.ZodString>;
                stdout_empty: z.ZodOptional<z.ZodBoolean>;
                stderr_empty: z.ZodOptional<z.ZodBoolean>;
                max_duration_ms: z.ZodOptional<z.ZodNumber>;
                rows: z.ZodOptional<z.ZodNumber>;
                equals: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            }, "strip", z.ZodTypeAny, {
                status?: number | undefined;
                json?: any;
                bodyContains?: string | undefined;
                exit_code?: number | undefined;
                stdout_contains?: string | undefined;
                stderr_contains?: string | undefined;
                stdout_not_contains?: string | undefined;
                stderr_not_contains?: string | undefined;
                stdout_regex?: string | undefined;
                stderr_regex?: string | undefined;
                stdout_empty?: boolean | undefined;
                stderr_empty?: boolean | undefined;
                max_duration_ms?: number | undefined;
                rows?: number | undefined;
                equals?: Record<string, any> | undefined;
            }, {
                status?: number | undefined;
                json?: any;
                bodyContains?: string | undefined;
                exit_code?: number | undefined;
                stdout_contains?: string | undefined;
                stderr_contains?: string | undefined;
                stdout_not_contains?: string | undefined;
                stderr_not_contains?: string | undefined;
                stdout_regex?: string | undefined;
                stderr_regex?: string | undefined;
                stdout_empty?: boolean | undefined;
                stderr_empty?: boolean | undefined;
                max_duration_ms?: number | undefined;
                rows?: number | undefined;
                equals?: Record<string, any> | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            sql: {
                query: string;
                driver: "postgres";
                url_env: string;
                timeout_ms?: number | undefined;
            };
            expect?: {
                status?: number | undefined;
                json?: any;
                bodyContains?: string | undefined;
                exit_code?: number | undefined;
                stdout_contains?: string | undefined;
                stderr_contains?: string | undefined;
                stdout_not_contains?: string | undefined;
                stderr_not_contains?: string | undefined;
                stdout_regex?: string | undefined;
                stderr_regex?: string | undefined;
                stdout_empty?: boolean | undefined;
                stderr_empty?: boolean | undefined;
                max_duration_ms?: number | undefined;
                rows?: number | undefined;
                equals?: Record<string, any> | undefined;
            } | undefined;
        }, {
            sql: {
                query: string;
                driver: "postgres";
                url_env: string;
                timeout_ms?: number | undefined;
            };
            expect?: {
                status?: number | undefined;
                json?: any;
                bodyContains?: string | undefined;
                exit_code?: number | undefined;
                stdout_contains?: string | undefined;
                stderr_contains?: string | undefined;
                stdout_not_contains?: string | undefined;
                stderr_not_contains?: string | undefined;
                stdout_regex?: string | undefined;
                stderr_regex?: string | undefined;
                stdout_empty?: boolean | undefined;
                stderr_empty?: boolean | undefined;
                max_duration_ms?: number | undefined;
                rows?: number | undefined;
                equals?: Record<string, any> | undefined;
            } | undefined;
        }>]>, "many">;
    }, "strip", z.ZodTypeAny, {
        id: string;
        steps: ({
            http: {
                path: string;
                method: string;
                headers?: Record<string, string> | undefined;
                query?: Record<string, string | number | boolean> | undefined;
                body?: string | number | boolean | any[] | Record<string, any> | {
                    json?: any;
                    jsonFile?: string | undefined;
                    text?: string | undefined;
                } | null | undefined;
                timeout_ms?: number | undefined;
                retries?: number | undefined;
            };
            expect?: {
                status?: number | undefined;
                json?: any;
                bodyContains?: string | undefined;
                exit_code?: number | undefined;
                stdout_contains?: string | undefined;
                stderr_contains?: string | undefined;
                stdout_not_contains?: string | undefined;
                stderr_not_contains?: string | undefined;
                stdout_regex?: string | undefined;
                stderr_regex?: string | undefined;
                stdout_empty?: boolean | undefined;
                stderr_empty?: boolean | undefined;
                max_duration_ms?: number | undefined;
                rows?: number | undefined;
                equals?: Record<string, any> | undefined;
            } | undefined;
        } | {
            exec: {
                run: string;
                timeout_ms?: number | undefined;
                retries?: number | undefined;
                cwd?: string | undefined;
                env?: Record<string, string> | undefined;
                max_output_chars?: number | undefined;
            };
            expect?: {
                status?: number | undefined;
                json?: any;
                bodyContains?: string | undefined;
                exit_code?: number | undefined;
                stdout_contains?: string | undefined;
                stderr_contains?: string | undefined;
                stdout_not_contains?: string | undefined;
                stderr_not_contains?: string | undefined;
                stdout_regex?: string | undefined;
                stderr_regex?: string | undefined;
                stdout_empty?: boolean | undefined;
                stderr_empty?: boolean | undefined;
                max_duration_ms?: number | undefined;
                rows?: number | undefined;
                equals?: Record<string, any> | undefined;
            } | undefined;
        } | {
            sql: {
                query: string;
                driver: "postgres";
                url_env: string;
                timeout_ms?: number | undefined;
            };
            expect?: {
                status?: number | undefined;
                json?: any;
                bodyContains?: string | undefined;
                exit_code?: number | undefined;
                stdout_contains?: string | undefined;
                stderr_contains?: string | undefined;
                stdout_not_contains?: string | undefined;
                stderr_not_contains?: string | undefined;
                stdout_regex?: string | undefined;
                stderr_regex?: string | undefined;
                stdout_empty?: boolean | undefined;
                stderr_empty?: boolean | undefined;
                max_duration_ms?: number | undefined;
                rows?: number | undefined;
                equals?: Record<string, any> | undefined;
            } | undefined;
        })[];
        says?: string | undefined;
        links?: string[] | undefined;
        work_item?: string | {
            key: string;
            says?: string | undefined;
            links?: string[] | undefined;
        } | undefined;
    }, {
        id: string;
        steps: ({
            http: {
                path: string;
                method: string;
                headers?: Record<string, string> | undefined;
                query?: Record<string, string | number | boolean> | undefined;
                body?: string | number | boolean | any[] | Record<string, any> | {
                    json?: any;
                    jsonFile?: string | undefined;
                    text?: string | undefined;
                } | null | undefined;
                timeout_ms?: number | undefined;
                retries?: number | undefined;
            };
            expect?: {
                status?: number | undefined;
                json?: any;
                bodyContains?: string | undefined;
                exit_code?: number | undefined;
                stdout_contains?: string | undefined;
                stderr_contains?: string | undefined;
                stdout_not_contains?: string | undefined;
                stderr_not_contains?: string | undefined;
                stdout_regex?: string | undefined;
                stderr_regex?: string | undefined;
                stdout_empty?: boolean | undefined;
                stderr_empty?: boolean | undefined;
                max_duration_ms?: number | undefined;
                rows?: number | undefined;
                equals?: Record<string, any> | undefined;
            } | undefined;
        } | {
            exec: {
                run: string;
                timeout_ms?: number | undefined;
                retries?: number | undefined;
                cwd?: string | undefined;
                env?: Record<string, string> | undefined;
                max_output_chars?: number | undefined;
            };
            expect?: {
                status?: number | undefined;
                json?: any;
                bodyContains?: string | undefined;
                exit_code?: number | undefined;
                stdout_contains?: string | undefined;
                stderr_contains?: string | undefined;
                stdout_not_contains?: string | undefined;
                stderr_not_contains?: string | undefined;
                stdout_regex?: string | undefined;
                stderr_regex?: string | undefined;
                stdout_empty?: boolean | undefined;
                stderr_empty?: boolean | undefined;
                max_duration_ms?: number | undefined;
                rows?: number | undefined;
                equals?: Record<string, any> | undefined;
            } | undefined;
        } | {
            sql: {
                query: string;
                driver: "postgres";
                url_env: string;
                timeout_ms?: number | undefined;
            };
            expect?: {
                status?: number | undefined;
                json?: any;
                bodyContains?: string | undefined;
                exit_code?: number | undefined;
                stdout_contains?: string | undefined;
                stderr_contains?: string | undefined;
                stdout_not_contains?: string | undefined;
                stderr_not_contains?: string | undefined;
                stdout_regex?: string | undefined;
                stderr_regex?: string | undefined;
                stdout_empty?: boolean | undefined;
                stderr_empty?: boolean | undefined;
                max_duration_ms?: number | undefined;
                rows?: number | undefined;
                equals?: Record<string, any> | undefined;
            } | undefined;
        })[];
        says?: string | undefined;
        links?: string[] | undefined;
        work_item?: string | {
            key: string;
            says?: string | undefined;
            links?: string[] | undefined;
        } | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    name: string;
    checks: {
        id: string;
        steps: ({
            http: {
                path: string;
                method: string;
                headers?: Record<string, string> | undefined;
                query?: Record<string, string | number | boolean> | undefined;
                body?: string | number | boolean | any[] | Record<string, any> | {
                    json?: any;
                    jsonFile?: string | undefined;
                    text?: string | undefined;
                } | null | undefined;
                timeout_ms?: number | undefined;
                retries?: number | undefined;
            };
            expect?: {
                status?: number | undefined;
                json?: any;
                bodyContains?: string | undefined;
                exit_code?: number | undefined;
                stdout_contains?: string | undefined;
                stderr_contains?: string | undefined;
                stdout_not_contains?: string | undefined;
                stderr_not_contains?: string | undefined;
                stdout_regex?: string | undefined;
                stderr_regex?: string | undefined;
                stdout_empty?: boolean | undefined;
                stderr_empty?: boolean | undefined;
                max_duration_ms?: number | undefined;
                rows?: number | undefined;
                equals?: Record<string, any> | undefined;
            } | undefined;
        } | {
            exec: {
                run: string;
                timeout_ms?: number | undefined;
                retries?: number | undefined;
                cwd?: string | undefined;
                env?: Record<string, string> | undefined;
                max_output_chars?: number | undefined;
            };
            expect?: {
                status?: number | undefined;
                json?: any;
                bodyContains?: string | undefined;
                exit_code?: number | undefined;
                stdout_contains?: string | undefined;
                stderr_contains?: string | undefined;
                stdout_not_contains?: string | undefined;
                stderr_not_contains?: string | undefined;
                stdout_regex?: string | undefined;
                stderr_regex?: string | undefined;
                stdout_empty?: boolean | undefined;
                stderr_empty?: boolean | undefined;
                max_duration_ms?: number | undefined;
                rows?: number | undefined;
                equals?: Record<string, any> | undefined;
            } | undefined;
        } | {
            sql: {
                query: string;
                driver: "postgres";
                url_env: string;
                timeout_ms?: number | undefined;
            };
            expect?: {
                status?: number | undefined;
                json?: any;
                bodyContains?: string | undefined;
                exit_code?: number | undefined;
                stdout_contains?: string | undefined;
                stderr_contains?: string | undefined;
                stdout_not_contains?: string | undefined;
                stderr_not_contains?: string | undefined;
                stdout_regex?: string | undefined;
                stderr_regex?: string | undefined;
                stdout_empty?: boolean | undefined;
                stderr_empty?: boolean | undefined;
                max_duration_ms?: number | undefined;
                rows?: number | undefined;
                equals?: Record<string, any> | undefined;
            } | undefined;
        })[];
        says?: string | undefined;
        links?: string[] | undefined;
        work_item?: string | {
            key: string;
            says?: string | undefined;
            links?: string[] | undefined;
        } | undefined;
    }[];
    description?: string | undefined;
}, {
    name: string;
    checks: {
        id: string;
        steps: ({
            http: {
                path: string;
                method: string;
                headers?: Record<string, string> | undefined;
                query?: Record<string, string | number | boolean> | undefined;
                body?: string | number | boolean | any[] | Record<string, any> | {
                    json?: any;
                    jsonFile?: string | undefined;
                    text?: string | undefined;
                } | null | undefined;
                timeout_ms?: number | undefined;
                retries?: number | undefined;
            };
            expect?: {
                status?: number | undefined;
                json?: any;
                bodyContains?: string | undefined;
                exit_code?: number | undefined;
                stdout_contains?: string | undefined;
                stderr_contains?: string | undefined;
                stdout_not_contains?: string | undefined;
                stderr_not_contains?: string | undefined;
                stdout_regex?: string | undefined;
                stderr_regex?: string | undefined;
                stdout_empty?: boolean | undefined;
                stderr_empty?: boolean | undefined;
                max_duration_ms?: number | undefined;
                rows?: number | undefined;
                equals?: Record<string, any> | undefined;
            } | undefined;
        } | {
            exec: {
                run: string;
                timeout_ms?: number | undefined;
                retries?: number | undefined;
                cwd?: string | undefined;
                env?: Record<string, string> | undefined;
                max_output_chars?: number | undefined;
            };
            expect?: {
                status?: number | undefined;
                json?: any;
                bodyContains?: string | undefined;
                exit_code?: number | undefined;
                stdout_contains?: string | undefined;
                stderr_contains?: string | undefined;
                stdout_not_contains?: string | undefined;
                stderr_not_contains?: string | undefined;
                stdout_regex?: string | undefined;
                stderr_regex?: string | undefined;
                stdout_empty?: boolean | undefined;
                stderr_empty?: boolean | undefined;
                max_duration_ms?: number | undefined;
                rows?: number | undefined;
                equals?: Record<string, any> | undefined;
            } | undefined;
        } | {
            sql: {
                query: string;
                driver: "postgres";
                url_env: string;
                timeout_ms?: number | undefined;
            };
            expect?: {
                status?: number | undefined;
                json?: any;
                bodyContains?: string | undefined;
                exit_code?: number | undefined;
                stdout_contains?: string | undefined;
                stderr_contains?: string | undefined;
                stdout_not_contains?: string | undefined;
                stderr_not_contains?: string | undefined;
                stdout_regex?: string | undefined;
                stderr_regex?: string | undefined;
                stdout_empty?: boolean | undefined;
                stderr_empty?: boolean | undefined;
                max_duration_ms?: number | undefined;
                rows?: number | undefined;
                equals?: Record<string, any> | undefined;
            } | undefined;
        })[];
        says?: string | undefined;
        links?: string[] | undefined;
        work_item?: string | {
            key: string;
            says?: string | undefined;
            links?: string[] | undefined;
        } | undefined;
    }[];
    description?: string | undefined;
}>;
declare const SuiteSchema: z.ZodObject<{
    version: z.ZodLiteral<1>;
    feature: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    contracts: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        checks: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            /**
             * Supported forms:
             *
             * 1) Simple:
             *    work_item: "KAN-123"
             *    says: "..."
             *    links: ["..."]
             *
             * 2) Structured:
             *    work_item:
             *      key: "KAN-123"
             *      says: "..."
             *      links: ["..."]
             *
             * Top-level says/links remain supported for backward compatibility
             * and can be used as fallbacks when work_item is a string.
             */
            work_item: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
                key: z.ZodString;
                says: z.ZodOptional<z.ZodString>;
                links: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strip", z.ZodTypeAny, {
                key: string;
                says?: string | undefined;
                links?: string[] | undefined;
            }, {
                key: string;
                says?: string | undefined;
                links?: string[] | undefined;
            }>]>>;
            says: z.ZodOptional<z.ZodString>;
            links: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            steps: z.ZodArray<z.ZodUnion<[z.ZodObject<{
                http: z.ZodObject<{
                    method: z.ZodString;
                    path: z.ZodString;
                    headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
                    query: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>>>;
                    /**
                     * Back-compat + UX:
                     * - body: { json: ... }      (preferred)
                     * - body: { jsonFile: ... }  (preferred)
                     * - body: { text: ... }      (preferred)
                     * - body: { ... }            (legacy direct JSON object allowed)
                     * - body: "raw string"       (legacy)
                     */
                    body: z.ZodOptional<z.ZodUnion<[z.ZodEffects<z.ZodObject<{
                        json: z.ZodOptional<z.ZodAny>;
                        jsonFile: z.ZodOptional<z.ZodString>;
                        text: z.ZodOptional<z.ZodString>;
                    }, "strip", z.ZodTypeAny, {
                        json?: any;
                        jsonFile?: string | undefined;
                        text?: string | undefined;
                    }, {
                        json?: any;
                        jsonFile?: string | undefined;
                        text?: string | undefined;
                    }>, {
                        json?: any;
                        jsonFile?: string | undefined;
                        text?: string | undefined;
                    }, {
                        json?: any;
                        jsonFile?: string | undefined;
                        text?: string | undefined;
                    }>, z.ZodString, z.ZodRecord<z.ZodString, z.ZodAny>, z.ZodArray<z.ZodAny, "many">, z.ZodNumber, z.ZodBoolean, z.ZodNull]>>;
                    timeout_ms: z.ZodOptional<z.ZodNumber>;
                    retries: z.ZodOptional<z.ZodNumber>;
                }, "strip", z.ZodTypeAny, {
                    path: string;
                    method: string;
                    headers?: Record<string, string> | undefined;
                    query?: Record<string, string | number | boolean> | undefined;
                    body?: string | number | boolean | any[] | Record<string, any> | {
                        json?: any;
                        jsonFile?: string | undefined;
                        text?: string | undefined;
                    } | null | undefined;
                    timeout_ms?: number | undefined;
                    retries?: number | undefined;
                }, {
                    path: string;
                    method: string;
                    headers?: Record<string, string> | undefined;
                    query?: Record<string, string | number | boolean> | undefined;
                    body?: string | number | boolean | any[] | Record<string, any> | {
                        json?: any;
                        jsonFile?: string | undefined;
                        text?: string | undefined;
                    } | null | undefined;
                    timeout_ms?: number | undefined;
                    retries?: number | undefined;
                }>;
                expect: z.ZodOptional<z.ZodObject<{
                    status: z.ZodOptional<z.ZodNumber>;
                    json: z.ZodOptional<z.ZodAny>;
                    bodyContains: z.ZodOptional<z.ZodString>;
                    exit_code: z.ZodOptional<z.ZodNumber>;
                    stdout_contains: z.ZodOptional<z.ZodString>;
                    stderr_contains: z.ZodOptional<z.ZodString>;
                    stdout_not_contains: z.ZodOptional<z.ZodString>;
                    stderr_not_contains: z.ZodOptional<z.ZodString>;
                    stdout_regex: z.ZodOptional<z.ZodString>;
                    stderr_regex: z.ZodOptional<z.ZodString>;
                    stdout_empty: z.ZodOptional<z.ZodBoolean>;
                    stderr_empty: z.ZodOptional<z.ZodBoolean>;
                    max_duration_ms: z.ZodOptional<z.ZodNumber>;
                    rows: z.ZodOptional<z.ZodNumber>;
                    equals: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
                }, "strip", z.ZodTypeAny, {
                    status?: number | undefined;
                    json?: any;
                    bodyContains?: string | undefined;
                    exit_code?: number | undefined;
                    stdout_contains?: string | undefined;
                    stderr_contains?: string | undefined;
                    stdout_not_contains?: string | undefined;
                    stderr_not_contains?: string | undefined;
                    stdout_regex?: string | undefined;
                    stderr_regex?: string | undefined;
                    stdout_empty?: boolean | undefined;
                    stderr_empty?: boolean | undefined;
                    max_duration_ms?: number | undefined;
                    rows?: number | undefined;
                    equals?: Record<string, any> | undefined;
                }, {
                    status?: number | undefined;
                    json?: any;
                    bodyContains?: string | undefined;
                    exit_code?: number | undefined;
                    stdout_contains?: string | undefined;
                    stderr_contains?: string | undefined;
                    stdout_not_contains?: string | undefined;
                    stderr_not_contains?: string | undefined;
                    stdout_regex?: string | undefined;
                    stderr_regex?: string | undefined;
                    stdout_empty?: boolean | undefined;
                    stderr_empty?: boolean | undefined;
                    max_duration_ms?: number | undefined;
                    rows?: number | undefined;
                    equals?: Record<string, any> | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                http: {
                    path: string;
                    method: string;
                    headers?: Record<string, string> | undefined;
                    query?: Record<string, string | number | boolean> | undefined;
                    body?: string | number | boolean | any[] | Record<string, any> | {
                        json?: any;
                        jsonFile?: string | undefined;
                        text?: string | undefined;
                    } | null | undefined;
                    timeout_ms?: number | undefined;
                    retries?: number | undefined;
                };
                expect?: {
                    status?: number | undefined;
                    json?: any;
                    bodyContains?: string | undefined;
                    exit_code?: number | undefined;
                    stdout_contains?: string | undefined;
                    stderr_contains?: string | undefined;
                    stdout_not_contains?: string | undefined;
                    stderr_not_contains?: string | undefined;
                    stdout_regex?: string | undefined;
                    stderr_regex?: string | undefined;
                    stdout_empty?: boolean | undefined;
                    stderr_empty?: boolean | undefined;
                    max_duration_ms?: number | undefined;
                    rows?: number | undefined;
                    equals?: Record<string, any> | undefined;
                } | undefined;
            }, {
                http: {
                    path: string;
                    method: string;
                    headers?: Record<string, string> | undefined;
                    query?: Record<string, string | number | boolean> | undefined;
                    body?: string | number | boolean | any[] | Record<string, any> | {
                        json?: any;
                        jsonFile?: string | undefined;
                        text?: string | undefined;
                    } | null | undefined;
                    timeout_ms?: number | undefined;
                    retries?: number | undefined;
                };
                expect?: {
                    status?: number | undefined;
                    json?: any;
                    bodyContains?: string | undefined;
                    exit_code?: number | undefined;
                    stdout_contains?: string | undefined;
                    stderr_contains?: string | undefined;
                    stdout_not_contains?: string | undefined;
                    stderr_not_contains?: string | undefined;
                    stdout_regex?: string | undefined;
                    stderr_regex?: string | undefined;
                    stdout_empty?: boolean | undefined;
                    stderr_empty?: boolean | undefined;
                    max_duration_ms?: number | undefined;
                    rows?: number | undefined;
                    equals?: Record<string, any> | undefined;
                } | undefined;
            }>, z.ZodObject<{
                exec: z.ZodObject<{
                    run: z.ZodString;
                    cwd: z.ZodOptional<z.ZodString>;
                    env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
                    timeout_ms: z.ZodOptional<z.ZodNumber>;
                    retries: z.ZodOptional<z.ZodNumber>;
                    max_output_chars: z.ZodOptional<z.ZodNumber>;
                }, "strip", z.ZodTypeAny, {
                    run: string;
                    timeout_ms?: number | undefined;
                    retries?: number | undefined;
                    cwd?: string | undefined;
                    env?: Record<string, string> | undefined;
                    max_output_chars?: number | undefined;
                }, {
                    run: string;
                    timeout_ms?: number | undefined;
                    retries?: number | undefined;
                    cwd?: string | undefined;
                    env?: Record<string, string> | undefined;
                    max_output_chars?: number | undefined;
                }>;
                expect: z.ZodOptional<z.ZodObject<{
                    status: z.ZodOptional<z.ZodNumber>;
                    json: z.ZodOptional<z.ZodAny>;
                    bodyContains: z.ZodOptional<z.ZodString>;
                    exit_code: z.ZodOptional<z.ZodNumber>;
                    stdout_contains: z.ZodOptional<z.ZodString>;
                    stderr_contains: z.ZodOptional<z.ZodString>;
                    stdout_not_contains: z.ZodOptional<z.ZodString>;
                    stderr_not_contains: z.ZodOptional<z.ZodString>;
                    stdout_regex: z.ZodOptional<z.ZodString>;
                    stderr_regex: z.ZodOptional<z.ZodString>;
                    stdout_empty: z.ZodOptional<z.ZodBoolean>;
                    stderr_empty: z.ZodOptional<z.ZodBoolean>;
                    max_duration_ms: z.ZodOptional<z.ZodNumber>;
                    rows: z.ZodOptional<z.ZodNumber>;
                    equals: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
                }, "strip", z.ZodTypeAny, {
                    status?: number | undefined;
                    json?: any;
                    bodyContains?: string | undefined;
                    exit_code?: number | undefined;
                    stdout_contains?: string | undefined;
                    stderr_contains?: string | undefined;
                    stdout_not_contains?: string | undefined;
                    stderr_not_contains?: string | undefined;
                    stdout_regex?: string | undefined;
                    stderr_regex?: string | undefined;
                    stdout_empty?: boolean | undefined;
                    stderr_empty?: boolean | undefined;
                    max_duration_ms?: number | undefined;
                    rows?: number | undefined;
                    equals?: Record<string, any> | undefined;
                }, {
                    status?: number | undefined;
                    json?: any;
                    bodyContains?: string | undefined;
                    exit_code?: number | undefined;
                    stdout_contains?: string | undefined;
                    stderr_contains?: string | undefined;
                    stdout_not_contains?: string | undefined;
                    stderr_not_contains?: string | undefined;
                    stdout_regex?: string | undefined;
                    stderr_regex?: string | undefined;
                    stdout_empty?: boolean | undefined;
                    stderr_empty?: boolean | undefined;
                    max_duration_ms?: number | undefined;
                    rows?: number | undefined;
                    equals?: Record<string, any> | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                exec: {
                    run: string;
                    timeout_ms?: number | undefined;
                    retries?: number | undefined;
                    cwd?: string | undefined;
                    env?: Record<string, string> | undefined;
                    max_output_chars?: number | undefined;
                };
                expect?: {
                    status?: number | undefined;
                    json?: any;
                    bodyContains?: string | undefined;
                    exit_code?: number | undefined;
                    stdout_contains?: string | undefined;
                    stderr_contains?: string | undefined;
                    stdout_not_contains?: string | undefined;
                    stderr_not_contains?: string | undefined;
                    stdout_regex?: string | undefined;
                    stderr_regex?: string | undefined;
                    stdout_empty?: boolean | undefined;
                    stderr_empty?: boolean | undefined;
                    max_duration_ms?: number | undefined;
                    rows?: number | undefined;
                    equals?: Record<string, any> | undefined;
                } | undefined;
            }, {
                exec: {
                    run: string;
                    timeout_ms?: number | undefined;
                    retries?: number | undefined;
                    cwd?: string | undefined;
                    env?: Record<string, string> | undefined;
                    max_output_chars?: number | undefined;
                };
                expect?: {
                    status?: number | undefined;
                    json?: any;
                    bodyContains?: string | undefined;
                    exit_code?: number | undefined;
                    stdout_contains?: string | undefined;
                    stderr_contains?: string | undefined;
                    stdout_not_contains?: string | undefined;
                    stderr_not_contains?: string | undefined;
                    stdout_regex?: string | undefined;
                    stderr_regex?: string | undefined;
                    stdout_empty?: boolean | undefined;
                    stderr_empty?: boolean | undefined;
                    max_duration_ms?: number | undefined;
                    rows?: number | undefined;
                    equals?: Record<string, any> | undefined;
                } | undefined;
            }>, z.ZodObject<{
                sql: z.ZodObject<{
                    driver: z.ZodLiteral<"postgres">;
                    url_env: z.ZodString;
                    query: z.ZodString;
                    timeout_ms: z.ZodOptional<z.ZodNumber>;
                }, "strip", z.ZodTypeAny, {
                    query: string;
                    driver: "postgres";
                    url_env: string;
                    timeout_ms?: number | undefined;
                }, {
                    query: string;
                    driver: "postgres";
                    url_env: string;
                    timeout_ms?: number | undefined;
                }>;
                expect: z.ZodOptional<z.ZodObject<{
                    status: z.ZodOptional<z.ZodNumber>;
                    json: z.ZodOptional<z.ZodAny>;
                    bodyContains: z.ZodOptional<z.ZodString>;
                    exit_code: z.ZodOptional<z.ZodNumber>;
                    stdout_contains: z.ZodOptional<z.ZodString>;
                    stderr_contains: z.ZodOptional<z.ZodString>;
                    stdout_not_contains: z.ZodOptional<z.ZodString>;
                    stderr_not_contains: z.ZodOptional<z.ZodString>;
                    stdout_regex: z.ZodOptional<z.ZodString>;
                    stderr_regex: z.ZodOptional<z.ZodString>;
                    stdout_empty: z.ZodOptional<z.ZodBoolean>;
                    stderr_empty: z.ZodOptional<z.ZodBoolean>;
                    max_duration_ms: z.ZodOptional<z.ZodNumber>;
                    rows: z.ZodOptional<z.ZodNumber>;
                    equals: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
                }, "strip", z.ZodTypeAny, {
                    status?: number | undefined;
                    json?: any;
                    bodyContains?: string | undefined;
                    exit_code?: number | undefined;
                    stdout_contains?: string | undefined;
                    stderr_contains?: string | undefined;
                    stdout_not_contains?: string | undefined;
                    stderr_not_contains?: string | undefined;
                    stdout_regex?: string | undefined;
                    stderr_regex?: string | undefined;
                    stdout_empty?: boolean | undefined;
                    stderr_empty?: boolean | undefined;
                    max_duration_ms?: number | undefined;
                    rows?: number | undefined;
                    equals?: Record<string, any> | undefined;
                }, {
                    status?: number | undefined;
                    json?: any;
                    bodyContains?: string | undefined;
                    exit_code?: number | undefined;
                    stdout_contains?: string | undefined;
                    stderr_contains?: string | undefined;
                    stdout_not_contains?: string | undefined;
                    stderr_not_contains?: string | undefined;
                    stdout_regex?: string | undefined;
                    stderr_regex?: string | undefined;
                    stdout_empty?: boolean | undefined;
                    stderr_empty?: boolean | undefined;
                    max_duration_ms?: number | undefined;
                    rows?: number | undefined;
                    equals?: Record<string, any> | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                sql: {
                    query: string;
                    driver: "postgres";
                    url_env: string;
                    timeout_ms?: number | undefined;
                };
                expect?: {
                    status?: number | undefined;
                    json?: any;
                    bodyContains?: string | undefined;
                    exit_code?: number | undefined;
                    stdout_contains?: string | undefined;
                    stderr_contains?: string | undefined;
                    stdout_not_contains?: string | undefined;
                    stderr_not_contains?: string | undefined;
                    stdout_regex?: string | undefined;
                    stderr_regex?: string | undefined;
                    stdout_empty?: boolean | undefined;
                    stderr_empty?: boolean | undefined;
                    max_duration_ms?: number | undefined;
                    rows?: number | undefined;
                    equals?: Record<string, any> | undefined;
                } | undefined;
            }, {
                sql: {
                    query: string;
                    driver: "postgres";
                    url_env: string;
                    timeout_ms?: number | undefined;
                };
                expect?: {
                    status?: number | undefined;
                    json?: any;
                    bodyContains?: string | undefined;
                    exit_code?: number | undefined;
                    stdout_contains?: string | undefined;
                    stderr_contains?: string | undefined;
                    stdout_not_contains?: string | undefined;
                    stderr_not_contains?: string | undefined;
                    stdout_regex?: string | undefined;
                    stderr_regex?: string | undefined;
                    stdout_empty?: boolean | undefined;
                    stderr_empty?: boolean | undefined;
                    max_duration_ms?: number | undefined;
                    rows?: number | undefined;
                    equals?: Record<string, any> | undefined;
                } | undefined;
            }>]>, "many">;
        }, "strip", z.ZodTypeAny, {
            id: string;
            steps: ({
                http: {
                    path: string;
                    method: string;
                    headers?: Record<string, string> | undefined;
                    query?: Record<string, string | number | boolean> | undefined;
                    body?: string | number | boolean | any[] | Record<string, any> | {
                        json?: any;
                        jsonFile?: string | undefined;
                        text?: string | undefined;
                    } | null | undefined;
                    timeout_ms?: number | undefined;
                    retries?: number | undefined;
                };
                expect?: {
                    status?: number | undefined;
                    json?: any;
                    bodyContains?: string | undefined;
                    exit_code?: number | undefined;
                    stdout_contains?: string | undefined;
                    stderr_contains?: string | undefined;
                    stdout_not_contains?: string | undefined;
                    stderr_not_contains?: string | undefined;
                    stdout_regex?: string | undefined;
                    stderr_regex?: string | undefined;
                    stdout_empty?: boolean | undefined;
                    stderr_empty?: boolean | undefined;
                    max_duration_ms?: number | undefined;
                    rows?: number | undefined;
                    equals?: Record<string, any> | undefined;
                } | undefined;
            } | {
                exec: {
                    run: string;
                    timeout_ms?: number | undefined;
                    retries?: number | undefined;
                    cwd?: string | undefined;
                    env?: Record<string, string> | undefined;
                    max_output_chars?: number | undefined;
                };
                expect?: {
                    status?: number | undefined;
                    json?: any;
                    bodyContains?: string | undefined;
                    exit_code?: number | undefined;
                    stdout_contains?: string | undefined;
                    stderr_contains?: string | undefined;
                    stdout_not_contains?: string | undefined;
                    stderr_not_contains?: string | undefined;
                    stdout_regex?: string | undefined;
                    stderr_regex?: string | undefined;
                    stdout_empty?: boolean | undefined;
                    stderr_empty?: boolean | undefined;
                    max_duration_ms?: number | undefined;
                    rows?: number | undefined;
                    equals?: Record<string, any> | undefined;
                } | undefined;
            } | {
                sql: {
                    query: string;
                    driver: "postgres";
                    url_env: string;
                    timeout_ms?: number | undefined;
                };
                expect?: {
                    status?: number | undefined;
                    json?: any;
                    bodyContains?: string | undefined;
                    exit_code?: number | undefined;
                    stdout_contains?: string | undefined;
                    stderr_contains?: string | undefined;
                    stdout_not_contains?: string | undefined;
                    stderr_not_contains?: string | undefined;
                    stdout_regex?: string | undefined;
                    stderr_regex?: string | undefined;
                    stdout_empty?: boolean | undefined;
                    stderr_empty?: boolean | undefined;
                    max_duration_ms?: number | undefined;
                    rows?: number | undefined;
                    equals?: Record<string, any> | undefined;
                } | undefined;
            })[];
            says?: string | undefined;
            links?: string[] | undefined;
            work_item?: string | {
                key: string;
                says?: string | undefined;
                links?: string[] | undefined;
            } | undefined;
        }, {
            id: string;
            steps: ({
                http: {
                    path: string;
                    method: string;
                    headers?: Record<string, string> | undefined;
                    query?: Record<string, string | number | boolean> | undefined;
                    body?: string | number | boolean | any[] | Record<string, any> | {
                        json?: any;
                        jsonFile?: string | undefined;
                        text?: string | undefined;
                    } | null | undefined;
                    timeout_ms?: number | undefined;
                    retries?: number | undefined;
                };
                expect?: {
                    status?: number | undefined;
                    json?: any;
                    bodyContains?: string | undefined;
                    exit_code?: number | undefined;
                    stdout_contains?: string | undefined;
                    stderr_contains?: string | undefined;
                    stdout_not_contains?: string | undefined;
                    stderr_not_contains?: string | undefined;
                    stdout_regex?: string | undefined;
                    stderr_regex?: string | undefined;
                    stdout_empty?: boolean | undefined;
                    stderr_empty?: boolean | undefined;
                    max_duration_ms?: number | undefined;
                    rows?: number | undefined;
                    equals?: Record<string, any> | undefined;
                } | undefined;
            } | {
                exec: {
                    run: string;
                    timeout_ms?: number | undefined;
                    retries?: number | undefined;
                    cwd?: string | undefined;
                    env?: Record<string, string> | undefined;
                    max_output_chars?: number | undefined;
                };
                expect?: {
                    status?: number | undefined;
                    json?: any;
                    bodyContains?: string | undefined;
                    exit_code?: number | undefined;
                    stdout_contains?: string | undefined;
                    stderr_contains?: string | undefined;
                    stdout_not_contains?: string | undefined;
                    stderr_not_contains?: string | undefined;
                    stdout_regex?: string | undefined;
                    stderr_regex?: string | undefined;
                    stdout_empty?: boolean | undefined;
                    stderr_empty?: boolean | undefined;
                    max_duration_ms?: number | undefined;
                    rows?: number | undefined;
                    equals?: Record<string, any> | undefined;
                } | undefined;
            } | {
                sql: {
                    query: string;
                    driver: "postgres";
                    url_env: string;
                    timeout_ms?: number | undefined;
                };
                expect?: {
                    status?: number | undefined;
                    json?: any;
                    bodyContains?: string | undefined;
                    exit_code?: number | undefined;
                    stdout_contains?: string | undefined;
                    stderr_contains?: string | undefined;
                    stdout_not_contains?: string | undefined;
                    stderr_not_contains?: string | undefined;
                    stdout_regex?: string | undefined;
                    stderr_regex?: string | undefined;
                    stdout_empty?: boolean | undefined;
                    stderr_empty?: boolean | undefined;
                    max_duration_ms?: number | undefined;
                    rows?: number | undefined;
                    equals?: Record<string, any> | undefined;
                } | undefined;
            })[];
            says?: string | undefined;
            links?: string[] | undefined;
            work_item?: string | {
                key: string;
                says?: string | undefined;
                links?: string[] | undefined;
            } | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        name: string;
        checks: {
            id: string;
            steps: ({
                http: {
                    path: string;
                    method: string;
                    headers?: Record<string, string> | undefined;
                    query?: Record<string, string | number | boolean> | undefined;
                    body?: string | number | boolean | any[] | Record<string, any> | {
                        json?: any;
                        jsonFile?: string | undefined;
                        text?: string | undefined;
                    } | null | undefined;
                    timeout_ms?: number | undefined;
                    retries?: number | undefined;
                };
                expect?: {
                    status?: number | undefined;
                    json?: any;
                    bodyContains?: string | undefined;
                    exit_code?: number | undefined;
                    stdout_contains?: string | undefined;
                    stderr_contains?: string | undefined;
                    stdout_not_contains?: string | undefined;
                    stderr_not_contains?: string | undefined;
                    stdout_regex?: string | undefined;
                    stderr_regex?: string | undefined;
                    stdout_empty?: boolean | undefined;
                    stderr_empty?: boolean | undefined;
                    max_duration_ms?: number | undefined;
                    rows?: number | undefined;
                    equals?: Record<string, any> | undefined;
                } | undefined;
            } | {
                exec: {
                    run: string;
                    timeout_ms?: number | undefined;
                    retries?: number | undefined;
                    cwd?: string | undefined;
                    env?: Record<string, string> | undefined;
                    max_output_chars?: number | undefined;
                };
                expect?: {
                    status?: number | undefined;
                    json?: any;
                    bodyContains?: string | undefined;
                    exit_code?: number | undefined;
                    stdout_contains?: string | undefined;
                    stderr_contains?: string | undefined;
                    stdout_not_contains?: string | undefined;
                    stderr_not_contains?: string | undefined;
                    stdout_regex?: string | undefined;
                    stderr_regex?: string | undefined;
                    stdout_empty?: boolean | undefined;
                    stderr_empty?: boolean | undefined;
                    max_duration_ms?: number | undefined;
                    rows?: number | undefined;
                    equals?: Record<string, any> | undefined;
                } | undefined;
            } | {
                sql: {
                    query: string;
                    driver: "postgres";
                    url_env: string;
                    timeout_ms?: number | undefined;
                };
                expect?: {
                    status?: number | undefined;
                    json?: any;
                    bodyContains?: string | undefined;
                    exit_code?: number | undefined;
                    stdout_contains?: string | undefined;
                    stderr_contains?: string | undefined;
                    stdout_not_contains?: string | undefined;
                    stderr_not_contains?: string | undefined;
                    stdout_regex?: string | undefined;
                    stderr_regex?: string | undefined;
                    stdout_empty?: boolean | undefined;
                    stderr_empty?: boolean | undefined;
                    max_duration_ms?: number | undefined;
                    rows?: number | undefined;
                    equals?: Record<string, any> | undefined;
                } | undefined;
            })[];
            says?: string | undefined;
            links?: string[] | undefined;
            work_item?: string | {
                key: string;
                says?: string | undefined;
                links?: string[] | undefined;
            } | undefined;
        }[];
        description?: string | undefined;
    }, {
        name: string;
        checks: {
            id: string;
            steps: ({
                http: {
                    path: string;
                    method: string;
                    headers?: Record<string, string> | undefined;
                    query?: Record<string, string | number | boolean> | undefined;
                    body?: string | number | boolean | any[] | Record<string, any> | {
                        json?: any;
                        jsonFile?: string | undefined;
                        text?: string | undefined;
                    } | null | undefined;
                    timeout_ms?: number | undefined;
                    retries?: number | undefined;
                };
                expect?: {
                    status?: number | undefined;
                    json?: any;
                    bodyContains?: string | undefined;
                    exit_code?: number | undefined;
                    stdout_contains?: string | undefined;
                    stderr_contains?: string | undefined;
                    stdout_not_contains?: string | undefined;
                    stderr_not_contains?: string | undefined;
                    stdout_regex?: string | undefined;
                    stderr_regex?: string | undefined;
                    stdout_empty?: boolean | undefined;
                    stderr_empty?: boolean | undefined;
                    max_duration_ms?: number | undefined;
                    rows?: number | undefined;
                    equals?: Record<string, any> | undefined;
                } | undefined;
            } | {
                exec: {
                    run: string;
                    timeout_ms?: number | undefined;
                    retries?: number | undefined;
                    cwd?: string | undefined;
                    env?: Record<string, string> | undefined;
                    max_output_chars?: number | undefined;
                };
                expect?: {
                    status?: number | undefined;
                    json?: any;
                    bodyContains?: string | undefined;
                    exit_code?: number | undefined;
                    stdout_contains?: string | undefined;
                    stderr_contains?: string | undefined;
                    stdout_not_contains?: string | undefined;
                    stderr_not_contains?: string | undefined;
                    stdout_regex?: string | undefined;
                    stderr_regex?: string | undefined;
                    stdout_empty?: boolean | undefined;
                    stderr_empty?: boolean | undefined;
                    max_duration_ms?: number | undefined;
                    rows?: number | undefined;
                    equals?: Record<string, any> | undefined;
                } | undefined;
            } | {
                sql: {
                    query: string;
                    driver: "postgres";
                    url_env: string;
                    timeout_ms?: number | undefined;
                };
                expect?: {
                    status?: number | undefined;
                    json?: any;
                    bodyContains?: string | undefined;
                    exit_code?: number | undefined;
                    stdout_contains?: string | undefined;
                    stderr_contains?: string | undefined;
                    stdout_not_contains?: string | undefined;
                    stderr_not_contains?: string | undefined;
                    stdout_regex?: string | undefined;
                    stderr_regex?: string | undefined;
                    stdout_empty?: boolean | undefined;
                    stderr_empty?: boolean | undefined;
                    max_duration_ms?: number | undefined;
                    rows?: number | undefined;
                    equals?: Record<string, any> | undefined;
                } | undefined;
            })[];
            says?: string | undefined;
            links?: string[] | undefined;
            work_item?: string | {
                key: string;
                says?: string | undefined;
                links?: string[] | undefined;
            } | undefined;
        }[];
        description?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    version: 1;
    feature: string;
    contracts: {
        name: string;
        checks: {
            id: string;
            steps: ({
                http: {
                    path: string;
                    method: string;
                    headers?: Record<string, string> | undefined;
                    query?: Record<string, string | number | boolean> | undefined;
                    body?: string | number | boolean | any[] | Record<string, any> | {
                        json?: any;
                        jsonFile?: string | undefined;
                        text?: string | undefined;
                    } | null | undefined;
                    timeout_ms?: number | undefined;
                    retries?: number | undefined;
                };
                expect?: {
                    status?: number | undefined;
                    json?: any;
                    bodyContains?: string | undefined;
                    exit_code?: number | undefined;
                    stdout_contains?: string | undefined;
                    stderr_contains?: string | undefined;
                    stdout_not_contains?: string | undefined;
                    stderr_not_contains?: string | undefined;
                    stdout_regex?: string | undefined;
                    stderr_regex?: string | undefined;
                    stdout_empty?: boolean | undefined;
                    stderr_empty?: boolean | undefined;
                    max_duration_ms?: number | undefined;
                    rows?: number | undefined;
                    equals?: Record<string, any> | undefined;
                } | undefined;
            } | {
                exec: {
                    run: string;
                    timeout_ms?: number | undefined;
                    retries?: number | undefined;
                    cwd?: string | undefined;
                    env?: Record<string, string> | undefined;
                    max_output_chars?: number | undefined;
                };
                expect?: {
                    status?: number | undefined;
                    json?: any;
                    bodyContains?: string | undefined;
                    exit_code?: number | undefined;
                    stdout_contains?: string | undefined;
                    stderr_contains?: string | undefined;
                    stdout_not_contains?: string | undefined;
                    stderr_not_contains?: string | undefined;
                    stdout_regex?: string | undefined;
                    stderr_regex?: string | undefined;
                    stdout_empty?: boolean | undefined;
                    stderr_empty?: boolean | undefined;
                    max_duration_ms?: number | undefined;
                    rows?: number | undefined;
                    equals?: Record<string, any> | undefined;
                } | undefined;
            } | {
                sql: {
                    query: string;
                    driver: "postgres";
                    url_env: string;
                    timeout_ms?: number | undefined;
                };
                expect?: {
                    status?: number | undefined;
                    json?: any;
                    bodyContains?: string | undefined;
                    exit_code?: number | undefined;
                    stdout_contains?: string | undefined;
                    stderr_contains?: string | undefined;
                    stdout_not_contains?: string | undefined;
                    stderr_not_contains?: string | undefined;
                    stdout_regex?: string | undefined;
                    stderr_regex?: string | undefined;
                    stdout_empty?: boolean | undefined;
                    stderr_empty?: boolean | undefined;
                    max_duration_ms?: number | undefined;
                    rows?: number | undefined;
                    equals?: Record<string, any> | undefined;
                } | undefined;
            })[];
            says?: string | undefined;
            links?: string[] | undefined;
            work_item?: string | {
                key: string;
                says?: string | undefined;
                links?: string[] | undefined;
            } | undefined;
        }[];
        description?: string | undefined;
    }[];
    description?: string | undefined;
}, {
    version: 1;
    feature: string;
    contracts: {
        name: string;
        checks: {
            id: string;
            steps: ({
                http: {
                    path: string;
                    method: string;
                    headers?: Record<string, string> | undefined;
                    query?: Record<string, string | number | boolean> | undefined;
                    body?: string | number | boolean | any[] | Record<string, any> | {
                        json?: any;
                        jsonFile?: string | undefined;
                        text?: string | undefined;
                    } | null | undefined;
                    timeout_ms?: number | undefined;
                    retries?: number | undefined;
                };
                expect?: {
                    status?: number | undefined;
                    json?: any;
                    bodyContains?: string | undefined;
                    exit_code?: number | undefined;
                    stdout_contains?: string | undefined;
                    stderr_contains?: string | undefined;
                    stdout_not_contains?: string | undefined;
                    stderr_not_contains?: string | undefined;
                    stdout_regex?: string | undefined;
                    stderr_regex?: string | undefined;
                    stdout_empty?: boolean | undefined;
                    stderr_empty?: boolean | undefined;
                    max_duration_ms?: number | undefined;
                    rows?: number | undefined;
                    equals?: Record<string, any> | undefined;
                } | undefined;
            } | {
                exec: {
                    run: string;
                    timeout_ms?: number | undefined;
                    retries?: number | undefined;
                    cwd?: string | undefined;
                    env?: Record<string, string> | undefined;
                    max_output_chars?: number | undefined;
                };
                expect?: {
                    status?: number | undefined;
                    json?: any;
                    bodyContains?: string | undefined;
                    exit_code?: number | undefined;
                    stdout_contains?: string | undefined;
                    stderr_contains?: string | undefined;
                    stdout_not_contains?: string | undefined;
                    stderr_not_contains?: string | undefined;
                    stdout_regex?: string | undefined;
                    stderr_regex?: string | undefined;
                    stdout_empty?: boolean | undefined;
                    stderr_empty?: boolean | undefined;
                    max_duration_ms?: number | undefined;
                    rows?: number | undefined;
                    equals?: Record<string, any> | undefined;
                } | undefined;
            } | {
                sql: {
                    query: string;
                    driver: "postgres";
                    url_env: string;
                    timeout_ms?: number | undefined;
                };
                expect?: {
                    status?: number | undefined;
                    json?: any;
                    bodyContains?: string | undefined;
                    exit_code?: number | undefined;
                    stdout_contains?: string | undefined;
                    stderr_contains?: string | undefined;
                    stdout_not_contains?: string | undefined;
                    stderr_not_contains?: string | undefined;
                    stdout_regex?: string | undefined;
                    stderr_regex?: string | undefined;
                    stdout_empty?: boolean | undefined;
                    stderr_empty?: boolean | undefined;
                    max_duration_ms?: number | undefined;
                    rows?: number | undefined;
                    equals?: Record<string, any> | undefined;
                } | undefined;
            })[];
            says?: string | undefined;
            links?: string[] | undefined;
            work_item?: string | {
                key: string;
                says?: string | undefined;
                links?: string[] | undefined;
            } | undefined;
        }[];
        description?: string | undefined;
    }[];
    description?: string | undefined;
}>;
type SuiteFileV1 = z.infer<typeof SuiteSchema>;
type Step = z.infer<typeof StepSchema>;
type Check = z.infer<typeof CheckSchema>;
type WorkItem = z.infer<typeof WorkItemSchema>;
type HttpStep = z.infer<typeof HttpStepSchema>;
type ExecStep = z.infer<typeof ExecStepSchema>;
type SqlStep = z.infer<typeof SqlStepSchema>;
type Expectation = z.infer<typeof ExpectationSchema>;

export { type Check, CheckSchema, ContractSchema, type ExecStep, ExecStepSchema, type Expectation, ExpectationSchema, HttpBodySchema, type HttpStep, HttpStepSchema, type SqlStep, SqlStepSchema, type Step, StepSchema, type SuiteFileV1, SuiteSchema, type WorkItem, WorkItemObjectSchema, WorkItemSchema };
