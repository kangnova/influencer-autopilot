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
  dayCount: number,
  avatarRef?: string
): PromptPair {
  const avatarLine = avatarRef
    ? `Avatar reference — reuse this EXACT influencer (identity, look, style, voice) in every item: """${avatarRef}""".`
    : "Invent one hyper-realistic AI influencer avatar and keep it visually identical across every item.";
  return {
    system:
      "You plan viral short-form video content. You copy PATTERNS (hook, structure, duration), never anyone's actual content. " +
      "Each item also gets a Higgsfield-ready video-generation prompt with a consistent avatar. " +
      JSON_RULE,
    user:
      `For the niche "${nicheName}", build a ${dayCount}-day content plan of original hooks and scripts based on proven viral patterns. ` +
      `${avatarLine} ` +
      `Write everything in Bahasa Indonesia. Return JSON: ` +
      `{"title":"...","items":[{"day":1,"hook":"...","script":"...","videoPrompt":"detailed Higgsfield video prompt: scene, camera, lighting, wardrobe, the consistent avatar's look, and any on-screen text"}]} ` +
      `with exactly ${dayCount} items, day starting at 1.`,
  };
}
