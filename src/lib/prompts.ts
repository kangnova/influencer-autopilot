export interface PromptPair {
  system: string;
  user: string;
}

const JSON_RULE = "Respond with valid JSON only — no markdown fences, no prose.";

export function researchPrompt(
  nicheName: string,
  competitorHandles?: string[]
): PromptPair {
  const competitorLine =
    competitorHandles && competitorHandles.length > 0
      ? `Competitor Instagram handles to consider: ${competitorHandles.join(", ")}.`
      : "No competitor handles supplied; rely on market knowledge.";

  return {
    system:
      "You are an Instagram market researcher. You find profitable niches for an AI influencer that sells simple digital products (guides, courses) to an Indonesian audience. " +
      JSON_RULE,
    user:
      `Research the Instagram niche: "${nicheName}". ${competitorLine} ` +
      `Rank 5 niche candidates by monetization potential (strong demand, high engagement, easiest digital product to sell). ` +
      `Write everything in Bahasa Indonesia. Return JSON: ` +
      `{"niches":[{"name":"...","description":"...","monetizationScore":0-100,"rationale":"..."}]}`,
  };
}

export function personaPrompt(nicheName: string): PromptPair {
  return {
    system:
      "You design hyper-realistic AI influencers for Instagram. Consistency of face, body, style, and voice across every post is the top priority. " +
      JSON_RULE,
    user:
      `Create a hyper-realistic AI influencer persona for the niche: "${nicheName}". ` +
      `Define identity, look, personality, voice, visual consistency rules, and brand placement. ` +
      `Write the identity and masterPrompt in Bahasa Indonesia. Return JSON: ` +
      `{"name":"...","identity":"...","masterPrompt":"full prompt that reproduces this exact influencer consistently","avatarPrompt":"short image-generation prompt for the avatar"}`,
  };
}

export function courseScriptsPrompt(
  nicheName: string,
  topic?: string,
  avatarRef?: string
): PromptPair {
  const topicLine = topic ? `Focus the course on this specific problem: "${topic}".` : "";
  const avatarLine = avatarRef
    ? `Avatar reference — reuse this EXACT influencer (identity, look, style, voice) in every lesson: """${avatarRef}""".`
    : "Invent one hyper-realistic AI influencer avatar and keep it visually identical across every lesson.";
  return {
    system:
      "You create short, high-value video courses. Each lesson is a spoken script plus a Higgsfield-ready video-generation prompt, " +
      "with the SAME avatar across all lessons for visual consistency. " +
      JSON_RULE,
    user:
      `For the niche "${nicheName}", identify the biggest pain points and build a short course that solves ONE specific problem. ` +
      `${topicLine} ` +
      `${avatarLine} ` +
      `Max 5 lessons. Write everything in Bahasa Indonesia. Return JSON: ` +
      `{"title":"...","problemStatement":"...","lessons":[{"title":"...","script":"...","videoPrompt":"detailed Higgsfield video prompt: scene, camera, lighting, wardrobe, the consistent avatar's look, and any on-screen text"}]}`,
  };
}

export function contentPlanPrompt(
  nicheName: string,
  startDay: number,
  endDay: number,
  avatarRef?: string
): PromptPair {
  const avatarLine = avatarRef
    ? `Avatar reference — reuse this EXACT influencer (identity, look, style, voice) in every item: """${avatarRef}""".`
    : "Invent one hyper-realistic AI influencer avatar and keep it visually identical across every item.";
  const count = endDay - startDay + 1;
  return {
    system:
      "You plan viral short-form video content. You copy PATTERNS (hook, structure, duration), never anyone's actual content. " +
      "Each item also gets a Higgsfield-ready video-generation prompt with a consistent avatar. " +
      "Each item ALSO gets a carousel variant: the same idea broken into short text slides plus a closing call-to-action. " +
      "Keep every field short and punchy — this is a small batch, so stay within the length limits. " +
      JSON_RULE,
    user:
      `For the niche "${nicheName}", build content-plan items for days ${startDay} through ${endDay} (${count} items). ` +
      `Base each on a proven viral pattern, all original. ` +
      `${avatarLine} ` +
      `Write everything in Bahasa Indonesia. Return JSON: ` +
      `{"items":[{"day":${startDay},"hook":"...","script":"...","videoPrompt":"detailed Higgsfield video prompt: scene, camera, lighting, wardrobe, the consistent avatar's look, and any on-screen text","slides":[{"heading":"short slide title","body":"1-2 sentence slide text"}],"cta":"one short call-to-action, e.g. follow / save / click link in bio"}]} ` +
      `with exactly ${count} items, day starting at ${startDay} and ending at ${endDay}. Each item's slides array has 5-7 entries; slide 1 restates the hook, the last slide carries the cta.`,
  };
}

export function ebookOutlinePrompt(
  nicheName: string,
  planTopics: string[],
  avatarRef?: string
): PromptPair {
  const topicsLine =
    planTopics.length > 0
      ? `The 30-day content plan already covers these topics. The ebook must expand and deepen EXACTLY these themes, so the short-form content funnels readers into the book:\n${planTopics
          .map((t, i) => `${i + 1}. ${t}`)
          .join("\n")}`
      : "No content plan yet; derive the ebook chapters from the niche's biggest pain points.";
  const avatarLine = avatarRef
    ? `Write in the voice of this influencer persona: """${avatarRef}""".`
    : "Write in a friendly mentor voice that uses simple everyday analogies.";
  return {
    system:
      "You outline a high-value lead-magnet ebook for an Indonesian audience. " +
      "It solves ONE specific problem and feels consistent with the author's short-form content. " +
      JSON_RULE,
    user:
      `Outline an ebook for the niche "${nicheName}". ` +
      `${topicsLine}\n` +
      `${avatarLine}\n` +
      `Write everything in Bahasa Indonesia. Return JSON: ` +
      `{"title":"...","subtitle":"...","chapters":[{"title":"..."}]} ` +
      `with 8-10 chapters, ordered from problem to solution. Chapter titles only.`,
  };
}

export function ebookChaptersPrompt(
  nicheName: string,
  chapterTitles: string[],
  avatarRef?: string
): PromptPair {
  const avatarLine = avatarRef
    ? `Write in the voice of this influencer persona: """${avatarRef}""".`
    : "Write in a friendly mentor voice that uses simple everyday analogies.";
  return {
    system:
      "You write in-depth, practical ebook chapters for an Indonesian audience. " +
      "Every chapter is substantial and skimmable: real steps, concrete examples, everyday analogies. " +
      JSON_RULE,
    user:
      `For the niche "${nicheName}", write the full content for these chapter titles:\n` +
      chapterTitles.map((t, i) => `${i + 1}. ${t}`).join("\n") +
      `\n${avatarLine}\n` +
      `Write everything in Bahasa Indonesia. Return JSON: ` +
      `{"chapters":[{"title":"exact title as given","content":"..."}]} ` +
      `one entry per title, in the same order. Each chapter content is 5-7 paragraphs (~400-600 words) structured as: a hook with an everyday analogy, a plain explanation, 3-4 numbered practical steps, a concrete example (with numbers), and a one-line takeaway.`,
  };
}
