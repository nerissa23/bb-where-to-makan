const storageKey = (groupId: string) => `w2m-member-${groupId}`

export function saveMemberName(groupId: string, name: string): void {
  if (typeof window === "undefined") return
  sessionStorage.setItem(storageKey(groupId), name)
}

export function getMemberName(groupId: string): string | null {
  if (typeof window === "undefined") return null
  return sessionStorage.getItem(storageKey(groupId))
}