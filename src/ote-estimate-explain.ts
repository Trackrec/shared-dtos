/**
 * The estimate, explained to the person it is about.
 *
 * WHY THIS EXISTS. The screen showed a range and said nothing about how it got
 * there. Somebody whose number came out below the typical seller read it as a
 * punishment rather than as a consequence of how they sell. Victor, 2026-09-02:
 * "your figure moved because your deals average $6,000, which places you in
 * SMB. Same number, and it stops feeling like a punishment."
 *
 * DERIVED, NOT STORED, and that is the whole reason it lives here.
 *
 * An earlier version of the headline was built inside the estimator and written
 * into the estimated_ote_details column at calculation time. That meant only a
 * row calculated after it shipped could ever have one, so the explanation would
 * have stayed invisible until a full recompute ran, and the recompute is held
 * back behind the refinement blend. Everything below reads fields the column
 * already holds, so it works on every estimate that exists today, needs no
 * migration, and cannot drift from the number it explains.
 *
 * It sits in shared-dtos so there is exactly one copy generator. The frontend
 * renders it on the profile, the admin screen renders the same sentences, and
 * neither owns the words.
 *
 * VOICE, and these are hard rules rather than preferences. Short lines, "you"
 * throughout, real numbers, no em dashes, no negative parallelism, none of the
 * corporate list. Fewer words than feels complete.
 *
 * VICTOR'S PARENTHESIS IS A RULE. On the commodity discount he said "don't say
 * it like that". The model reaches its number partly by discounting a mature
 * product in a slow category, and it must never say that to the person selling
 * it. Nothing here calls anybody's product commoditised, low-value or behind.
 * The discount is real; the insult is optional.
 *
 * NEVER A DOWN ARROW. Some of these lines describe something that lowered the
 * number. They say so in words and carry effect 'trims' so a surface can stay
 * quiet about them, and no surface should render a red marker or a minus
 * percentage next to somebody's pay. Stating the fact is honest. Decorating it
 * is the punishment we are removing.
 */

import type {
  OteEstimationDetailsDto,
  OteModifiers,
  Segment,
} from './ote-estimation-details.dto';
import { isStructuredModifiers } from './ote-estimation-details.dto';

/** The one field that would replace a guess with a fact. */
export interface EstimateUnlock {
  field: 'dealSize' | 'segment' | 'outboundSplit' | 'newBusinessSplit';
  /**
   * The ask, phrased as what they would learn.
   *
   * NEVER "answer this and gain 10%". A promise of direction is an instruction
   * to lie, and the whole value of the number rests on the inputs being true.
   */
  ask: string;
}

export interface EstimateDriver {
  /** What we saw on the profile. */
  saw: string;
  /**
   * What it did to the number.
   *
   * ALWAYS READS AS A CONTINUATION AFTER A COMMA, so every surface can join the
   * pair the same way and get a sentence: `${saw}, ${meant}.` That is why each
   * one opens with "which" or "so", and why none of them stands alone.
   */
  meant: string;
  /**
   * 'sets' is the one that picked the starting rate card. 'lifts' and 'trims'
   * moved it from there.
   */
  effect: 'sets' | 'lifts' | 'trims';
  /** Magnitude, for ordering only. Never rendered. */
  weight: number;
  /**
   * WHICH QUESTION THIS ANSWERS, for the ones that get a reserved slot.
   *
   * Only 'pipeline' so far. The list is capped, and a line about how somebody
   * builds pipeline kept losing to whatever modifier happened to be larger,
   * so it was written and never seen. Victor asked for that line by name, so
   * it gets a slot rather than a weight it has not earned.
   */
  dimension?: 'pipeline';
  unlocks?: EstimateUnlock;
}

export interface EstimateExplanation {
  /** Two or three sentences: who you are, what you sell, then the number. */
  headline: string | null;
  /** The inputs that moved it, biggest first, four at most. */
  drivers: EstimateDriver[];
}

/**
 * The currency prefix, matching the rest of the app.
 *
 * "CAD$", NOT "CA$", and the difference is not a preference. This function
 * returned 'CA$' while the screen around it printed 'CAD$', so the live My
 * Market showed "Your deals average CA$6,000" three lines under "CAD$ 149,949".
 * One page, two notations for one currency, which is the exact bug the Rundown
 * was fixed for a day earlier.
 *
 * 'CAD$' is what the app uses everywhere else: the currency list a candidate
 * picks from (currency.constants.ts), the recruiter market-fit hint, the job
 * post, and MyMarketValue's own `currencySymbol` two hundred lines from where
 * this string lands. 'CA$' existed in exactly two places, both added on
 * 2026-09-02, both here.
 *
 * It is redundant on its face, since CAD already says dollars. It is also the
 * app's, and a reader noticing two spellings of their own currency stops
 * trusting the number attached to them.
 */
