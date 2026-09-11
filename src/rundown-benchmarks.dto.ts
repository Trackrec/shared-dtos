/**
 * The Rundown benchmarks. GET /rundown/benchmarks, own user, JWT.
 *
 * WHAT THIS IS. The contract for the rebuilt Rundown, the screen a candidate
 * sees about their own career. Victor, 2026-09-08, on the current one: "Right
 * now this screen says pretty much nothing, even on a great year it takes so
 * much space." And the brief for what replaces it: "I want TrackRec to know
 * stuff about sellers that they do not even know yet themselves."
 *
 * THE PAGE, top to bottom. Band 1 is the estimate: what you are worth, the
 * range, the rate card ladder, the plate, the pay line that used to be a card
 * (see folded_into_band_1), five short lines on how we got here, the great
 * year as one line. That band is served by the estimate the profile already
 * carries (OteEstimationDetailsDto and the explanation next door) plus the
 * ladder keys the next_band card carries in its detail, and nothing else in
 * this file describes it. Everything under it is here: thirty cards in five
 * bands (Where you stand, Your path, Company size, Did you know, Your
 * market), and a seventh band, Unlock more, where the frontend gathers every
 * locked card with the Barney door beside it.
 *
 * OWN USER ONLY. The route reads the person off the verified session, takes no
 * id, and answers a candidate about nobody but themselves. Nothing in this
 * response reaches a recruiter, and no recruiter route reuses these types.
 *
 * THE RUNDOWN NEVER GATES. A thin profile gets every card that computes, a
 * locked card for each one that a single field would unlock, and the field is
 * named on the card. Withholding the screen until a profile is perfect is how a
 * retention surface becomes one nobody comes back to.
 *
 * COMPUTED ON REQUEST. Nothing here is written to a column. Every card is built
 * from the person's roles, the pool and the rate card when asked for, so it
 * cannot go stale against the profile it describes and needs no migration.
 *
 * CONFIDENCE, NOT COUNTS. Victor, 2026-09-09, reading a card that said "Among
 * 200 plus account executives in mid-market paid in USD, widened from your
 * industry because too few people match you closely": "I don't want to give
 * precise numbers. I want to give a level of confidence." So a pool card names
 * the people it was measured against in words and gives one of three levels.
 * High: no axis dropped and 100 or more people. Medium: one axis dropped, or
 * 50 to 99 people. Low: two or more axes dropped, or 25 to 49 people. Under 25
 * the card stays locked or not_applicable, as before. No card text says how
 * many people were compared and no card text says the comparison was widened.
 * The count and the widening live in the admin report, and nowhere a
 * candidate can see.
 *
 * THE BOLD PAGE, 2026-09-10. Victor, after the card by card review: "overall
 * I'm happy with what I consider to be a first take but I think we can have
 * more fun with my market, play around with data viz, make it extra simple to
 * understand for users, show clearly how they fare against their own
 * environment, and tell them things about themselves they didn't even know
 * themselves." And the rule over every figure: "don't make up anything, just
 * stick to the data." So a card carries one figure of the person's own, a
 * verdict in words, and where the pool has a fact about people like them, a
 * `didYouKnow` sentence the backend writes from the wow facts research
 * (MY-MARKET-WOW-FACTS-RESEARCH-2026-09-10.md, whose tables are the acceptance
 * test, within one point). The four insight cards, 29 to 32, are built from
 * that research alone, and every number on them traces to a research fact or
 * to the person's own fields. No card face prints a percentile, a count, a
 * forecast, or money in a currency other than the page's.
 *
 * COMPANY SIZE, 2026-09-10. Victor: "Company size tells us a lot. Maybe
 * someone only wants to work for large organizations and we can easily see
 * that on their profile. Or someone only likes startups or mid-market
 * companies." The plan (COMPANY-SIZE-ON-MY-MARKET-2026-09-10.md) measured the
 * pool and found the pattern visible on most profiles and flat against the
 * money: pay, quota and deal size do not move across the five size bands, and
 * 40% of enterprise lean closers work at companies under 200. So the four
 * company size cards, 33 to 36, show the person their own pattern back and
 * ask one question; they never infer a preference. THE DOCTRINE: a pattern is
 * what the person did, never a stated preference. The card shows it back in
 * the exact sentence shapes of the plan's table (company-size.dto.ts spells
 * them beside CompanySizePattern) and the table's never say column is
 * binding. The one question, "Is that by choice?", has three answers and
 * stores CompanySizePreferenceDto in the person's own words; the inferred
 * pattern is never sent to a recruiter and never scored. Every headcount on
 * these cards is today's count, and every one of them says so in How we got
 * here. The cohort floor is 25 people on every cell, as everywhere.
 *
 * WHY IT LIVES HERE. The backend computes, the frontend formats, and this
 * package is a submodule in both, so a shape lands here first and both apps
 * compile against it before either fills it. Every name below is prefixed
 * RundownBenchmark so it cannot collide with the first Rundown's RundownCard
 * on either side.
 */

import type { Currency } from './ote-estimation-details.dto';
import type { CompanySizeBand } from './company-size.dto';

// =============================================================================
// LITERAL TYPES
// =============================================================================

