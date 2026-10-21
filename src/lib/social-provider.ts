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
    post: {
      caption: string;
      mediaUrl: string;
      mediaKind: "IMAGE" | "VIDEO";
      format?: "VIDEO" | "CAROUSEL";
      carouselImages?: string[];
    }
  ): Promise<{ externalPostId: string }>;
  /** Cross-post the same content to the Facebook Page (only real providers). */
  publishFacebook?(
    accessToken: string,
    post: {
      caption: string;
      mediaUrl: string;
      mediaKind: "IMAGE" | "VIDEO";
      format?: "VIDEO" | "CAROUSEL";
      carouselImages?: string[];
    }
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
  // me/accounts -> Page named by INSTAGRAM_PAGE_NAME (or first) ->
  // instagram_business_account -> username.
  async connect(accessToken: string): Promise<{ handle: string; accountType: string }> {
    const igId = await this.resolveIgUserId(accessToken);
    // Note: the Instagram Graph API does not expose an `account_type` field on
    // the IG business-account node (requesting it returns error #100), so the
    // Business/Creator distinction cannot be auto-detected here. Default to
    // BUSINESS — it only affects a display label, not publishing.
    const user = await this.graph<{ username?: string }>(
      `/${igId}?fields=username`,
      accessToken
    );
    if (!user.username) throw new Error("Instagram account did not return a username.");
    return {
      handle: user.username,
      accountType: "BUSINESS",
    };
  }

  async publish(
    accessToken: string,
    post: {
      caption: string;
      mediaUrl: string;
      mediaKind: "IMAGE" | "VIDEO";
      format?: "VIDEO" | "CAROUSEL";
      carouselImages?: string[];
    }
  ): Promise<{ externalPostId: string }> {
    const igId = await this.resolveIgUserId(accessToken);
    const images = (post.carouselImages ?? []).filter(Boolean);
    if (post.format === "CAROUSEL" && images.length >= 2) {
      return this.publishCarousel(igId, accessToken, post.caption ?? "", images);
    }

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

  /** Build a carousel: one IMAGE container per slide, then a CAROUSEL parent. */
  private async publishCarousel(
    igId: string,
    accessToken: string,
    caption: string,
    images: string[]
  ): Promise<{ externalPostId: string }> {
    const childIds: string[] = [];
    for (const url of images) {
      const child = await this.graph<{ id?: string }>(`/${igId}/media`, accessToken, {
        method: "POST",
        body: new URLSearchParams({
          media_type: "IMAGE",
          image_url: url,
          is_carousel_item: "true",
        }),
      });
      if (!child.id) throw new Error("Instagram did not return a child media container id.");
      await this.waitForContainer(child.id, accessToken);
      childIds.push(child.id);
    }

    const parent = await this.graph<{ id?: string }>(`/${igId}/media`, accessToken, {
      method: "POST",
      body: new URLSearchParams({
        media_type: "CAROUSEL",
        children: childIds.join(","),
        caption,
      }),
    });
    if (!parent.id) throw new Error("Instagram did not return a carousel container id.");
    await this.waitForContainer(parent.id, accessToken);

    const published = await this.graph<{ id?: string }>(
      `/${igId}/media_publish`,
      accessToken,
      { method: "POST", body: new URLSearchParams({ creation_id: parent.id }) }
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

  /**
   * Cross-post the same content to the Facebook Page feed, using the same Page
   * the Instagram account is linked to. Requires `pages_manage_posts` (and
   * `publish_video` for video) on the token. Carousels become a multi-photo post.
   */
  async publishFacebook(
    accessToken: string,
    post: {
      caption: string;
      mediaUrl: string;
      mediaKind: "IMAGE" | "VIDEO";
      format?: "VIDEO" | "CAROUSEL";
      carouselImages?: string[];
    }
  ): Promise<{ externalPostId: string }> {
    const pageId = await this.resolvePageId(accessToken);
    // FB Page posts must be made AS the page, so resolve the page access token
    // (a user token fails with "#200 Unpublished posts must be posted to a page
    // as the page itself").
    const pageToken = await this.resolvePageToken(accessToken, pageId);
    const caption = post.caption ?? "";
    const images = (post.carouselImages ?? []).filter(Boolean);

    // Carousel → multi-photo post: upload each image unpublished, then one
    // /feed post attaches them all via attached_media[N].
    if (post.format === "CAROUSEL" && images.length >= 2) {
      const mediaFbIds: string[] = [];
      for (const url of images) {
        const uploaded = await this.graph<{ id?: string }>(
          `/${pageId}/photos`,
          pageToken,
          {
            method: "POST",
            body: new URLSearchParams({ url, published: "false" }),
          }
        );
        if (!uploaded.id) throw new Error("Facebook did not return a photo id.");
        mediaFbIds.push(uploaded.id);
      }
      const body = new URLSearchParams({ message: caption });
      mediaFbIds.forEach((id, i) =>
        body.set(`attached_media[${i}]`, JSON.stringify({ media_fbid: id }))
      );
      const feed = await this.graph<{ id?: string }>(
        `/${pageId}/feed`,
        pageToken,
        { method: "POST", body }
      );
      if (!feed.id) throw new Error("Facebook did not return a post id.");
      return { externalPostId: feed.id };
    }

    // Video → /videos (file_url must be publicly reachable).
    if (post.mediaKind === "VIDEO") {
      const video = await this.graph<{ id?: string }>(
        `/${pageId}/videos`,
        pageToken,
        {
          method: "POST",
          body: new URLSearchParams({
            file_url: post.mediaUrl,
            description: caption,
          }),
        }
      );
      if (!video.id) throw new Error("Facebook did not return a video id.");
      return { externalPostId: video.id };
    }

    // Single image → /photos (prefer post_id, which is the feed post id).
    if (post.mediaUrl) {
      const photo = await this.graph<{ id?: string; post_id?: string }>(
        `/${pageId}/photos`,
        pageToken,
        {
          method: "POST",
          body: new URLSearchParams({ url: post.mediaUrl, message: caption }),
        }
      );
      const photoId = photo.post_id ?? photo.id;
      if (!photoId) throw new Error("Facebook did not return a photo id.");
      return { externalPostId: photoId };
    }

    // Text-only fallback → /feed.
    const feed = await this.graph<{ id?: string }>(
      `/${pageId}/feed`,
      pageToken,
      { method: "POST", body: new URLSearchParams({ message: caption }) }
    );
    if (!feed.id) throw new Error("Facebook did not return a post id.");
    return { externalPostId: feed.id };
  }

  /** Resolve a Page access token (posts to a Page must be made AS the page). */
  private async resolvePageToken(accessToken: string, pageId: string): Promise<string> {
    const res = await this.graph<{ access_token?: string }>(
      `/${pageId}?fields=access_token`,
      accessToken
    );
    if (!res.access_token) {
      throw new Error("Facebook did not return a page access token.");
    }
    return res.access_token;
  }

  /** Resolve the Facebook Page id targeted by INSTAGRAM_PAGE_NAME / INSTAGRAM_PAGE_ID. */
  private async resolvePageId(accessToken: string): Promise<string> {
    // Prefer an explicit Page ID (deterministic — a freshly-created Page under
    // the "new Pages experience" sometimes does not appear in /me/accounts for
    // a while, but is directly queryable). Falls back to /me/accounts lookup.
    const pageIdEnv = process.env.INSTAGRAM_PAGE_ID?.trim();
    if (pageIdEnv) return pageIdEnv;

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
    return pageId;
  }

  private async resolveIgUserId(accessToken: string): Promise<string> {
    const pageId = await this.resolvePageId(accessToken);
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