const symbolFor = (currency: string): string => (currency === 'CAD' ? 'CAD$' : '$');

/**
 * A salary, the way a person says one out loud. "$ 400k", "$ 1.2M".
 *
 * A SPACE AFTER THE SYMBOL, because every other figure on the page has one.
 * Victor, 2026-09-02: "You're missing a space between currency and amount."
 * OteRangeDisplay, CompensationBreakdown, GreatYear and the Rundown cards all
 * render `{currency} {amount}`, and the Rundown's own comment states the
 * convention: "the space matches how money is set everywhere else on the
 * profile". This generator was the lone dissenter, so a bullet read
 * "CAD$6,000" three lines under "CAD$ 149,949".
 */
const money = (n: number, currency: string): string => {
  const symbol = symbolFor(currency);
  if (n >= 1_000_000) return `${symbol} ${(n / 1_000_000).toFixed(1)}M`;
  return `${symbol} ${Math.round(n / 1_000)}k`;
};

/**
 * A deal size, in full.
 *
 * SEPARATE FROM `money` ON PURPOSE, and the tests caught this. Rounding a deal
 * to the nearest thousand turned an $18,000 deal into "$18k", and Victor's own
 * line is "your deals average $6,000". A salary is quoted in k because that is
 * how people say salaries. A deal is quoted in full because the seller knows
 * the number, and an abbreviation of a figure they can check reads as evasion.
 */
const exact = (n: number, currency: string): string =>
  `${symbolFor(currency)} ${Math.round(n).toLocaleString('en-US')}`;

/**
 * "a" or "an", from how the next word is said rather than how it is spelled.
 *
 * THE INITIALISMS BREAK THE VOWEL TEST, and two of the three role nouns here
 * are initialisms. "SDR" and "SMB" both start with a consonant letter and are
 * both said "ess", so a check on the letter produces "a SDR" and "a SMB account
 * executive". Both appear in Victor's own examples.
 */
const articleFor = (phrase: string): string => {
  const first = phrase.split(/[\s-]/)[0] ?? '';
  // An all-caps run is read letter by letter, so what matters is the sound of
  // the first letter's name: F, H, L, M, N, R, S and X all open on a vowel.
  if (/^[A-Z]{2,}$/.test(first)) return /^[AEIOUFHLMNRSX]/.test(first) ? 'an' : 'a';
  return /^[aeiou]/i.test(phrase) ? 'an' : 'a';
};

/**
 * A percentage, with the half point kept.
 *
 * Two of the modifiers are 7.5% and rounding turned that into 8%, which
 * contradicts the factor cards sitting next to this on the same screen. Two
 * different numbers for one modifier reads as one of them being wrong, and the
 * reader has no way to tell which.
 */
