/**
 * Put back together the values that TypeORM's `simple-array` took apart.
 *
 * THE BUG THIS EXISTS FOR. Four columns hold industries as `simple-array`:
 * `position_details.worked_in`, `position_details.sold_to`,
 * `recruiter_project.industry_works_in` and `recruiter_project.industry_sold_to`.
 * `simple-array` is a bare `join(',')` on write and a bare `split(',')` on read,
 * with no escaping of any kind. Two names in our own industry catalog carry
 * commas inside them:
 *
 *   'HVAC (Heating, Ventilation, and Air Conditioning)'
 *   'Publishing (Books, Magazines, Newspapers)'
 *
 * So somebody who PICKS one of those two off our own list, from our own picker,
 * has it stored as one string and read back as three:
 *
 *   ['HVAC (Heating', 'Ventilation', 'and Air Conditioning)']
 *
 * Nobody chose "Ventilation". It is on no list, it means nothing, and it cannot
 * be matched to anything. What it does do is silent damage in three places:
 *
 *   - The OTE estimator looks the multiplier up with an exact name match. None
 *     of the three fragments is a name, so the person silently loses their
 *     industry multiplier and gets a worse estimate than their answer earns.
 *   - The FIT score hands the candidate's industries to a model as prose. The
 *     model is asked to compare "Ventilation" against a real industry, and it
 *     returns a number rather than an error.
 *   - The edit form is filled from the same read, so what somebody sees when
 *     they reopen a position is the fragments, and saving writes those back.
 *
 * WHY PARENTHESES AND NOT A LIST LOOKUP. Both affected names put their commas
 * inside brackets, and so does every catalog name shaped like this. Balance is
 * enough, it needs no database read, and it cannot be wrong about a name it has
 * never heard of.
 *
 * WHY IT LIVES HERE. There were two copies, and they disagreed on three things,
 * all of which cost somebody something:
 *
 *   1. The frontend copy called `.trim()` on every entry without checking the
 *      type, so a null inside the array threw rather than being skipped.
 *   2. The frontend copy pushed `buffer.trim()` unconditionally, so an empty
 *      fragment became an empty industry: a blank chip on the profile and a
 *      blank string handed to the scorer.
 *   3. The frontend copy DROPPED an unterminated bracket. A stored
 *      'Manufacturing (heavy' came back as nothing at all, so it vanished from
 *      the edit form and the next save deleted it, while the backend kept it
 *      and went on pricing it. A profile that reads one way and scores another
 *      is worse than both being wrong the same way.
 *
 * The behaviour below is the backend's, which is the correct one on all three.
 *
 * THIS IS A READ FIX, NOT A CURE. The values are still stored shredded, because
 * the storage is what is wrong and changing it is a migration and a backfill.
 * This stops the fragments reaching the places where they cost somebody
 * something.
 */
export const reconstructSimpleArray = (values?: readonly string[] | null): string[] => {
  if (!values?.length) return [];

  const result: string[] = [];
  let buffer = '';
  let depth = 0;

  for (const raw of values) {
    // Type-checked rather than trusted: this reads a database column, and a
    // null inside the array used to throw on the frontend.
    const part = typeof raw === 'string' ? raw.trim() : '';

    depth += (part.match(/\(/g) || []).length;
    depth -= (part.match(/\)/g) || []).length;

    buffer = buffer ? `${buffer}, ${part}` : part;

    // Balanced brackets mean the value is whole again.
    if (depth <= 0) {
      if (buffer.trim()) result.push(buffer.trim());
      buffer = '';
      depth = 0;
    }
  }

  /*
   * An unterminated bracket still yields its value. A stored name with an
   * opening bracket and no closing one is malformed, and dropping the buffer
   * silently deletes an industry somebody chose. Keeping it means the fragment
   * is visible and matchable if it happens to be a real name.
   */
  if (buffer.trim()) result.push(buffer.trim());

  return result;
};
