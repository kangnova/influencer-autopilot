/**
 * Pluggable social publishing connector (SPEC §4 "SocialProvider").
 *
 * Two providers:
 * - ManualSocialProvider (default) — keeps the connect/queue/approve workflow
 *   running WITHOUT calling Instagram. The operator posts by hand and marks the
 *   post "published manually". Cannot spend money or risk the account.
 * - InstagramProvider — the real Instagram Graph API for a Business/Creator
 *   account. Activates with SOCIAL_PROVIDER=instagram + a valid token with
 *   instagram_content_publish permission.
 *
 * Providers are stateless: the publish route decrypts the stored token and
 * passes it in, so no secret lives outside the DB (encrypted at rest).
 */

export type SocialProviderName = "manual" | "instagram";

export interface SocialInsights {
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
}

export interface SocialProvider {
  readonly name: SocialProviderName;
  connect(accessToken: string): Promise<{ handle: string; accountType: string }>;
  publish(
    accessToken: string,
    post: { caption: string; mediaUrl: string; mediaKind: "IMAGE" | "VIDEO" }
  ): Promise<{ externalPostId: string }>;
  insights(accessToken: string, externalPostId: string): Promise<SocialInsights>;
}

export class ManualSocialProvider implements SocialProvider {
  readonly name = "manual" as const;

  async connect(): Promise<{ handle: string; accountType: string }> {
    throw new Error(
      "Manual mode records the account without verifying a token; the route supplies the handle directly."
    );
  }

  async publish(): Promise<{ externalPostId: string }> {
    throw new Error(
      "Manual mode does not publish to Instagram. Post it yourself, then choose 'Mark published manually'."
    );
  }

  async insights(): Promise<SocialInsights> {
    throw new Error("Manual mode does not pull insights. Enter metrics manually.");
  }
}

const GRAPH = `https://graph.facebook.com/${process.env.INSTAGRAM_GRAPH_VERSION ?? "v21.0"}`;

type GraphError = { error?: { message?: string } };

export class InstagramProvider implements SocialProvider {
  readonly name = "instagram" as const;

  // Resolve the Instagram Business account from a Graph API token:
  // me/accounts -> first Page -> instagram_business_account -> username.
  async connect(accessToken: string): Promise<{ handle: string; accountType: string }> {
    const igId = await this.resolveIgUserId(accessToken);
    const user = await this.graph<{ username?: string; account_type?: string }>(
      `/${igId}?fields=username,account_type`,
      accessToken
    );
    if (!user.username) throw new Error("Instagram account did not return a username.");
    return {
      handle: user.username,
      accountType: user.account_type?.toUpperCase() === "CREATOR" ? "CREATOR" : "BUSINESS",
    };
  }

  async publish(
    accessToken: string,
    post: { caption: string; mediaUrl: string; mediaKind: "IMAGE" | "VIDEO" }
  ): Promise<{ externalPostId: string }> {
    const igId = await this.resolveIgUserId(accessToken);
    const isVideo = post.mediaKind === "VIDEO";

    const container = await this.graph<{ id?: string }>(
      `/${igId}/media`,
      accessToken,
      {
        method: "POST",
        body: new URLSearchParams({
          media_type: isVideo ? "REELS" : "IMAGE",
          ...(isVideo ? { video_url: post.mediaUrl } : { image_url: post.mediaUrl }),
          caption: post.caption || "",
        }),
      }
    );
    if (!container.id) {
      throw new Error("Instagram did not return a media container id.");
    }

    // Wait for the container to finish processing. Publishing too early fails
    // with error 9007 "media not ready" — Instagram processes the file
    // asynchronously after accepting it, especially for video.
    await this.waitForContainer(container.id, accessToken);

    const published = await this.graph<{ id?: string }>(
      `/${igId}/media_publish`,
      accessToken,
      { method: "POST", body: new URLSearchParams({ creation_id: container.id }) }
    );
    if (!published.id) throw new Error("Instagram did not return a media id.");

    return { externalPostId: published.id };
  }