const pct = (multiplier: number): string => {
  const raw = Math.abs((multiplier - 1) * 100);
  const rounded = Math.round(raw * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}%`;
};

/**
 * The role values the calculator actually emits.
 *
 * NOT the RoleTitle union next door, which lists AE_SMB, AE_MID_MARKET and
 * friends. Those were the rows before the card was rebuilt and nothing has
 * written one since; the calculator emits IcRole ('AE', 'ENTERPRISE_AE',
 * 'KEY_AM') or a BDR band. Keyed on string on purpose so an old row still
 * resolves instead of failing a type check on data that already exists.
 */
const ROLE_NOUN: Record<string, string> = {
  AE: 'account executive',
  ENTERPRISE_AE: 'enterprise AE',
  KEY_AM: 'key account manager',
  BDR_ENTRY: 'SDR',
  BDR_MID: 'SDR',
  BDR_EXPERIENCED: 'senior SDR',
  // The stale rows, in case one is still sitting in the column.
  AE_SMB: 'account executive',
  AE_MID_MARKET: 'account executive',
  AE_MIDMARKET: 'account executive',
  AE_ENTERPRISE: 'enterprise AE',
  AE_STRATEGIC: 'enterprise AE',
  AM: 'key account manager',
};

const SEGMENT_WORD: Record<Segment, string> = {
  SMB: 'SMB',
  MidMarket: 'mid-market',
  Enterprise: 'enterprise',
  Strategic: 'enterprise',
};

/**
 * What the product is, said the way a person would say it.
 *
 * `real_estate` deliberately does not become "real estate software". Somebody
 * selling buildings is not selling a platform, and a sentence that gets this
 * wrong loses the reader in the first clause.
 */
const PRODUCT_WORD: Record<string, string> = {
  software: 'software',
  services: 'services',
  hardware: 'hardware',
  real_estate: 'property',
};

/**
 * Years selling, said the way the factor card beside it already says them.
 *
 * ROUNDING WAS CONTRADICTING THE SCREEN. This said "8 years selling" for 7.5,
 * while `formatExperienceDisplay` on the same page said "7 years 6 months".
 * Two numbers for one fact, and the reader has no way to tell which is the
 * real one. Victor spotted the screen was "all over the place"; this is one of
 * the reasons it read that way.
 *
 * Months are dropped when they round to zero, so a clean figure stays clean
 * rather than becoming "7 years 0 months".
 */
const tenure = (years: number): string => {
  const safe = Number.isFinite(years) && years > 0 ? years : 0;
  let whole = Math.floor(safe);
  let months = Math.round((safe % 1) * 12);
  if (months === 12) {
    months = 0;
    whole += 1;
  }

  const yearPart = whole === 1 ? '1 year' : `${whole} years`;
  if (months === 0) return yearPart;
  const monthPart = months === 1 ? '1 month' : `${months} months`;
  return whole === 0 ? monthPart : `${yearPart} ${monthPart}`;
};

const BAND_WORD: Record<string, string> = {
  entry: 'entry',
  early: 'early career',
  mid: 'mid career',
  senior: 'senior',
  veteran: 'veteran',
  principal: 'principal',
};

/**
 * Joins a list the way somebody speaking would.
 *
 * COMMA WHEN AN ITEM ALREADY CARRIES AN "AND", which our own industry names do.
 * On Victor's profile this produced "You sell marketing and advertising and web
 * development software": two industries joined by "and", the first of which is
 * "Marketing and Advertising". A reader cannot tell where one ends.
 */
const listOf = (items: string[]): string => {
  const clean = items.map((i) => i.trim()).filter(Boolean);
  if (clean.length === 0) return '';
  if (clean.length === 1) return clean[0];
  const carriesAnd = clean.some((item) => / and /i.test(item));
  if (clean.length === 2) {
    return carriesAnd ? `${clean[0]}, ${clean[1]}` : `${clean[0]} and ${clean[1]}`;
  }
  const head = clean.slice(0, -1).join(', ');
  const tail = clean[clean.length - 1];
  return carriesAnd ? `${head}, ${tail}` : `${head} and ${tail}`;
};

/** Structured modifiers only. A legacy array carries no per-modifier flags. */
const modifiersOf = (details: OteEstimationDetailsDto): OteModifiers | null =>
  isStructuredModifiers(details.modifiers) ? details.modifiers : null;

/**
 * THE CITY, not the whole address.
 *
 * `location.city` holds whatever is on the profile, and on production that is
 * usually the full string LinkedIn gives: "Boston, Massachusetts, United
 * States". The first sentence read "You are a new business outbound-led
 * mid-market account executive in Boston, Massachusetts, United States", which
 * is nobody's voice. Victor's own example is "in nyc".
 */
const cityOf = (details: OteEstimationDetailsDto): string | undefined =>
  details.location?.city?.split(',')[0]?.trim() || undefined;

/**
 * WHAT THE CITY'S TIER IS, in words a seller would use.
 *
 * Victor on the old sentence, "which pays 18.2% over the same role elsewhere":
 * "Over the same rule elsewhere is so cryptic. We need to be a lot more precise
 * here. What's the context? Is it because Montreal is a tier one city?"
 *
 * It was cryptic because "elsewhere" named nothing. The multiplier is not
 * measured against everywhere else, it is measured against ONE thing: the rate
 * card's own baseline row, which is the secondary-market tier. Saying so
 * answers all three of his questions at once, and it is the truth the
 * arithmetic already contains.
 *
 * THE INTERNAL LABEL STAYS INTERNAL. "Tier1" is our word, not a seller's, and
 * printing it would replace one piece of jargon with another. These phrases say
 * what the tier IS.
 */
const TIER_PHRASE: Record<string, string> = {
  Tier1: 'a top-paying metro',
  Tier2: 'a major market',
  Tier3: 'a secondary market',
  Tier4: 'outside the major markets',
};

const tierPhraseOf = (details: OteEstimationDetailsDto): string | undefined => {
  const tier = details.baseline?.tier ?? details.location?.tier;
  return tier ? TIER_PHRASE[String(tier)] : undefined;
};

// ─────────────────────────────────────────────────────────────────────────────
// The headline
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Two or three sentences that explain the number.
 *
 * Both of Victor's worked examples are one breath: who you are, what you sell,
 * and then the number lands as a consequence.
 *
 *   "you're a new biz outbound enterprise ae in nyc in cyber and you work for a
 *   large software firm, yeah, that's where the tension is so 400/450k OTE,
 *   50/50 split"
 *
 *   "you're an inbound smb rep in omaha nebraska, you sell a commoditized (don't
 *   say it like that) med device for the leader which is an old company, yeah,
 *   150k ote on a 70/30 split makes sense"
 *
 * The reader should finish it thinking "yes, that is me" before they reach the
 * figure, because that is what makes the figure credible.
 *
 * Returns null when there is not enough to say anything true. A vague sentence
 * about "sellers like you" is worse than no sentence: it is the exact register
 * that makes a benchmark feel invented.
 */
/**
 * OMITTING THE FIGURE, when the figure is already on screen.
 *
 * The third sentence lands the number as a consequence, which is the whole
 * shape of Victor's two examples and is right when the sentence stands alone.
 * Rendered directly under the range display it repeats it: measured on the
 * rebuilt My Market, the band showed the range twice and the split twice, and
 * the second of each came from here. So the surface says whether it has already
 * printed the number.
 */
const buildHeadline = (
  details: OteEstimationDetailsDto,
  includeFigure = true,
): string | null => {
  const role = String(details.role ?? '');
  const roleNoun = ROLE_NOUN[role];
  if (!roleNoun) return null;

  const low = details.finalOte?.low;
  const high = details.finalOte?.high;
  const total = details.compensationSplit?.total;
  const base = details.compensationSplit?.base;
  if (low == null || high == null || !total || base == null) return null;

  const currency = details.finalOte?.currency ?? 'USD';
  const isBdr = role.startsWith('BDR_');
  const mods = modifiersOf(details);
  const city = cityOf(details);

  // ── Sentence one: who you are ──────────────────────────────────────────────
  const who: string[] = [];

  if (!isBdr) {
    const newPct = details.newBusinessPct;
    // Silent for a key account manager: the role noun already says the job is
    // existing accounts, and "existing accounts key account manager" is the
    // same word twice.
    if (newPct != null && role !== 'KEY_AM' && role !== 'AM') {
      who.push(newPct >= 50 ? 'new business' : 'existing accounts');
    }

    // Victor leads both examples with this, one outbound and one inbound, so
    // both get said. `outbound.applied` is false both when somebody is
    // inbound-led and when we simply never asked, so the second case checks
    // that the answer exists first. Saying it about a blank field would be
    // describing a person by a question they have not answered.
    const knowsChannel = details.confidenceFactors?.missingOutboundPct === false;
    if (mods?.outbound?.applied) {
      who.push('outbound-led');
    } else if (knowsChannel && (newPct ?? 0) >= 50) {
      who.push('inbound-led');
    }

    // NOT WHEN IT WAS DEFAULTED. 'defaulted' means we had no deal sizes and no
    // answer and fell back to mid-market to have something to price. Calling
    // somebody a mid-market seller on that basis is telling them a fact about
    // themselves that we made up, in the sentence whose whole job is to sound
    // like them.
    const segment = details.segment?.value;
    const segmentIsKnown = details.segment?.source !== 'defaulted';
    if (segment && segmentIsKnown && role !== 'ENTERPRISE_AE' && SEGMENT_WORD[segment]) {
      who.push(SEGMENT_WORD[segment]);
    }
  }

  const descriptor = [...who, roleNoun].join(' ');
  const placed = city ? `${descriptor} in ${city}` : descriptor;
  // "a existing accounts" and "a SDR" both read as machine output, which is
  // exactly the impression this sentence exists to avoid.
  const sentences = [`You are ${articleFor(placed)} ${placed}.`];

  // ── Sentence two: what you sell, and for whom ─────────────────────────────
  //
  // SKIPPED ENTIRELY FOR A BDR. The BDR path is a flat lookup on months and
  // city; it carries no industry, no product type and no company size, and
  // productType is set to 'software' on the way out purely to satisfy the
  // shape. Printing that would be asserting the most interesting fact about
  // somebody's job from a struct default.
  if (!isBdr) {
    const industries = details.industryAdjustment?.industries ?? [];
    const product = PRODUCT_WORD[String(details.productType)] ?? 'software';

    // Two at most. Three industries in one clause stops being a description of
    // a person and starts being a database row.
    //
    // The product word is DROPPED when an industry is named, because the
    // industry already carries it: "medical devices hardware" and "cloud
    // computing software" are both saying it twice. Software is the exception,
    // since "cybersecurity software" is how somebody would actually say it.
    let sells = product;
    if (industries.length > 0) {
      const named = listOf(industries.slice(0, 2)).toLowerCase();
      sells = product === 'software' ? `${named} software` : named;
    }

    const forWhom: string[] = [];
    /**
     * THE MODIFIER FIRST, then the headcount.
     *
     * `bigLogo.applied` is by definition 1,000 employees and up, so it says
     * "for a big name" on every row including the ones stored before the
     * headcount was kept. The small team clause needs the number itself, and it
     * is silent on a row that does not carry one rather than inferring anything
     * from a false modifier flag: that flag is false for everybody under 1,000,
     * which is most sellers, and it would put an invented fact in the sentence
     * whose whole job is to sound true.
     */
    if (mods?.bigLogo?.applied) forWhom.push('for a big name');
    else if (details.companySize != null && details.companySize > 0 && details.companySize < 50)
      forWhom.push('for a small team');

    // The commodity discount, said without the word.
    if (mods?.industry?.type === 'commodity') forWhom.push('in a mature category');
    else if (mods?.industry?.type === 'hot') forWhom.push('in a market that is moving');

    /*
     * DROPPED WHEN IT IS ONLY THE PRODUCT WORD. With no industry and nothing
     * about the company, the sentence is "You sell software.", which is three
     * words that tell the reader nothing they did not already know about
     * themselves. Silence is shorter and says the same amount.
     *
     * Joined by a space, not by "and". These are stacked prepositional phrases
     * ("for a big name in a market that is moving"), and "and" between them
     * reads as a list of two unrelated facts.
     */
    if (industries.length > 0 || forWhom.length > 0) {
      sentences.push(
        `You sell ${sells}${forWhom.length ? ' ' + forWhom.join(' ') : ''}.`,
      );
    }
  }

  // ── Sentence three: the number, as a consequence ──────────────────────────
  const basePct = Math.round((base / total) * 100);
  const varPct = 100 - basePct;
  const split =
    basePct === 50
      ? 'split evenly between base and commission'
      : `weighted toward ${basePct >= 50 ? 'base' : 'commission'} at ${basePct}/${varPct}`;

  if (includeFigure) {
    sentences.push(
      `That puts you at ${money(low, currency)} to ${money(high, currency)}, ${split}.`,
    );
  }

  return sentences.join(' ');
};

// ─────────────────────────────────────────────────────────────────────────────
// The drivers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The segment line, which is the one Victor asked for by name.
 *
 * Always first, and always present. Segment picks the rate card every other
 * step multiplies, so it is the biggest single thing that happened to the
 * number, and it is the step a seller is most likely to argue with.
 *
 * The three sources say genuinely different things and must not share a
 * sentence. 'declared' is their own answer. 'inferred' is our reading of their
 * deal sizes, and quoting the figure back is what makes it checkable. And
 * 'defaulted' is the honest admission: we had nothing, so we priced the middle.
 * That last one carries the unlock, because it is the only case where one field
 * moves the number off a guess.
 */
const segmentDriver = (details: OteEstimationDetailsDto): EstimateDriver | null => {
  const segment = details.segment?.value;
  if (!segment) return null;
  const word = SEGMENT_WORD[segment] ?? String(segment);
  const currency = details.finalOte?.currency ?? 'USD';

  if (details.segment?.source === 'declared') {
    return {
      saw: `You sell to ${word}`,
      meant: 'so that is the rate card behind your number',
      effect: 'sets',
      weight: Number.MAX_SAFE_INTEGER,
    };
  }

  if (details.segment?.source === 'inferred') {
    const avg = details.weightedDealSize?.avg ?? details.dealSize;
    const max = details.weightedDealSize?.max;
    if (!avg) {
      return {
        saw: `Your deal sizes read as ${word}`,
        meant: 'so that is the rate card behind your number',
        effect: 'sets',
        weight: Number.MAX_SAFE_INTEGER,
      };
    }
    /**
     * THE BIG DEAL GETS SAID TOO, when there is one.
     *
     * Segment comes off a weighted blend of the average and the largest deal,
     * not off the average alone, so a rep averaging $6,000 with one $400,000
     * deal lands above SMB. Quoting only the average there would make the
     * sentence look wrong to the one person who knows the answer, which is the
     * fastest way to lose the credibility the whole line is for.
     */
    const showMax = max != null && max >= avg * 3;
    return {
      saw: showMax
        ? `Your deals average ${exact(avg, currency)} and reach ${exact(max, currency)}`
        : `Your deals average ${exact(avg, currency)}`,
      meant: `which places you in ${word}`,
      effect: 'sets',
      weight: Number.MAX_SAFE_INTEGER,
    };
  }

  return {
    saw: 'We do not know your deal sizes yet',
    meant: `so you are priced as a typical ${word} seller, the middle of three`,
    effect: 'sets',
    weight: Number.MAX_SAFE_INTEGER,
    unlocks: {
      field: 'dealSize',
      ask: 'Add your average and largest deal to see the number for your own segment.',
    },
  };
};

/**
 * Everything that moved the card, biggest first.
 *
 * Each one names a fact from the profile and what it did. A step that did
 * nothing is left out rather than reported as zero: a list of things that had
 * no effect is noise, and it buries the two or three that mattered.
 */
const movementDrivers = (details: OteEstimationDetailsDto): EstimateDriver[] => {
  const drivers: EstimateDriver[] = [];
  const mods = modifiersOf(details);
  const city = cityOf(details);
  const tierPhrase = tierPhraseOf(details);

  // ── Geography ─────────────────────────────────────────────────────────────
  const geo = details.baseline?.multiplier ?? details.location?.tierMultiplier;
  if (geo != null && Math.abs(geo - 1) > 0.001) {
    drivers.push(
      geo > 1
        ? {
            /*
             * THE CITY AND WHAT KIND OF MARKET IT IS, together, because the
             * name alone assumes the reader knows how we rank it.
             */
            saw: city
              ? `You are in ${city}${tierPhrase ? `, ${tierPhrase}` : ''}`
              : 'Your city is a top market',
            /*
             * NAMED, not "elsewhere". The multiplier is measured against the
             * rate card's baseline row, which is the secondary-market tier, so
             * that is what the sentence compares against.
             */
            meant: `which pays ${pct(geo)} more than the same role in a secondary market`,
            effect: 'lifts',
            weight: Math.abs(geo - 1),
          }
        : {
            saw: city
              ? `You are in ${city}${tierPhrase ? `, ${tierPhrase}` : ''}`
              : 'Your city is outside the top markets',
            /**
             * "prices under" rather than "pays less than". Same fact, and it
             * describes the market instead of the person reading it.
             */
            meant: `which prices ${pct(geo)} under the same role in a secondary market`,
            effect: 'trims',
            weight: Math.abs(geo - 1),
          },
    );
  }

  // ── Experience ────────────────────────────────────────────────────────────
  const band = details.experienceBand;
  if (band?.multiplier != null && Math.abs(band.multiplier - 1) > 0.001) {
    const years = Math.round(band.years ?? 0);
    const word = BAND_WORD[String(band.band)] ?? String(band.band);
    const yearsSaid = `You have ${tenure(band.years ?? 0)} selling`;
    drivers.push({
      saw: yearsSaid,
      meant:
        band.multiplier > 1
          ? `which puts you in the ${word} band, ${pct(band.multiplier)} over a mid career rep`
          : `which puts you in the ${word} band, ${pct(band.multiplier)} under a mid career rep`,
      effect: band.multiplier > 1 ? 'lifts' : 'trims',
      weight: Math.abs(band.multiplier - 1),
    });
  }

  // ── Company size ──────────────────────────────────────────────────────────
  if (mods?.bigLogo?.applied) {
    drivers.push({
      saw: 'You sell for a big name',
      meant: `which adds ${pct(1 + (mods.bigLogo.value || 0))}`,
      effect: 'lifts',
      weight: Math.abs(mods.bigLogo.value || 0),
    });
  }

  // ── How the pipeline gets built ───────────────────────────────────────────
  if (mods?.outbound?.applied) {
    drivers.push({
      saw: 'You source most of your own pipeline',
      meant: `which adds ${pct(1 + (mods.outbound.value || 0))}`,
      effect: 'lifts',
      dimension: 'pipeline',
      weight: Math.abs(mods.outbound.value || 0),
    });
  } else if (details.confidenceFactors?.missingOutboundPct === false) {
    /*
     * THE THIRD CASE, WHICH DID NOT EXIST. VICTOR, 2026-09-03: "In the bullet
     * point list we need to explain that majority inbound usually pays less
     * than pure outbound."
     *
     * There were two branches. One for a seller who sources their own pipeline
     * and earns the premium, one for a seller we never asked. Somebody who told
     * us they are inbound-led fell between them and got no line at all, which
     * is what Victor saw on his own profile: the headline called him
     * inbound-led and nothing in the list said what that did to the number.
     *
     * NO PERCENTAGE, because none was taken. The outbound modifier was simply
     * not applied. Saying "which trims 8%" would invent an arithmetic that did
     * not happen; the true statement is that a premium exists and this profile
     * does not earn it. That is also why `effect` is 'trims': it renders as the
     * muted marker rather than the accent, and drawing the eye to this would be
     * drawing it to an absence.
     */
    drivers.push({
      saw: 'Most of your pipeline comes to you',
      meant: 'so it misses the premium paid to sellers who source their own',
      effect: 'trims',
      dimension: 'pipeline',
      /*
       * THE SAME WEIGHT AS ITS SIBLING BRANCH, and that is the point.
       *
       * The list is capped at three drivers beside the segment, so weight is
       * not decoration, it decides whether a line exists. The first version of
       * this used 0.01 on the reasoning that a number which did not move should
       * not lead, and the line was sorted last and cut off every time. It was
       * written, merged, and invisible.
       *
       * All three pipeline branches now carry 0.05, so the dimension gets one
       * slot whichever of them applies. Whether we say you source your own,
       * that leads come to you, or that we never asked, the reader learns
       * something about pipeline.
       */
      weight: 0.05,
    });
  } else if (details.confidenceFactors?.missingOutboundPct) {
    drivers.push({
      saw: 'We do not know how you build pipeline',
      meant: 'so the number assumes leads come to you',
      effect: 'trims',
      dimension: 'pipeline',
      weight: 0.05,
      unlocks: {
        field: 'outboundSplit',
        /**
         * NO PROMISED DIRECTION. "Answer this and gain 10%" is an instruction to
         * lie, and every number here rests on the inputs being true.
         */
        ask: 'Add your inbound and outbound split so the number matches how you actually sell.',
      },
    });
  }

  // ── The category ──────────────────────────────────────────────────────────
  if (mods?.industry?.type === 'hot') {
    const named = details.industryAdjustment?.industries?.[0];
    drivers.push({
      saw: named ? `${named} is moving right now` : 'Your category is moving right now',
      meant: `which adds ${pct(1 + (mods.industry.value || 0))}`,
      effect: 'lifts',
      weight: Math.abs(mods.industry.value || 0),
    });
  } else if (mods?.industry?.type === 'commodity') {
    drivers.push({
      // Victor: "don't say it like that". A mature category is a true
      // description and a survivable one.
      saw: 'You sell in a mature category',
      meant: `which trims ${pct(1 + (mods.industry.value || 0))}`,
      effect: 'trims',
      weight: Math.abs(mods.industry.value || 0),
    });
  }

  return drivers.sort((a, b) => b.weight - a.weight);
};

/**
 * The base and the variable, guaranteed to add up to the estimate above them.
 *
 * WHAT WAS ON SCREEN. Victor's own profile showed base CA$90,720 plus variable
 * CA$90,720, which is CA$181,440, printed under an estimate of CA$149,949. The
 * breakdown overstated his own number by 21%, on the screen whose entire job is
 * to be believed.
 *
 * WHY. The calculator derives the pair from the midpoint and caps it, then the
 * refinement service rescales the low, mid and high in four separate places and
 * never touches the pair. So on every profile refinement moved, the halves
 * belonged to a midpoint that no longer existed, and the stored total was their
 * sum rather than the published number.
 *
 * DERIVED HERE, so it is right on every row that already exists. The listener
 * now writes a correct pair, but only for rows calculated after that shipped,
 * and the recompute that would fix the rest is held behind the refinement
 * blend. The stored pair is still the source of the RATIO, which is the part of
 * it that was never wrong; the total comes from the published midpoint.
 *
 * The variable half is the remainder rather than a second multiplication. Two
 * independent roundings can miss the total by a dollar, and a dollar is enough
 * for somebody to notice and stop trusting the rest of the screen.
 */
export const compensationSplitOf = (
  details: OteEstimationDetailsDto | null | undefined,
): { base: number; variable: number; total: number; basePct: number } | null => {
  const total = details?.finalOte?.mid;
  if (!total || total <= 0) return null;

  const storedBase = details?.compensationSplit?.base ?? 0;
  const storedVariable = details?.compensationSplit?.variable ?? 0;
  const storedTotal = storedBase + storedVariable;

  /*
   * Half and half when the stored pair cannot give a ratio, which is a row
   * written before the split existed. Fifty is what the AE card quotes and the
   * least wrong assumption available.
   */
  const fraction = storedTotal > 0 ? storedBase / storedTotal : 0.5;

  const base = Math.round(total * fraction);
  return {
    base,
    variable: total - base,
    total,
    basePct: Math.round(fraction * 100),
  };
};

/**
 * The explanation, derived from a stored estimate.
 *
 * Safe on a skipped row, a legacy row and a half-written one: every field it
 * reads is optional on the DTO and guarded here, and a row it cannot explain
 * comes back with a null headline and an empty list rather than a sentence
 * assembled out of defaults.
 */
export interface ExplainOptions {
  /**
   * False when the caller has already printed the range and the split, so the
   * closing sentence would be the same figures a second time.
   */
  includeFigure?: boolean;
}

export const explainEstimate = (
  details: OteEstimationDetailsDto | null | undefined,
  options: ExplainOptions = {},
): EstimateExplanation => {
  if (!details || details.status !== 'calculated') {
    return { headline: null, drivers: [] };
  }

  /**
   * NO SEGMENT LINE FOR A BDR. The BDR path is a flat lookup on months in seat
   * and city; it never touches a segment, and `segment` on one of those rows is
   * whatever the shape needed rather than a fact about the person.
   */
  const segment = String(details.role ?? '').startsWith('BDR_')
    ? null
    : segmentDriver(details);

  /**
   * FOUR AT MOST, and the segment line is one of them.
   *
   * A seller reading this wants the reason, not the audit. The working is still
   * on the screen in the factor cards next to it for anybody who wants every
   * step, and an unlock line is worth more than a fifth thing that moved the
   * number by two percent.
   */
  /**
   * ONE ADMISSION, AT MOST.
   *
   * Two lines both opening "We do not know" reads as a product that knows
   * nothing about you, and it buries the ask under its own repetition. The
   * segment gap is always the bigger one, because segment picks the card
   * everything else multiplies, so when it is unknown the smaller gaps wait.
   */
  const movement =
    segment?.unlocks == null
      ? movementDrivers(details)
      : movementDrivers(details).filter((driver) => driver.unlocks == null);

  /*
   * PIPELINE GETS A RESERVED SLOT, LIKE THE SEGMENT DOES.
   *
   * The list is four lines. Sorting by weight alone meant the pipeline line
   * lost to whatever modifier happened to be bigger: on a real profile the
   * three winners were 0.11, 0.10 and 0.10, so a line carrying no percentage
   * at all could never place. It was written, merged, and invisible.
   *
   * The fix is not to give it a weight it has not earned. An inbound-led
   * seller had nothing subtracted; the outbound premium was simply not added,
   * and inventing a magnitude to win a sort would be a lie told to a sorting
   * function. So it is pulled out and placed.
   *
   * IT IS AN EXTRA LINE, NOT A SWAP. The first attempt held the total at four
   * and the pipeline line took the last slot, which on a real profile evicted
   * "You are in Omaha, a secondary market" - a line Victor asked for by name in
   * the same conversation as this one. Everything that was in the list before
   * is still in it; this is added on top.
   *
   * LAST, not second. It explains a number that did not move, so it reads as
   * a closing note rather than a headline.
   */
  const pipeline = movement.find((driver) => driver.dimension === 'pipeline');
  const others = movement.filter((driver) => driver !== pipeline);

  const rest = others.slice(0, segment ? 3 : 4);

  return {
    headline: buildHeadline(details, options.includeFigure !== false),
    drivers: [segment, ...rest, pipeline].filter(Boolean) as EstimateDriver[],
  };
};
