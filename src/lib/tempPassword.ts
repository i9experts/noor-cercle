// The temporary password a person just signed in with, kept in memory only so
// the "choose your password" screen doesn't ask for it again. A page reload
// forgets it; the screen then asks for it.
let remembered: string | null = null;

export const rememberTempPassword = (p: string | null) => { remembered = p; };
export const takeTempPassword = () => remembered;