  /** Poll the container until Instagram reports FINISHED (or a terminal error). */
  private async waitForContainer(containerId: string, accessToken: string): Promise<void> {
    const deadline = Date.now() + 120_000; // 2 minutes
    let last = "IN_PROGRESS";
    while (Date.now() < deadline) {
      const status = await this.graph<{ status_code?: string; status?: string }>(
        `/${containerId}?fields=status_code,status`,
        accessToken
      );
      last = status.status_code ?? "UNKNOWN";
      if (last === "FINISHED") return;
      if (last === "ERROR" || last === "EXPIRED" || last === "PUBLISHED") {
        throw new Error(
          `Instagram media container ${last}${status.status ? `: ${status.status}` : ""}`
        );
      }
      await new Promise((r) => setTimeout(r, 5000));
    }
    throw new Error(`Timed out waiting for Instagram media container (last status: ${last})`);
  }

  async insights(accessToken: string, externalPostId: string): Promise<SocialInsights> {
    const data = await this.graph<{
      data?: { name: string; values?: { value: number }[] }[];
    }>(
      `/${externalPostId}/insights?metric=impressions,reach,likes,comments,shares`,
      accessToken
    );
    const pick = (name: string) =>
      data.data?.find((m) => m.name === name)?.values?.[0]?.value ?? 0;
    return {
      impressions: pick("impressions"),
      reach: pick("reach"),
      likes: pick("likes"),
      comments: pick("comments"),
      shares: pick("shares"),
    };
  }

  private async resolveIgUserId(accessToken: string): Promise<string> {
    const accounts = await this.graph<{ data?: { id: string; name?: string }[] }>(
      "/me/accounts?fields=id,name&limit=100",
      accessToken
    );
    // Target a specific Page by name when INSTAGRAM_PAGE_NAME is set (a token
    // may admin several Pages; the first one is not always the right one).
    // Falls back to the first Page when the env is unset or no name matches.
    const targetName = process.env.INSTAGRAM_PAGE_NAME?.trim().toLowerCase();
    const page =
      (targetName &&
        accounts.data?.find((p) => p.name?.trim().toLowerCase() === targetName)) ||
      accounts.data?.[0];
    const pageId = page?.id;
    if (!pageId) {
      throw new Error(
        targetName
          ? `No Facebook Page named "${process.env.INSTAGRAM_PAGE_NAME}" found. Link your Instagram Business account to a Facebook Page first.`
          : "No Facebook Page found. Link your Instagram Business account to a Facebook Page first."
      );
    }
    const selected = await this.graph<{ instagram_business_account?: { id: string } }>(
      `/${pageId}?fields=instagram_business_account`,
      accessToken
    );
    const igId = selected.instagram_business_account?.id;
    if (!igId) throw new Error("This Page has no linked Instagram Business account.");
    return igId;
  }

  private async graph<T>(
    path: string,
    accessToken: string,
    init?: { method?: string; body?: URLSearchParams }
  ): Promise<T> {
    const sep = path.includes("?") ? "&" : "?";
    const url = `${GRAPH}${path}${sep}access_token=${encodeURIComponent(accessToken)}`;
    const res = await fetch(url, {
      method: init?.method ?? "GET",
      headers: init?.body
        ? { "Content-Type": "application/x-www-form-urlencoded" }
        : undefined,
      body: init?.body,
    });
    const text = await res.text();
    let json: unknown = null;
    try {
      json = JSON.parse(text);
    } catch {
      // Non-JSON error body — fall through to the HTTP status below.
    }
    const err = json as GraphError | null;
    if (!res.ok || err?.error) {
      throw new Error(`Instagram Graph API: ${err?.error?.message ?? `HTTP ${res.status}`}`);
    }
    return json as T;
  }
}

let current: SocialProvider | null = null;

/**
 * Returns the active social provider. Reads SOCIAL_PROVIDER env ("manual" by
 * default). Manual is the safe default: it cannot spend money or risk a ban.
 */
export function getSocialProvider(): SocialProvider {
  if (current) return current;
  const name = (process.env.SOCIAL_PROVIDER ?? "manual").toLowerCase();
  current = name === "instagram" ? new InstagramProvider() : new ManualSocialProvider();
  return current;
}
