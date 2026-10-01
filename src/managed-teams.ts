/**
 * THE TEAMS A SALES LEADER MANAGES: ONE LIST FOR BOTH SIDES.
 *
 * The seller says which teams they ran on a leadership role (the profile's
 * "Teams managed" chips, Barney's managedTeams question, stored in
 * position_details.management). Since TR-558 (Victor, 2026-10-01: "the
 * questions we need to ask for leaders are direct reports, people rolling up,
 * teams managed") a Leadership job asks the recruiter the same question, and
 * the FIT score's team axis compares the two lists. So the vocabulary lives
 * here, where the backend's job validation, Barney's chips and reader, and the
 * frontend's two forms can all read the same words: a chip one side offers and
 * the other cannot store would be a match nobody can make.
 *
 * SALES DEVELOPMENT IS ITS OWN TEAM (2026-10-01). Until then a team of SDRs
 * or BDRs was filed as New business, the closers' team. Victor: a leader "can
 * be a true VP sales with multiple teams, but could also just be a BDR manager
 * managing a bunch of BDRs", and a job hiring one is not hiring the other. It
 * sits right after New business, the team it books meetings for.
 *
 * The spellings are the stored values. 'Sales Engineer' keeps its capital and
 * its singular, as the profile's chips store it; the team axis compares case,
 * spaces and a plural s insensitively (the backend's pointsForTeam), so a
 * 'Sales engineers' written elsewhere still meets it.
 */
export const MANAGED_TEAMS = [
  'New business',
  'Sales development',
  'Existing business',
  'Partnerships',
  'Customer success',
  'Marketing',
  'Sales Engineer',
] as const;

export type ManagedTeam = (typeof MANAGED_TEAMS)[number];
