
// export const isLoggedIn = () => {
//   if (typeof window === "undefined") return false;

//   try {
//     return !!localStorage.getItem("token");
//   } catch (err) {
//     console.warn("LocalStorage not accessible:", err);
//     return false;
//   }
// };


export function saveToken(token: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem("token", token);
  } catch (err) {
    console.warn("LocalStorage blocked:", err);
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem("token");
  } catch (err) {
    console.warn("LocalStorage get failed:", err);
    return null;
  }
}

export function isLoggedIn(): boolean {
  return !!getToken();
}
