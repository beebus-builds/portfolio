import type { Metadata } from "next";
import AdminInbox from "@/components/admin/AdminInbox";
import SitePage, { PageHero } from "@/components/site/SitePage";

export const metadata: Metadata = {
  title: "Inbox",
  robots: { index: false, follow: false },
};

/** Private inbox for contact-form messages, unlocked with ADMIN_TOKEN. */
export default function AdminPage() {
  return (
    <SitePage hero={<PageHero kicker="PRIVATE" title="Inbox" lede="Messages sent through the contact form." />}>
      <AdminInbox />
    </SitePage>
  );
}
