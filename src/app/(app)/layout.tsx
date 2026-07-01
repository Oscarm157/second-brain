import { redirect } from "next/navigation";

import { requireUser } from "@/lib/session";
import { Sidebar } from "./sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await requireUser();
  if (me.mustChangePassword) redirect("/change-password");

  return (
    <div className="min-h-full bg-background">
      <Sidebar name={me.name} />
      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-12 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