/**
 * The thirty cards. The number beside each is Victor's numbering from the
 * brief, kept because that is how the cards get talked about ("card 16").
 *
 * Victor picked ten of these out of the 22 on the 2026-09-08 list on
 * 2026-09-09, then widened the cut to eighteen the same day. Two of the eight
 * he added, time_per_role and years_selling, were not on that list and take
 * the next two numbers so they can be talked about the same way. The rest of
 * the list is backlog, and a new card is a new key here first.
 *
 * THE FORK CARDS, 25 to 28, came later the same day out of the fork research
 * (MY-MARKET-FORK-RESEARCH-2026-09-09.md) and Victor's rule for them: "ok
 * don't make up anything just stick to the data." Each one is computed from
 * the pool with that document's definitions (accounts with role Applicant,
 * active positions with a start year, a missing end counts as current, role
 * type from the position flags, US and CA by city falling back to currency,
 * month index = year * 12 + month, medians, nothing under 25 shown) and its
 * numbers are checked against that document's tables. No fork card infers a
 * cause, a trait or a forecast; the frame on every one is what happened to
 * people who started where you did. The How we got here of each fork card,
 * and of the leadership fork inside next_move, carries these three limits in
 * plain words and with no numbers beyond the card's own: "Everyone here is
 * still in or near sales, so people who left are not counted." "The
 * leadership flag treats a manager of two like a VP over two hundred." "This
 * is what happened to people who started where you did, not a forecast."
 *
 * fork_so_far, "Your fork so far": for a person whose first dated sales role
 * was closing or booking, at the largest of the 3, 5, 8 and 10 year marks they
 * have reached since their first closing role, the share of sellers who
 * started the same way and reached that mark who had held a leadership role
 * by it, the share still an individual contributor who never led, and the
 * rest. fork_timing, "When the move happens": among people who moved into
 * leadership within ten years of their first closing role, the share who did
 * it within 2, 5 and 8 years, the median years, and where a mover's own gap
 * sits. leaders_return, "The door swings both ways": among people who have
 * held a leadership role, the share who held an individual contributor role
 * again afterwards, the share in an IC seat today, and the median years from
 * the first leadership role to the return. title_ladder, "Title ladder pace":
 * from the first plain Account Executive title (no Senior, Sr, Enterprise or
 * Strategic), the median months to a Senior AE title, to an Enterprise or
 * Strategic AE title and to a leadership role, and the share of AEs with
 * eight or more years behind them who reached each within eight years. The
 * fifth card the research supports, where leaders go next, is the leadership
 * fork inside next_move and is not a key of its own.
 *
 * THE INSIGHT CARDS, 29 to 32, came on 2026-09-10 out of the wow facts
 * research and Victor's brief for the bold page (the header). They sit in the
 * `insight` band, Did you know, and are computed from the pool with that
 * document's definitions: accounts with role Applicant; positions with status
 * active and a start year; a missing end counts as current; month index = year
 * times 12 plus month, a missing start month read as January; role type from
 * the position_details flags; US or CA by city, falling back to currency;
 * tenure at a role = years from the person's first dated typed sales role
 * start to that role's start; segment lean = whichever of the three segment
 * shares is at 50 or more, none when all are empty; deals trimmed 1,000 to
 * 50,000,000 in the person's currency; quota 10 to 400 with the value 20 read
 * as missing. Cohort floor 25 on every cell, confidence by the rule in the
 * header. Every one follows the never gates doctrine: a missing field is a
 * `locked` card that names the field and shows the pool fact as its teaser, a
 * person off the path is `not_applicable`.
 *
 * largest_deal_ratio, "Your largest deal in proportion": the person's largest
 * deal over their average deal on one closing role, against closers paid in
 * the same currency who gave both figures (their median and quartiles, and the
 * shares at three times and ten times or more). Locked when the largest deal
 * is missing, field longDealSize. Computed against the person's own role type
 * when that cohort clears the floor; never_made_the_move only when no closing
 * role exists. deal_after_move, "Your deal after the move": the person's
 * average deal on their latest closing role over the one on their earliest,
 * against closers with a deal size on two closing roles, read on the row that
 * matches the person's own segment move (up, stayed, down) when both segments
 * are known and the row clears the floor, else on all movers, and cohort.who
 * says which. Locked with one deal size on file, field averageDealSize with
 * the unlock's positionId naming the earlier role. never_made_the_move with
 * one closing role: "You have one closing role on file, so there is no move
 * to measure yet." quota_record, "Your quota record": with two or more
 * in-range figures, how many roles the person hit against sellers with the
 * same count of figures; with one figure, what happened on the next role among
 * back to back role pairs whose earlier figure sat where the person's does (at
 * 120 or better, at target, or under it). Locked with no figure, field
 * quotaAttainment. buyer_reach, "Who you already sell to": the years from the
 * person's first sales role to the first role of theirs naming a buyer family
 * (the family on their list that most sellers reached last, among families
 * clearing the floor), against the roles naming that family. When every family
 * on the list is under the floor, the person's own C-level record against
 * sellers with lists on two or more roles. Locked with no buyer list on any
 * role, field persona, reason no_buyer_list, the pool strip drawn for the CISO
 * example with a ghost pin, and no Share while locked. A card never names a
 * buyer the profile does not list.
 *
 * Insight cards compare a ratio or a duration to a median and say it in words
 * (the verdict is the frontend's, from the detail): above 1.05 of the median
 * "Above the median {noun}.", 0.95 to 1.05 "Right on the median {noun}.",
 * under 0.95 "Below the median {noun}."; where a quartile exists, past p75 "In
 * the top quarter of {noun}." and under p25 "In the earliest quarter of
 * {noun}." for a duration. The How we got here of each carries the same three
 * limits as the fork cards, and no card says what will happen next.
 *
 * THE COMPANY SIZE CARDS, 33 to 36, came on 2026-09-10 out of the company
 * size plan (the header): its cards A to D, the four that need only today's
 * headcount and clear the floor everywhere. They sit in the `company` band,
 * between Your path and Did you know, and are computed from the pool with the
 * plan's definitions: US and Canada by the person's city, falling back to a
 * USD or CAD currency; headcount = the company row's count today, placed in
 * a band by companySizeBandOf; a company stint = the distinct company on a
 * dated typed sales role, roles at the same company merged; medians and
 * quartiles, never means; every cell at 25 people or more; confidence by the
 * rule in the header. Nothing on them infers a preference, forecasts a move
 * or says that a size pays, because the plan's tables say it does not.
 *
 * size_pattern, "Where you have sold" (card A): the person's companies on
 * file as squares on a log ruler from 10 to 100,000, oldest to newest, each
 * labeled with its headcount and never with the employer, the five band edges
 * as hairlines, the person's most frequent band shaded. The figure is the
 * count in one band ("4", "companies, all under 200 people") or, for mixed,
 * the span ("12 to 40,000", "people, smallest to largest company"). The
 * sentence is the pattern sentence in the plan's exact shape (see
 * CompanySizePattern), then the pool line over sellers with two or more
 * companies on file. Then the question, inline: "Is that by choice?" with
 * the three answers of CompanySizePreferenceDto, written through
 * COMPANY_SIZE_PREFERENCE_FIELD; after an answer the card prints "You said:
 * {answer}" with a change link and asks no more. Needs two or more distinct
 * companies with a headcount on each; with two or more companies and a
 * headcount missing on some, the card shows the squares it can draw, says
 * how many companies have no headcount on file, and prints no pattern label.
 * One company on file: not_applicable never_made_the_move ("You have one
 * company on file, so there is no pattern to read yet."). No headcount on
 * any company: not_applicable no_headcount. Never `locked`: nothing the
 * person can type puts a headcount on a company. Did you know: where you are
 * now usually matches where you have mostly been. company_size_standing,
 * "Your company against your peers" (card B): the current company's headcount
 * against sellers of the same role type (closers, bookers, leaders) with an
 * open typed sales role: their median and quartiles and the share of them in
 * each of the five bands, drawn as a five band strip with the values printed
 * and the person's band solid. Role type is the one axis; no currency or city
 * axis on top of it, because the leader and booker cells would fall under
 * 25. Leader cells never share a sentence with closers: the leadership flag
 * treats a founder of five like a VP at a public company. Needs an open typed
 * sales role whose company has a headcount. Locked with no company on the
 * open role, Barney door: "Add the company on your current role and this
 * card shows how its size compares with {role plural}."; not_applicable
 * no_headcount when the company carries none. Did you know: quota attainment
 * did not move with company size; for leaders, half of those under 50 who
 * gave a team size lead at least half the company. last_move_size, "Your
 * last move, by company size" (card C): the person's latest move between two
 * companies with a headcount on both, the later one started 2019 or later,
 * as a ratio of today's counts ("8x", "bigger than the company before"; "a
 * tenth", "the size of the company before"), against sellers whose last move
 * was from a company in the same band: the shares that went bigger, about
 * the same and smaller, drawn as the fork card's three segment bar with the
 * person's segment solid, and the median years they had spent there before
 * moving as the range line. Needs two distinct company stints with a
 * headcount on both. One company: not_applicable never_made_the_move. Later
 * company before 2019: not_applicable before_coverage. Headcount missing on
 * either side: not_applicable no_headcount, and size_pattern's How we got
 * here counts the missing company. Did you know: the five year crossings
 * between under 200 and 1,000 or more, both ways. stint_by_size, "How long
 * you have been at a company your size" (card D): the person's years so far
 * on their open role against sellers with an open role at a company in the
 * same band: the median and quartiles of years so far and the share past
 * three years, drawn as the duo bars with the middle half behind the gray
 * bar. The comparison is always open stint against open stints, never
 * against finished role medians. Needs an open typed sales role with a start
 * date and a headcount. Locked with no start date, Barney door: "Add the
 * start date of your current role and this card shows how long sellers at
 * companies your size have been in theirs."; locked with no company, the
 * same door as card B; not_applicable no_headcount when the company carries
 * none. Did you know: finished roles ran a median 15 months at companies
 * under 50 and 22 months at 10,000 or more.
 *
 * The verdict on a company size card is the frontend's, from the detail.
 * company_size_standing and stint_by_size read the person's figure against
 * the median by the insight rule above: above 1.05 "Bigger than most {role
 * plural}' companies." and "Longer than most sellers at companies your
 * size.", under 0.95 the mirror ("Smaller than most", "Shorter than most"),
 * within "Close to the median." and "Right on the median." last_move_size
 * reads the shares: a direction at 0.6 or more of the movers is "most", and
 * the words are "Most sellers who left a company your size went {bigger or
 * smaller} too." when it is the person's own direction, "Most sellers who
 * left a company your size went {that way}; you went {the other}." when it
 * is not, and "About even at your size." when no direction reaches 0.6 (only
 * 50 to 199 today). The range lines: "Half of {role plural} sit between {p25}
 * and {p75} people.", "Half of them had spent {medianYearsBefore} years
 * there before moving.", "Half of them have been there between {p25} and
 * {p75} years." size_pattern carries no verdict: the pattern sentence is the
 * verdict, and the backend writes it. The How we got here of every company
 * size card carries, in these words: "Company sizes are today's headcount,
 * so a company that has grown since you left reads bigger than it was." and
 * on size_pattern, with the real number, "Two of your companies have no
 * headcount on file."
 */
