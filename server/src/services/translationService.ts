import Anthropic from "@anthropic-ai/sdk";

let warnedMissingConfig = false;
let client: Anthropic | null | undefined;

function getClient(): Anthropic | null {
  if (client !== undefined) return client;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  client = apiKey ? new Anthropic({ apiKey }) : null;
  return client;
}

// Cheap, fast model — translation is a well-scoped task that doesn't need a
// larger model, and this runs once per save (not per page view), so cost
// stays negligible even though it's an LLM call rather than a translation API.
const MODEL = "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT = `You translate real-estate marketing and editorial copy from English into Egyptian colloquial Arabic (masry / عامية مصرية) — NOT Modern Standard Arabic (Fusha). Write the way Egyptians actually speak and write casually online, not formal news-Arabic.

Rules:
- Keep proper nouns as-is (compound names, developer names, place names, brand names) — do not translate or transliterate them into different spellings.
- Keep numbers, prices, and units as-is.
- Preserve paragraph breaks and formatting from the source.
- Output ONLY the translation, no preamble, no notes, no quotes around it.`;

function warnIfMissingConfig() {
  if (warnedMissingConfig) return;
  warnedMissingConfig = true;
  process.stderr.write(
    "[WARN] Auto-translation to Arabic is disabled — set ANTHROPIC_API_KEY to enable it.\n",
  );
}

/**
 * Translates a single freeform text field (e.g. a description) into Egyptian
 * colloquial Arabic. Never throws — same defensive, non-blocking pattern as
 * notifyAdmin. Returns null if translation is unavailable, the input is
 * empty, or the call fails.
 */
export async function translateTextToEgyptianArabic(text: string | null | undefined): Promise<string | null> {
  if (!text || !text.trim()) return null;

  const anthropic = getClient();
  if (!anthropic) {
    warnIfMissingConfig();
    return null;
  }

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: text }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    const raw = textBlock && "text" in textBlock ? textBlock.text.trim() : "";
    return raw || null;
  } catch (err) {
    process.stderr.write(
      `[WARN] Failed to auto-translate text to Arabic: ${err instanceof Error ? err.message : String(err)}\n`,
    );
    return null;
  }
}

export type BlogTranslationInput = {
  title: string;
  content?: string | null;
};

export type BlogTranslationResult = {
  title_ar: string;
  content_ar: string | null;
};

/**
 * Translates a blog's title + content into Egyptian colloquial Arabic in a
 * single call. Never throws — a failed/unconfigured translation must never
 * block saving the blog post, same defensive pattern as notifyAdmin. Returns
 * null if translation is unavailable or fails, so callers can just leave the
 * Arabic fields untouched.
 */
export async function translateBlogToEgyptianArabic(input: BlogTranslationInput): Promise<BlogTranslationResult | null> {
  const anthropic = getClient();

  if (!anthropic) {
    warnIfMissingConfig();
    return null;
  }

  const hasContent = Boolean(input.content && input.content.trim());
  const prompt = hasContent
    ? `Translate this blog post. Respond in exactly this format with no extra text:\n\nTITLE: <translated title>\nCONTENT: <translated content>\n\n---\n\nTITLE: ${input.title}\nCONTENT: ${input.content}`
    : `Translate this title only. Respond with just the translated title, nothing else.\n\n${input.title}`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    const raw = textBlock && "text" in textBlock ? textBlock.text.trim() : "";
    if (!raw) return null;

    if (!hasContent) {
      return { title_ar: raw, content_ar: null };
    }

    const titleMatch = raw.match(/TITLE:\s*([\s\S]*?)\nCONTENT:\s*([\s\S]*)/);
    if (!titleMatch) return null;

    return {
      title_ar: titleMatch[1].trim(),
      content_ar: titleMatch[2].trim(),
    };
  } catch (err) {
    process.stderr.write(
      `[WARN] Failed to auto-translate blog to Arabic: ${err instanceof Error ? err.message : String(err)}\n`,
    );
    return null;
  }
}

export type CareerTranslationInput = {
  description?: string | null;
  requirements?: string | null;
};

export type CareerTranslationResult = {
  description_ar: string | null;
  requirements_ar: string | null;
};

/**
 * Translates a job posting's description + requirements into Egyptian
 * colloquial Arabic in a single call. Same non-blocking, never-throws
 * contract as the other translate* helpers here.
 */
export async function translateCareerToEgyptianArabic(input: CareerTranslationInput): Promise<CareerTranslationResult | null> {
  const hasDescription = Boolean(input.description && input.description.trim());
  const hasRequirements = Boolean(input.requirements && input.requirements.trim());
  if (!hasDescription && !hasRequirements) return null;

  const anthropic = getClient();
  if (!anthropic) {
    warnIfMissingConfig();
    return null;
  }

  const prompt = `Translate this job posting. Respond in exactly this format with no extra text:\n\nDESCRIPTION: <translated description>\nREQUIREMENTS: <translated requirements>\n\n---\n\nDESCRIPTION: ${input.description || "(none)"}\nREQUIREMENTS: ${input.requirements || "(none)"}`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    const raw = textBlock && "text" in textBlock ? textBlock.text.trim() : "";
    if (!raw) return null;

    const match = raw.match(/DESCRIPTION:\s*([\s\S]*?)\nREQUIREMENTS:\s*([\s\S]*)/);
    if (!match) return null;

    const description_ar = match[1].trim();
    const requirements_ar = match[2].trim();

    return {
      description_ar: hasDescription && description_ar !== "(none)" ? description_ar : null,
      requirements_ar: hasRequirements && requirements_ar !== "(none)" ? requirements_ar : null,
    };
  } catch (err) {
    process.stderr.write(
      `[WARN] Failed to auto-translate career posting to Arabic: ${err instanceof Error ? err.message : String(err)}\n`,
    );
    return null;
  }
}
