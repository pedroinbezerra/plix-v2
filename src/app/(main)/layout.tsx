export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getCurrentUser, getCurrentProfile } from "@/lib/auth/session";
import { Navbar } from "@/components/layout/Navbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Footer } from "@/components/layout/Footer";
import { NavigationProvider } from "@/components/layout/NavigationProvider";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfile();

  return (
    <NavigationProvider>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Navbar user={user} profile={profile} />
        <main className="flex-1 pb-16 md:pb-6">{children}</main>
        <Footer />
        <MobileNav />
      </div>
    </NavigationProvider>
  );
}