export type RundownBenchmarkCardKey =
  | 'bdr_to_closer' // 1
  | 'closer_to_enterprise' // 2
  | 'time_to_leadership' // 3
  | 'next_move' // 4
  | 'time_in_title' // 5
  | 'next_band' // 6
  | 'quota_percentile' // 7
  | 'deal_size_percentile' // 8
  | 'cycle_vs_segment' // 9
  | 'revenue_per_year' // 10
  | 'new_business_share' // 11
  | 'outbound_share' // 12
  | 'city_premium' // 15
  | 'earn_vs_worth' // 16
  | 'ask_vs_offers' // 17
  | 'open_roles' // 19
  | 'time_per_role' // 23
  | 'years_selling' // 24
  | 'fork_so_far' // 25
  | 'fork_timing' // 26
  | 'leaders_return' // 27
  | 'title_ladder' // 28
  | 'largest_deal_ratio' // 29
  | 'deal_after_move' // 30
  | 'quota_record' // 31
  | 'buyer_reach' // 32
  | 'size_pattern' // 33, the plan's card A
  | 'company_size_standing' // 34, card B
  | 'last_move_size' // 35, card C
  | 'stint_by_size'; // 36, card D

/**
 * Which band of the page a card computes into.
 *
 * `standing` is band 2, Where you stand. `path` is band 3, Your path.
 * `company` is band 4, Company size, its own band on the page between Your
 * path and Did you know: the four company size cards of 2026-09-10, which
 * read one axis of the person's record (the size of the companies they sold
 * at) and end on the one question the page asks about it. `insight` is band
 * 5, Did you know (aside "What happened to sellers who started where you
 * did"), the four insight cards of 2026-09-10. `market` is band 6, Your
 * market. Band 1 is the estimate and is served elsewhere. Band 7, Unlock
 * more, is where the frontend gathers every `locked` card whatever band it
 * would have computed into, so no card carries it as a band. The frontend
 * numbers only the bands that render (bandIndices), so a page with no
 * company card still reads 01, 02, 03 with no gap.
 *
 * The company band is not among RUNDOWN_SHARE_BANDS (rundown-share.dto.ts)
 * on purpose: the pattern card is a candidate only mirror by the plan's
 * doctrine, and a share image is a public record. Opening it later is one
 * band added to that list, and the question is asked there, once.
 */
export type RundownBenchmarkBand = 'standing' | 'path' | 'company' | 'insight' | 'market';

/**
 * `ready` carries a figure.
 *
 * `locked` means one field on this person's own profile would compute it, and
 * `unlock` names that field. This is the state the fifth band is made of.
 *
 * `not_applicable` means nothing they could enter would change the answer:
 * they never made the BDR to closer move, they hold a leadership role and we
 * do not price those, their city is outside USD and CAD, the estimate itself
 * was skipped, or the cohort still had fewer than 25 people at the widest
 * step. `detail.reason` says which. The frontend may hide such a card or give
 * it one quiet line; it never gets a lock icon, because there is nothing to
 * unlock.
 */
export type RundownBenchmarkState = 'ready' | 'locked' | 'not_applicable';

/**
 * Where the figure came from, so a card can say so.
 *
 * `your_numbers`: the person's own stored figures against each other, with no
 * cohort in it (what you earn against what your profile is worth).
 * `rate_card`: the estimator's own rate card and experience bands, priced on
 * today's card for the same role and tier. `pool`: medians and percentiles
 * over a cohort of other candidates, never means. `jobs`: published recruiter
 * projects.
 */
export type RundownBenchmarkSource = 'your_numbers' | 'rate_card' | 'pool' | 'jobs';

/**
 * How closely the cohort matches the person, in one word the card can print.
 *
 * The backend sets it from two things pickCohort knows and the card does not
 * say: how many axes it dropped to reach 25 people, and how many people were
 * left. The rule is in the header. `high` is a close match with enough people
 * behind it. `medium` is one step wider, or a close match with fewer people.
 * `low` is two steps wider, or a small cohort, and reads as a direction
 * rather than a measure.
 *
 * The frontend prints the word with a three bar mark, in ink, and explains the
 * level in one sentence with no number in it. The level is never a colour for
 * good or bad, because a low confidence is a fact about the pool and says
 * nothing about the person.
 */
