export const routes = {
  home: "/",
  login: "/login",
  register: "/register",
  dashboard: "/dashboard",
  users: "/dashboard/users",
  calls: "/dashboard/calls",
  callsUpload: "/dashboard/calls/upload",
} as const;

export function callDetail(callId: string): string {
  return `/dashboard/calls/${callId}`;
}
