import * as Sentry from "@sentry/nextjs";

type SentryUserContext = {
  id: string;
  email?: string | null;
};

type SentryWorkspaceContext = {
  id?: string | null;
  name?: string | null;
  plan?: string | null;
};

export function setSentryUserContext(user: SentryUserContext) {
  Sentry.setUser({
    id: user.id,
    email: user.email ?? undefined
  });
}

export function setSentryWorkspaceContext(workspace: SentryWorkspaceContext) {
  Sentry.setContext("workspace", {
    id: workspace.id ?? null,
    name: workspace.name ?? null,
    plan: workspace.plan ?? null
  });

  if (workspace.plan) {
    Sentry.setTag("plan", workspace.plan);
  }
}

export function setSentryFeatureTag(feature: string) {
  Sentry.setTag("feature", feature);
}