export type RundownBenchmarkConfidence = 'high' | 'medium' | 'low';

/**
 * Why a card is `not_applicable`, carried as `detail.reason` so both apps spell
 * it the same. Typed as a union here and stored as a string in `detail`, so a
 * new reason is a one-line addition rather than a shape change.
 *
 * `never_made_the_move`: bdr_to_closer for somebody with no booking role
 * followed by a closing role, closer_to_enterprise for somebody who never held
 * an enterprise role, time_to_leadership and leaders_return for somebody who
 * never led, fork_so_far for somebody who started in leadership ("You started
 * in leadership, so there is no fork to measure from a closing seat."),
 * title_ladder for somebody with no plain Account Executive title on file
 * ("This ladder starts at an Account Executive title, which is not on your
 * profile."). `too_early`: fork_so_far for somebody under three years from
 * their first closing role. The card is locked on time and only time lifts it,
 * so it is not a `locked` card (a lock names a field to answer) and the
 * headline says when to come back: "Come back after three years in a closing
 * role". `leadership_not_priced`: the money cards for somebody in a leadership role,
 * the same spelling as the OteSkipCode, so the frontend renders Victor's
 * leadership line once and keys it off one string. `unsupported_country`:
 * money cards outside USD and CAD. `no_estimate`: the cards that need an
 * estimate (next_band, earn_vs_worth, city_premium) when the estimator skipped
 * for any other reason; band 1 already says why. `thin_cohort`: under 25
 * people at the widest step. `no_current_title`: next_move and time_in_title
 * for somebody whose current title resolves to no family. `no_ask`:
 * ask_vs_offers for somebody with no ask on file. The ask is the one question
 * the Rundown lets a person decline, so a missing one is never a lock: a lock
 * would name the field and ask again.
 *
 * `folded_into_band_1`: earn_vs_worth, since 2026-09-10 (item 15 of the fork
 * cards ticket, Victor: "you decide", decided: fold). What the person earns
 * against what their profile is worth is one line under band 1's plate now,
 * served with the estimate in the reader's currency, and the ask for a missing
 * pay figure moved there with the Rather not say control the salary ask
 * doctrine requires. The card arrives not_applicable with this reason so an
 * old client that still lays the key out gets one quiet line and a new client
 * skips it; the key stays for the admin report. `no_buyer_list`: buyer_reach
 * for somebody with no buyer list on any typed sales role. The card is
 * `locked` with field persona when a current typed sales role exists to write
 * the list to, and carries this reason in `detail` so the frontend keys the
 * ask state (the pool strip with a dashed ghost pin, the inline ask, no Share)
 * off one string rather than off the key and the state; it is not_applicable
 * with this reason when no typed sales role exists to take the list.
 * `top_band`: next_band for somebody on the top experience band of the rate
 * card, so there is no step left to cross; the ladder keys still travel in
 * `detail` so the staircase draws a flat last step with the climb behind it.
 * The backend has emitted this reason since the ladder shipped, typed locally
 * as a widening of this union; it is listed here so the contract spells what
 * the wire carries.
 *
 * `before_coverage` (2026-09-10, the company size plan): last_move_size for
 * somebody whose later company started before 2019, where fewer than three
 * companies in four carry a headcount, so the move cannot be read against a
 * fair pool. "Your last move was before 2019, where fewer than three
 * companies in four carry a headcount." No field lifts it and only a newer
 * move changes it, so it is not a lock; the plan keeps the 2019 line until a
 * headcount history has at least a year behind it. `no_headcount`: a company
 * size card whose company carries no headcount on file: size_pattern with no
 * count on any company, last_move_size with a count missing on either side,
 * company_size_standing and stint_by_size when the current company carries
 * none. The count is ours, from the company row, and nothing the person can
 * type puts one there, so this is never a lock and the card names no field.
 * never_made_the_move is reused for size_pattern and last_move_size with one
 * company on file ("You have one company on file, so there is no pattern to
 * read yet.").
 */
export type RundownBenchmarkReason =
  | 'never_made_the_move'
  | 'leadership_not_priced'
  | 'unsupported_country'
  | 'no_estimate'
  | 'thin_cohort'
  | 'no_current_title'
  | 'no_ask'
  | 'too_early'
  | 'folded_into_band_1'
  | 'no_buyer_list'
  | 'top_band'
  | 'before_coverage'
  | 'no_headcount';

// =============================================================================
// PARTS OF A CARD
// =============================================================================

/**
 * The people a pool card was measured against, in words, with a level of
 * confidence.
 *
 * THE COHORT. Same role type (from the position_details flags: booking,
 * individual contributor, leadership), same dominant segment (the largest
 * share of SMB, mid-market and enterprise), same currency country (USD or
 * CAD), then narrowed by industry group and by city tier while 25 or more
 * people remain. When a step would drop it under 25 the step is skipped and
 * the confidence comes down a level. Medians, never means.
 *
 * `who` IS WHAT THE CARD PRINTS. The people compared, in words, with no size
 * and no widening clause: "account executives in mid-market paid in USD". The
 * frontend sets it after "Against" in the card footer, so it has to read as a
 * plain noun phrase. The 200 plus and the "widened from your industry because
 * too few people match you closely" that used to follow it are gone from every
 * card string, `claim` and `short` included.
 *
 * `confidence` IS THE ONE MEASURE OF THE COHORT A CANDIDATE SEES. High, medium
 * or low, per the rule in the header. The frontend prints the word and one
 * sentence that explains it without a number.
 *
 * `label` AND `size` STAY FOR THE ADMIN REPORT ONLY. benchmark-report.js still
 * prints the cohort as it was named at the widest step ("enterprise AEs paid
 * in USD") and how many people it held, rounded down as before: below 100 to
 * the nearest 25, below 500 to the nearest 50, above that to the nearest 100,
 * never under 25. The frontend does not read either field, and no frontend
 * surface prints them. A card, a footer, a disclosure or a share line that
 * shows a count is undoing Victor's 2026-09-09 decision.
 *
 * THE COUNT STILL TRAVELS. The first Rundown let no count leave the server,
 * and the backend carries tests that serialise GET /rundown and grep the
 * response for one. This route carries `size` for the report, so those tests
 * stay scoped to the old response. The line that moved is the screen: the
 * frontend's own test asserts that no rendered card text has a digit followed
 * by "plus" or the word "widened".
 */
export interface RundownBenchmarkCohortDto {
  /**
   * The people compared, as the card prints them after "Against": "account
   * executives in mid-market paid in USD". No size, no widening clause.
   */
  who: string;
  /** How closely they match the person. The rule is in the header. */
  confidence: RundownBenchmarkConfidence;
  /**
   * Admin report only. The cohort as it was named at the widest step, with
   * the steps it skipped: "enterprise AEs paid in USD". The frontend does not
   * read it.
   */
  label: string;
  /**
   * Admin report only. Rounded down per the rule above, never under 25. The
   * frontend does not read it, and no frontend surface prints it.
   */
  size: number;
}

