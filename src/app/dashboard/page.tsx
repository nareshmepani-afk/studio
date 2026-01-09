import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getSession();

  // If the cookie exists but Firebase says it's invalid/expired
  if (!user) {
    redirect("/login");
  }

  return (
    <div>
      <h1>Welcome, {user.email}</h1>
      {/* Dashboard content */}
    </div>
  );
}
