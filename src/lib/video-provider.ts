/**
 * Pluggable video-generation connector (SPEC §4 "VideoProvider").
 *
 * MVP = ManualImportProvider: it never calls a paid API. The operator produces
 * videos in Higgsfield (or any tool) and uploads the file manually via
 * /api/media. A paid provider (HeyGen / D-ID / Replicate) slots in later by
 * implementing this interface and returning it from getVideoProvider().
 */

export type VideoJobStatus = "processing" | "ready" | "failed";

export interface VideoProvider {
  // Generate a video from a Higgsfield-style prompt; returns a provider job/asset id.
  generate(
    prompt: string,
    options?: { avatarId?: string; lengthS?: number }
  ): Promise<{ externalId: string }>;
  // Poll until done; returns a downloadable media URL.
  status(externalId: string): Promise<{ status: VideoJobStatus; mediaUrl?: string }>;
}

export class ManualImportProvider implements VideoProvider {
  async generate(): Promise<{ externalId: string }> {
    throw new Error(
      "ManualImportProvider does not generate video — produce it in Higgsfield (or any tool), then upload the file via /api/media"
    );
  }

  async status(): Promise<{ status: VideoJobStatus; mediaUrl?: string }> {
    throw new Error("ManualImportProvider tracks no remote jobs");
  }
}

let current: VideoProvider | null = null;

/**
 * Returns the active video provider. Reads VIDEO_PROVIDER env ("manual" by
 * default). When a paid adapter (heygen | d-id | replicate) lands, add its case
 * here — the rest of the code never changes. Manual is the safe default: it
 * cannot spend money.
 */
export function getVideoProvider(): VideoProvider {
  if (current) return current;
  const name = (process.env.VIDEO_PROVIDER ?? "manual").toLowerCase();
  switch (name) {
    case "manual":
    default:
      // Unknown names fall back to manual rather than crashing the pipeline.
      current = new ManualImportProvider();
  }
  return current;
}