/**
 * The one field that turns a locked card into a figure.
 *
 * `field` is the answerable key the backend whitelists for
 * POST /rundown/answer ('quotaAttainment', 'averageDealSize', 'longDealSize',
 * 'currentOte', 'segmentSplit', 'averageSalesCycle', 'newBusiness',
 * 'persona', and whatever that whitelist grows to), so the inline answer box
 * and this card are naming the same thing. Without it the client would infer
 * the field from the wording, which is one copy edit away from writing the
 * wrong column. Since 2026-09-10 the list grows to
 * COMPANY_SIZE_PREFERENCE_FIELD ('company_size_preference',
 * company-size.dto.ts), the fourth shape, a CompanySizePreferenceDto written
 * to the user: the pattern card's question writes through it from a `ready`
 * card, the one answer on the page that is not an unlock, so it carries the
 * key in its detail (`preference`) and not here.
 *
 * `field` IS NULL WHEN ONLY BARNEY CAN TAKE THE ANSWER. A start date or a
 * whole role is not a number the inline box accepts and is not on that
 * whitelist, so the card carries no field and the client shows the Barney
 * door alone. The rule: a non-null `field` is always a key the route accepts,
 * and a key the route does not accept is never sent as a string, because the
 * client would offer a box the route then refuses. At least one of `field`
 * and `barneyField` is set on every locked card.
 *
 * `label` is the ask, in Victor's voice: "Tell us what you earn today". Never
 * a promise of direction. An unlock that says "answer this and gain 10%" is an
 * instruction to lie, and the value of every number here rests on the inputs
 * being true.
 *
 * `barneyField` is the Barney field the door beside the card opens on, so the
 * conversation lands on the question rather than at the top. Null when Barney
 * has no field for it and the inline box is the only path.
 *
 * `positionId` IS THE ROLE THE ANSWER IS WRITTEN TO, as the body of
 * POST /rundown/answer names it. Set whenever `field` targets a role (every
 * position column on the whitelist); null when `field` is null or targets the
 * user (currentOte). Until 2026-09-10 the client read the role off
 * `detail.positionId`, which the one-role cards carry as the role the card
 * READ, and the two were the same role. deal_after_move breaks that equation:
 * it reads two closing roles and asks for the average deal of the EARLIER one,
 * and buyer_reach writes a buyer list to the current role from a card that
 * read nothing yet. So the unlock names its own target, and a client prefers
 * it to `detail.positionId` when both are set. The route already takes the id
 * and scopes it to the session's own roles, so a wrong id writes nothing.
 */
export interface RundownBenchmarkUnlockDto {
  field: string | null;
  label: string;
  barneyField: string | null;
  positionId: number | null;
}

/**
 * One bar of a distribution a card draws. Today only fork_timing carries one,
 * under `bands`: the gap from the first closing role to the first leadership
 * role, in the six bands the fork research reported (under 1, 1 to 2, 2 to 3,
 * 3 to 5, 5 to 8, 8 to 10 years). `label` is the words the bar is labelled
 * with ("under 1", "1 to 2"). `fromYears` is inclusive and `toYears`
 * exclusive, so a gap of exactly two years sits in 2 to 3; `toYears` is null
 * only on a band with no top, and none of fork_timing's is. `share` runs 0 to
 * 1 over the movers, and the shares of one card's bands sum to 1. A band
 * carries no count, per the confidence rule; the frontend marks the person's
 * own band from the card's `personYears`.
 */
export interface RundownBenchmarkDetailBand {
  label: string;
  fromYears: number;
  toYears: number | null;
  share: number;
}

/**
 * One role of the person's own, with one figure read from it. Today only
 * quota_record carries a list of these, under `roles`: one row per in-range
 * quota figure, in start order, so the card can draw one bar per reported role
 * labeled with the role and the company and the attainment printed at its
 * end, with a target line across the bars at 100. `positionId` is the role's
 * id, `role` and `company` are the words the bar is labeled with, `value` is
 * the figure as stored (attainment as a whole percentage here). A flat record
 * cannot carry a list of roles, and indexed keys (role1, role2) have no end,
 * so this is the second and last array shape a detail value can be. The rows
 * are the person's own and carry nothing from the pool.
 */
export interface RundownBenchmarkDetailRole {
  positionId: number;
  role: string;
  company: string;
  value: number;
}

/**
 * One company of the person's own, as size_pattern draws it: a square on the
 * log ruler labeled with its headcount. One row per distinct company on the
 * person's dated typed sales roles, oldest first, roles at the same company
 * merged. `positionId` and `role` are the latest role there (the id for the
 * admin report and the Barney door, the title as typed for a label); the
 * employer's name is not on the row on purpose, because the card labels
 * squares with headcounts and never with names, and a row that carried the
 * name would be one render away from printing it. `headcount` is today's
 * count and `band` its band by companySizeBandOf; both null on a company
 * with no count on file, which draws no square and is counted in the card's
 * `missingHeadcount`. `startYear` is the year the person started there, for
 * the ruler's order and the climbing and descending sentences.
 */
export interface RundownBenchmarkDetailCompany {
  positionId: number;
  role: string;
  headcount: number | null;
  startYear: number | null;
  band: CompanySizeBand | null;
}

/**
 * One of the five size bands with one figure on it, in band order, five rows
 * per list. size_pattern carries `bandCounts` (value = how many of the
 * person's own companies sit in the band, so the drawing shades the band or
 * bands with the highest value); company_size_standing carries `bandShares`
 * (value = the share 0..1 of same role peers whose company sits in the band,
 * the five summing to 1, the strip's bar heights). `label` is the band's
 * words from COMPANY_SIZE_BANDS, served so both apps print one label. A row
 * carries no count of people, per the confidence rule.
 */
export interface RundownBenchmarkDetailSizeBand {
  band: CompanySizeBand;
  label: string;
  value: number;
}

