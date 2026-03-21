/**
 * Registry of prompt IDs that require a Paid Host Pass.
 * All Part II through Part VI and Family Storytelling prompts are considered premium.
 * Part I (p1, p2, p3) is free.
 */
export const premiumPromptIds = new Set([
  // Part II
  'p4', 'p5', 'p6', 'p7',
  // Part III
  'p8', 'p9', 'p10', 'p11',
  // Part IV
  'p12', 'p13', 'p14', 'p15',
  // Part V
  'p16', 'p17', 'p18', 'p19',
  // Part VI
  'p20', 'p21', 'p22', 'p23', 'p24',
  // Family Storytelling
  'fs1_1', 'fs2_1', 'fs3_1', 'fs4_1', 'fs5_1', 'fs6_1'
]);
