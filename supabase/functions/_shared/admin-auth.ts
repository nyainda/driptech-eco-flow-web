/**
 * Uses the project's existing role table instead of trusting email domains.
 * A lookup failure is intentionally treated as unauthorized.
 */
export async function hasAdminRole(adminClient: any, userId: string): Promise<boolean> {
  const { data, error } = await adminClient.rpc("is_admin", { _user_id: userId });
  return !error && data === true;
}