/**
 * The raw figures behind the headline, for the frontend to format.
 *
 * A loose record on purpose: the twenty-two cards carry twenty-two different
 * sets of numbers and a typed shape per card would make every new figure a
 * submodule round trip. Both builders spell the keys from this table instead.
 *
 *   bdr_to_closer         months, median, delta (months; negative is faster)
 *   closer_to_enterprise  months (first closing role to first enterprise
 *                         role), median, delta
 *   time_to_leadership    months (first role to first leadership role),
 *                         median, delta
 *   next_move             first, firstShare, second, secondShare, third,
 *                         thirdShare (title families and shares as 0..1)
 *   time_in_title         months (yours, so far), median, delta
 *   time_per_role         months (your median across your roles), median (the
 *                         pool's), delta, roles (how many of yours were read)
 *   years_selling         years (yours, one decimal), median, delta
 *   next_band             band, nextBand, monthsToNext, oteNow, oteNext, delta,
 *                         crossedMonthsAgo (only when a band was crossed since
 *                         the estimate), and the whole ladder as flat keys per
 *                         band for entry, early, mid, senior, veteran and
 *                         principal: entryYears (where the band starts in
 *                         years selling), entryOte (what the band pays on the
 *                         person's row today: the stored midpoint scaled by
 *                         the band multipliers), entryMonths (months until the
 *                         person reaches it, zero for the band they stand on
 *                         and the ones behind), and so on for the other five.
 *                         The ladder travels on the top_band card too. Band 1
 *                         draws its rate card ladder from these six steps and
 *                         from the estimate it already has (the range as the
 *                         wash band, the experience years as the marker), so
 *                         it needs nothing else served
 *   quota_percentile      value (attainment as a %), median, percentile
 *   deal_size_percentile  value, median, percentile
 *   cycle_vs_segment      value (days), median, delta (days; negative is shorter)
 *   revenue_per_year      value (revenue per year in role), median, percentile
 *   new_business_share    value (0..1), median, delta
 *   outbound_share        value (0..1), median, delta, worth (the outbound
 *                         modifier on today's card, in money; null when the
 *                         split does not earn it. The one rate card figure on
 *                         a pool card, and the card says where it came from)
 *   city_premium          tier, multiplier, baseline (the Tier3 row), value
 *                         (after the tier), delta (value minus baseline;
 *                         negative where the city pays under it), city
 *   earn_vs_worth         currentOte, estimate, low, high, delta
 *                         (currentOte minus estimate)
 *   ask_vs_offers         ask, median (what recruiters posted for the role
 *                         you want), low, high, count (jobs read), delta (ask
 *                         minus median), titleFamily
 *   open_roles            count, low, high (the OTE range recruiters posted),
 *                         titleFamily, segment
 *   fork_so_far           markYears (3, 5, 8 or 10: the largest mark the
 *                         person has reached since their first closing role),
 *                         eligible (sellers who started in a closing or booking
 *                         seat and have reached that mark; the cohort floor of
 *                         25 applies to it, the admin report reads it and no
 *                         card prints it), ledShare (held a leadership role by
 *                         the mark), stillIcShare (in an IC seat at the mark
 *                         and never led), restShare (booking, another titled
 *                         role, or no dated role covering the mark; the three
 *                         shares sum to 1), personState ('led' | 'stillIc' |
 *                         'other')
 *   fork_timing           medianYears (first closing role to first leadership
 *                         role, over movers within ten years), within2Share,
 *                         within5Share, within8Share (movers who made the move
 *                         inside that many years), personYears (the person's
 *                         own gap in years; null when they have not moved),
 *                         bands (RundownBenchmarkDetailBand[], the six bands
 *                         of the gap with their shares)
 *   leaders_return        returnedShare (leaders who held an IC role at any
 *                         point after their first leadership role),
 *                         icTodayShare (leaders in an IC seat today with no
 *                         open leadership role), medianYearsToReturn (first
 *                         leadership role start to the IC role start),
 *                         personYearsLeading (years since the person's first
 *                         leadership role started), personReturnedAfterYears
 *                         (years from their first leadership role to their
 *                         return to an IC role; null until they have)
 *   title_ladder          seniorMedianMonths, enterpriseMedianMonths,
 *                         leadershipMedianMonths (from the first plain Account
 *                         Executive title, medians over everyone who reached
 *                         the step), seniorWithin8Share, enterpriseWithin8Share,
 *                         leadershipWithin8Share (AEs whose anchor is eight or
 *                         more years old who reached the step inside eight
 *                         years), personSeniorMonths, personEnterpriseMonths,
 *                         personLeadershipMonths (the person's own months from
 *                         their anchor to each step; null for a step not taken)
 *   largest_deal_ratio    ratio (the person's largest deal over their average,
 *                         one decimal), averageDealSize, longDealSize (the two
 *                         figures read, in the response's currency), median
 *                         (the pool's median ratio), p25, p75 (the pool's
 *                         quartiles; the middle half span is drawn only when
 *                         p25 is set), share3x, share10x (the pool's shares at
 *                         three times and ten times or more), positionId,
 *                         role, company (the closing role read)
 *   deal_after_move       ratio (the person's latest average deal over their
 *                         first), firstDealSize, latestDealSize (the person's,
 *                         in the response's currency), gapYears (between the
 *                         two role starts), firstPositionId, firstRole,
 *                         firstCompany, latestPositionId, latestRole,
 *                         latestCompany (the two closing roles read; the
 *                         company names stay on the card face and never reach
 *                         a share image), move ('up' | 'stayed' | 'down' |
 *                         'all': the pool row the card read; 'all' when the
 *                         person's segments are unknown or the matching row
 *                         is under the floor, and cohort.who says which in
 *                         words), median (the row's median ratio),
 *                         biggerShare (moved to a deal at least a quarter
 *                         bigger), sameShare, smallerShare, doubledShare,
 *                         medianFirstDeal, medianLatestDeal (the row's, in the
 *                         response's currency), medianGapYears
 *   quota_record          figures (how many in-range quota figures the person
 *                         has, the value 20 read as missing), hitCount (how
 *                         many of them at or above 100), roles
 *                         (RundownBenchmarkDetailRole[], one per figure in
 *                         start order, value = the attainment), value (the
 *                         person's one figure when figures is 1; null
 *                         otherwise); with two or more figures hitAllShare
 *                         (sellers with the same count of figures who hit on
 *                         every one), medianBest, medianWorst, medianGap
 *                         (points); with one figure priorBand ('120_plus' |
 *                         'hit' | 'missed': which pairs row the figure falls
 *                         in), nextHitShare (pairs whose next role hit
 *                         target), next120Share (pairs whose next role hit 120
 *                         or better; null on the missed row), medianChange
 *                         (points the next role moved, on the missed row).
 *                         Fields of the other state are null
 *   buyer_reach           family (the family code from the persona module:
 *                         ceo_owner, cfo, cio_cto_cdo, ciso, cmo, cro_sales,
 *                         coo, chro, or one of vp_sales, vp_marketing,
 *                         vp_tech, vp_finance, vp_ops, vp_hr), familyLabel
 *                         (the family as the card prints it: "CISO", "CIO, CTO
 *                         or CDO", "CEO, founder or owner"), years (the
 *                         person's years from their first sales role to the
 *                         start of their earliest role naming the family;
 *                         null while locked), median, p25, p75 (years at role
 *                         start over the roles naming the family),
 *                         enterpriseShare (of those roles), positionId, role,
 *                         company (the role the years were read from; while
 *                         locked, the current role the list is written to,
 *                         and company is the name in "Who do you sell to at
 *                         {Company}?"); for the secondary state personClevel
 *                         ('first' | 'later' | 'never' | null),
 *                         firstClevelShare, laterClevelShare, neverClevelShare
 *                         (over sellers with lists on two or more roles),
 *                         laterMedianYears, firstRoleClevelShare (sellers
 *                         whose first listed role names a C-level title).
 *                         While locked the strip keys carry the CISO example
 *                         (family 'ciso' with its median and quartiles) so the
 *                         frontend draws the ghost pin from served figures
 *   size_pattern          companies (RundownBenchmarkDetailCompany[], one row
 *                         per distinct company on the person's dated typed
 *                         sales roles, oldest first; headcount and band null
 *                         on a company with no count, which draws no square),
 *                         count (companies on file), pattern
 *                         (CompanySizePattern as a string; null when any
 *                         company lacks a headcount, and the card prints no
 *                         label), bandCounts (RundownBenchmarkDetailSizeBand[],
 *                         the five bands in order, value = how many of the
 *                         person's companies sit in each; the band or bands
 *                         with the highest value are the ones the drawing
 *                         shades), smallest, largest (the smallest and largest
 *                         headcount among the person's companies, the span the
 *                         mixed figure prints), missingHeadcount (how many of
 *                         the person's companies carry none, for "Two of your
 *                         companies have no headcount on file."), preference
 *                         ('only' | 'prefer' as stored, 'none' for the
 *                         answered "It just happened", null while unanswered,
 *                         so the card knows whether to ask or to print "You
 *                         said:"), preferenceBands (the chosen band ids joined
 *                         with commas in band order, the empty string for
 *                         none, null while unanswered). No pool figure travels
 *                         in this detail: the pool line and the Did you know
 *                         are sentences the backend writes
 *   company_size_standing headcount (the current company's, today), band,
 *                         roleType ('closing' | 'booking' | 'leadership', the
 *                         role type of the peers), bandShares
 *                         (RundownBenchmarkDetailSizeBand[], the five bands in
 *                         order, value = the share 0..1 of same role peers
 *                         whose company sits in each; the five sum to 1),
 *                         median, p25, p75 (headcounts over the same role
 *                         peers), positionId, role (the open role read)
 *   last_move_size        fromHeadcount, toHeadcount (both today's counts),
 *                         ratio (toHeadcount over fromHeadcount, so 8 reads
 *                         "8x" and 0.1 reads "a tenth"), direction ('bigger' |
 *                         'same' | 'smaller': at least a quarter bigger,
 *                         within a quarter, at least a quarter smaller),
 *                         moveYear (the later company's start year), fromBand
 *                         (the band of the company left), biggerShare,
 *                         sameShare, smallerShare (over movers whose last move
 *                         was from the person's fromBand, later company 2019
 *                         or later, one move per person; the three sum to 1),
 *                         medianYearsBefore (years the movers had spent at the
 *                         company left, median, the range line),
 *                         fromPositionId, toPositionId (the two roles read)
 *   stint_by_size         yearsSoFar (the person's, one decimal, roles at the
 *                         same company merged, the latest start winning when
 *                         two are open), headcount, band (the current
 *                         company's), median, p25, p75 (years so far over
 *                         sellers with an open role at a company in the same
 *                         band), pastThreeShare (of them, past three years),
 *                         positionId, role (the open role read)
 *
 * `percentile` runs 0 to 100 and higher is better, so "top 18%" is percentile
 * 82. Every `Share` runs 0 to 1, as on next_move. Money is in the response's
 * `currency`, in whole units. The six cards that read one role (quota, deal
 * size, cycle, revenue, new business, outbound) also carry `positionId`,
 * `role` and `company` so the card can say which role it read; the insight
 * cards carry theirs as listed above.
 * A card that is not `ready` may carry `reason` (see RundownBenchmarkReason).
 * `detail` is never empty on a `ready` card and may be `{}` on the others.
 *
 * Every value is a string, a number or null, except four lists: `bands` on
 * fork_timing is an array of RundownBenchmarkDetailBand, `roles` on
 * quota_record is an array of RundownBenchmarkDetailRole, `companies` on
 * size_pattern is an array of RundownBenchmarkDetailCompany, and `bandCounts`
 * on size_pattern and `bandShares` on company_size_standing are arrays of
 * RundownBenchmarkDetailSizeBand. Both apps read a detail value through a
 * `typeof` check, so an array is invisible to every reader that does not ask
 * for it.
 */
