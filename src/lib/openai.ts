import OpenAI from 'openai';

let client: OpenAI | null = null;

function getAIClient(): OpenAI {
  if (!client) {
    if (!process.env.ZAI_API_KEY) {
      throw new Error('ZAI_API_KEY environment variable is required');
    }
    if (!process.env.ZAI_BASE_URL) {
      throw new Error('ZAI_BASE_URL environment variable is required');
    }
    client = new OpenAI({
      apiKey: process.env.ZAI_API_KEY,
      baseURL: process.env.ZAI_BASE_URL,
    });
  }
  return client;
}

interface YachtListing {
  id?: string;
  title?: string;
  price?: string;
  size?: string;
  year?: string;
  location?: string;
  url?: string;
  [key: string]: any;
}

interface ChangeSummary {
  new_listings: YachtListing[];
  removed_listings: YachtListing[];
  price_changes: { old: YachtListing; new: YachtListing }[];
  no_change: boolean;
}

export async function generateChangeSummary(
  previousListings: YachtListing[],
  currentListings: YachtListing[],
  pageUrl: string
): Promise<string> {
  // Identify changes
  const changes: ChangeSummary = {
    new_listings: [],
    removed_listings: [],
    price_changes: [],
    no_change: false,
  };

  const previousIds = new Set(previousListings.map((l) => l.id || l.title).filter(Boolean));
  const currentIds = new Set(currentListings.map((l) => l.id || l.title).filter(Boolean));

  // New listings
  for (const listing of currentListings) {
    const key = listing.id || listing.title;
    if (!key || !previousIds.has(key)) {
      changes.new_listings.push(listing);
    } else {
      // Check for price changes
      const prevListing = previousListings.find((p) => (p.id || p.title) === key);
      if (prevListing && prevListing.price !== listing.price) {
        changes.price_changes.push({ old: prevListing, new: listing });
      }
    }
  }

  // Removed listings
  for (const listing of previousListings) {
    const key = listing.id || listing.title;
    if (!currentIds.has(key)) {
      changes.removed_listings.push(listing);
    }
  }

  changes.no_change =
    changes.new_listings.length === 0 &&
    changes.removed_listings.length === 0 &&
    changes.price_changes.length === 0;

  const model = process.env.ZAI_MODEL || 'glm-5.1';

  // Generate AI summary
  const prompt = `You are analyzing changes in yacht listings from "${pageUrl}".

Changes detected:
- New listings: ${changes.new_listings.length}
- Removed listings: ${changes.removed_listings.length}
- Price changes: ${changes.price_changes.length}

New listings:
${changes.new_listings.map((l) => `  - ${l.title || 'Unknown'} | ${l.price || 'N/A'} | ${l.size || ''} | ${l.year || ''} | ${l.location || ''}`).join('\n') || '  (none)'}

Removed listings:
${changes.removed_listings.map((l) => `  - ${l.title || 'Unknown'} | ${l.price || 'N/A'} | ${l.size || ''} | ${l.year || ''} | ${l.location || ''}`).join('\n') || '  (none)'}

Price changes:
${changes.price_changes.map((c) => `  - ${c.new?.title || 'Unknown'}: ${c.old?.price || 'N/A'} → ${c.new?.price || 'N/A'}`).join('\n') || '  (none)'}

Please provide a concise summary of the changes. Focus on the most interesting details like notable new yachts, significant price drops, etc.`;

  try {
    const aiClient = getAIClient();
    const response = await aiClient.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content:
            'You are a yacht market analyst. Provide concise summaries of listing changes. Be informative but brief.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || 'No summary generated.';
  } catch (error) {
    console.error('Z.ai API error:', error);
    return `Summary: ${changes.new_listings.length} new listings, ${changes.removed_listings.length} removed, ${changes.price_changes.length} price changes.`;
  }
}