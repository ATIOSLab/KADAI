import { redirect } from "next/navigation";
import { getDefaultPathForRole } from "@/lib/rbac";
import { getServerSessionUser } from "@/lib/session";

export default async function Home() {
  const sessionUser = await getServerSessionUser();
  redirect(getDefaultPathForRole(sessionUser?.role));
}