export type RundownBenchmarkDetailValue =
  | string
  | number
  | null
  | RundownBenchmarkDetailBand[]
  | RundownBenchmarkDetailRole[]
  | RundownBenchmarkDetailCompany[]
  | RundownBenchmarkDetailSizeBand[];

export type RundownBenchmarkDetail = Record<string, RundownBenchmarkDetailValue>;

// =============================================================================
// THE CARD
// =============================================================================

export interface RundownBenchmarkCardDto {
  key: RundownBenchmarkCardKey;
  band: RundownBenchmarkBand;
  state: RundownBenchmarkState;
  /**
   * The bold card title, the same words in every state: "Time to closing",
   * "Your quota rank", "What your city adds". Two to four words and never a
   * figure, so the figure has one place to be, `headline`. Set here so both
   * apps print one name for one card and a copy edit lands in one file.
   */
  title: string;
  /**
   * The big figure as text: "3.5 years", "top 18%", "None right now". On a
   * `locked` card, the short name of what they would learn ("Your quota rank"),
   * which may repeat `title`. On a `not_applicable` card, the one line that
   * says so.
   */
  headline: string;
  /**
   * What a bare-number headline is in ("months", "%"), for surfaces that set
   * the unit small beside the figure. Null when the headline carries its own
   * words, which is most of them.
   */
  unit: string | null;
  /**
   * One sentence. May name the people in the words of `who`, says median and
   * never average, and puts the person's figure before the pool's: "AEs
   * typically move after 2.8 years; you are at 3.5." It carries no cohort
   * size and no widening clause; the footer says who and how confident from
   * `cohort`. On a `locked` card, what the figure would tell them, with no
   * promise of which way it goes.
   */
  claim: string;
  /**
   * One sentence of at most 90 characters: the person's number and the
   * comparison, and no cohort. "You closed 118% of quota; the median is 96%."
   * "You are at 3.5 years; AEs move after a median 2.8." Where `claim` names
   * the people and runs long, `short` fits a tight card or a share line, and
   * the frontend never trims `claim` to make one. Medians, never averages, and
   * money as the app prints it ("CAD$ 42,000"). On a `locked` card, what the
   * figure would tell them in the same length, with no promise of which way
   * it goes.
   */
  short: string;
  /**
   * THE DID YOU KNOW BAND. One or two sentences of pool fact about people like
   * the person, written by the backend from the wow facts research with the
   * research definitions, the research figure being the acceptance test
   * (within one point). The frontend prints it in a band under the range line:
   * violet wash with a 2px violet left rule on a standing or path card, solid
   * violet with white text on an insight card, one band per card and never
   * two, never on band 1.
   *
   * A band never repeats the card's own figures, names its cohort in words
   * ("Among closers paid in USD who gave both figures"), carries no count and
   * no percentile, states what happened and never what will, and stays in the
   * past tense pool form on a share image. Null when the card has no fact,
   * when the card is not `ready`, and when the fact is in a currency other
   * than the page's (the deal facts are USD only, so a CAD page shows no deal
   * band). On a `locked` insight card the pool fact is the teaser and sits in
   * `claim`, not here.
   */
  didYouKnow: string | null;
  /**
   * Set on `ready` cards whose `source` is 'pool'. Null everywhere else,
   * including locked pool cards, because a cohort nobody was measured against
   * is a number with nothing behind it.
   */
  cohort: RundownBenchmarkCohortDto | null;
  source: RundownBenchmarkSource;
  /** Set on `locked` cards and null on the other two states. */
  unlock: RundownBenchmarkUnlockDto | null;
  detail: RundownBenchmarkDetail;
}

