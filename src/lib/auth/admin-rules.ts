export interface AccountLite {
  userId: string;
  memberId: string | null;
  isAdmin: boolean;
}

/** Admin jos jaettu salasana kelpaa TAI tili on admin. */
export function isAdminFrom(input: {
  sharedPasswordValid: boolean;
  account: { isAdmin: boolean } | null;
}): boolean {
  return input.sharedPasswordValid || input.account?.isAdmin === true;
}

/** Saako tilin (targetUserId) linkittaa jaseneen: estetaan jos joku MUU tili on jo siina. */
export function canLinkMember(memberId: string, targetUserId: string, accounts: AccountLite[]): boolean {
  return !accounts.some((a) => a.memberId === memberId && a.userId !== targetUserId);
}

/** Saako tililta poistaa adminin: estetaan jos se on viimeinen admin. */
export function canRemoveAdmin(userId: string, accounts: AccountLite[]): boolean {
  const admins = accounts.filter((a) => a.isAdmin);
  return !(admins.length === 1 && admins[0]?.userId === userId);
}

/** Kopioidaanko Discord-avatar jasenelle: vain jos jasenella ei kuvaa, avatar on, ja valinta paalla. */
export function shouldCopyAvatar(
  memberAvatar: string | null,
  discordAvatar: string | null,
  choice: boolean,
): boolean {
  return choice && !memberAvatar && Boolean(discordAvatar);
}
