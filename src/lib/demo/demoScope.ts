import type { RepoScope } from "@/lib/api";

export function getDemoScope(): RepoScope {
    const installationId = Number(process.env.NEXT_PUBLIC_DEMO_INSTALLATION_ID);
    const repositoryId = Number(process.env.NEXT_PUBLIC_DEMO_REPOSITORY_ID);

    if (!Number.isFinite(installationId) || !Number.isFinite(repositoryId)) {
        throw new Error(
            "Missing demo scope env vars. Set NEXT_PUBLIC_DEMO_INSTALLATION_ID and NEXT_PUBLIC_DEMO_REPOSITORY_ID."
        );
    }

    return { installationId, repositoryId };
}
