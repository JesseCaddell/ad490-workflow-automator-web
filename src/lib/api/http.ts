// src/lib/api/http.ts

import { ApiError } from "./apiError";

export type RepoScope = {
    installationId: number | string;
    repositoryId: number | string;
};

type ApiEnvelope<T> =
    | { ok: true; data: T }
    | { ok: false; error: { code: string; message: string; details?: unknown } };

type RequestOptions = {
    method: "GET" | "POST" | "PATCH" | "DELETE";
    path: string;
    scope: RepoScope;
    body?: unknown;
};

function getApiBaseUrl(): string {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!base) return "http://localhost:3001";
    return base.replace(/\/+$/, "");
}

/**
 * Matches API requireScope() in src/routes/workflows.ts:
 * Headers:
 *   x-installation-id
 *   x-repository-id
 */
function buildScopeHeaders(scope: RepoScope): Record<string, string> {
    return {
        "x-installation-id": String(scope.installationId),
        "x-repository-id": String(scope.repositoryId),
    };
}

export async function requestApi<T>(opts: RequestOptions): Promise<T> {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}${opts.path.startsWith("/") ? "" : "/"}${opts.path}`;

    const headers: Record<string, string> = {
        Accept: "application/json",
        ...buildScopeHeaders(opts.scope),
    };

    const hasBody = opts.body !== undefined && opts.body !== null;
    if (hasBody) headers["Content-Type"] = "application/json";

    const res = await fetch(url, {
        method: opts.method,
        headers,
        body: hasBody ? JSON.stringify(opts.body) : undefined,
    });

    // DELETE returns 204 No Content
    if (res.status === 204) return undefined as T;

    const contentType = res.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");

    let rawText: string | undefined;
    let envelope: ApiEnvelope<T> | undefined;

    if (isJson) {
        envelope = (await res.json()) as ApiEnvelope<T>;
    } else {
        rawText = await res.text().catch(() => "");
        // Try JSON anyway (some servers forget the header)
        try {
            envelope = JSON.parse(rawText) as ApiEnvelope<T>;
        } catch {
            // not JSON
        }
    }

    if (!res.ok) {
        if (envelope && typeof envelope === "object" && "ok" in envelope && envelope.ok === false) {
            throw new ApiError(envelope.error.message, res.status, envelope.error);
        }
        throw new ApiError(
            `API request failed: ${opts.method} ${opts.path}`,
            res.status,
            rawText ?? envelope
        );
    }

    if (!envelope) {
        throw new ApiError(
            "Expected JSON response but received non-JSON",
            res.status || 500,
            rawText
        );
    }

    if (!envelope.ok) {
        throw new ApiError(envelope.error.message, res.status || 500, envelope.error);
    }

    return envelope.data;

}