/**
 * Where each card computes into and what it is built from, in one place, so
 * the backend stamps `band` and `source` from here and the frontend lays the
 * bands out from here, and a card cannot sit in one band on the server and
 * another on the screen.
 *
 * city_premium is priced on the card rather than measured over the pool. The
 * tier step is the figure band 1 already applies to this person, so the two
 * can never disagree, and it needs no cohort of 25 to compute.
 */
export interface RundownBenchmarkCardSpec {
  band: RundownBenchmarkBand;
  source: RundownBenchmarkSource;
  /**
   * Victor's number for the card in the 2026-09-08 brief, or the next number
   * after that list for a card added since (23 and 24 on 2026-09-09, then 25
   * to 28 for the fork cards the same day, then 29 to 32 for the insight cards
   * on 2026-09-10, then 33 to 36 for the company size cards the same day, the
   * plan's cards A to D).
   */
  brief: number;
}

export const RUNDOWN_BENCHMARK_CARD_SPEC: Record<
  RundownBenchmarkCardKey,
  RundownBenchmarkCardSpec
> = {
  quota_percentile: { band: 'standing', source: 'pool', brief: 7 },
  deal_size_percentile: { band: 'standing', source: 'pool', brief: 8 },
  cycle_vs_segment: { band: 'standing', source: 'pool', brief: 9 },
  new_business_share: { band: 'standing', source: 'pool', brief: 11 },
  revenue_per_year: { band: 'standing', source: 'pool', brief: 10 },
  outbound_share: { band: 'standing', source: 'pool', brief: 12 },
  earn_vs_worth: { band: 'standing', source: 'your_numbers', brief: 16 },
  bdr_to_closer: { band: 'path', source: 'pool', brief: 1 },
  closer_to_enterprise: { band: 'path', source: 'pool', brief: 2 },
  time_to_leadership: { band: 'path', source: 'pool', brief: 3 },
  fork_so_far: { band: 'path', source: 'pool', brief: 25 },
  fork_timing: { band: 'path', source: 'pool', brief: 26 },
  leaders_return: { band: 'path', source: 'pool', brief: 27 },
  next_move: { band: 'path', source: 'pool', brief: 4 },
  time_in_title: { band: 'path', source: 'pool', brief: 5 },
  time_per_role: { band: 'path', source: 'pool', brief: 23 },
  years_selling: { band: 'path', source: 'pool', brief: 24 },
  title_ladder: { band: 'path', source: 'pool', brief: 28 },
  next_band: { band: 'path', source: 'rate_card', brief: 6 },
  largest_deal_ratio: { band: 'insight', source: 'pool', brief: 29 },
  deal_after_move: { band: 'insight', source: 'pool', brief: 30 },
  quota_record: { band: 'insight', source: 'pool', brief: 31 },
  buyer_reach: { band: 'insight', source: 'pool', brief: 32 },
  size_pattern: { band: 'company', source: 'pool', brief: 33 },
  company_size_standing: { band: 'company', source: 'pool', brief: 34 },
  last_move_size: { band: 'company', source: 'pool', brief: 35 },
  stint_by_size: { band: 'company', source: 'pool', brief: 36 },
  city_premium: { band: 'market', source: 'rate_card', brief: 15 },
  ask_vs_offers: { band: 'market', source: 'jobs', brief: 17 },
  open_roles: { band: 'market', source: 'jobs', brief: 19 },
};

/**
 * The order the cards appear on the page, top to bottom, which is also the
 * order the backend returns them in. Victor set it on 2026-09-09: Where you
 * stand runs 7, 8, 9, 11, 10, 12 then 16; Your path runs 1, 2, 3, then the
 * three fork cards 25, 26, 27, then 4, 5, 23, 24, the title ladder 28, then 6;
 * Did you know runs 29, 30, 31, 32, after the path cards and before the
 * market; Company size runs 33, 34, 35 then 36, after the insight cards in
 * this list (the plan's order: the pattern and its question first, then
 * standing, the last move, the stint); Your market runs 15, 17 then 19. The
 * fork cards sit right after time to leadership because they answer the
 * question that card raises, and the title ladder sits with the other title
 * cards before the band card. This is the order inside a band and the order
 * the backend returns; the bands themselves stand in the order the band type
 * gives, so the company band renders between Your path and Did you know
 * though its keys follow the insight keys here. A locked card keeps its place
 * in this order when the frontend gathers the locked ones under Unlock more.
 */
export const RUNDOWN_BENCHMARK_CARD_ORDER = [
  'quota_percentile',
  'deal_size_percentile',
  'cycle_vs_segment',
  'new_business_share',
  'revenue_per_year',
  'outbound_share',
  'earn_vs_worth',
  'bdr_to_closer',
  'closer_to_enterprise',
  'time_to_leadership',
  'fork_so_far',
  'fork_timing',
  'leaders_return',
  'next_move',
  'time_in_title',
  'time_per_role',
  'years_selling',
  'title_ladder',
  'next_band',
  'largest_deal_ratio',
  'deal_after_move',
  'quota_record',
  'buyer_reach',
  'size_pattern',
  'company_size_standing',
  'last_move_size',
  'stint_by_size',
  'city_premium',
  'ask_vs_offers',
  'open_roles',
] as const;

// =============================================================================
// THE RESPONSE
// =============================================================================

/**
 * The body of GET /rundown/benchmarks.
 */
export interface RundownBenchmarksDto {
  /** ISO 8601. Computed on request, so this is the time of the request. */
  generatedAt: string;
  /**
   * The currency every money figure in `cards` is in, resolved from the
   * person's city the way the estimator resolves it. Null when the city is
   * outside the United States and Canada, in which case every money card is
   * `not_applicable` with reason 'unsupported_country' and the pool cards
   * that need no money still compute.
   */
  currency: Currency | null;
  /**
   * ALL THIRTY, ALWAYS, one card per key, in RUNDOWN_BENCHMARK_CARD_ORDER. A
   * card that cannot compute arrives as `locked` or `not_applicable` rather
   * than going missing, so the frontend never has to ask whether a key was
   * left out or merely could not be answered.
   */
  cards: RundownBenchmarkCardDto[];
}
