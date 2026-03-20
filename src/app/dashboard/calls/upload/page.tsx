import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { getSessionUser } from "@/lib/auth/session";
import { userCan } from "@/lib/permissions/user-can";
import { AudioUploadForm } from "@/modules/calls/components/audio-upload-form";

export default async function CallsUploadPage() {
  const user = await getSessionUser();
  if (!user) {
    notFound();
  }
  if (!userCan(user, "calls", "c")) {
    notFound();
  }

  return (
    <>
      <PageHeader
        title="Upload call"
        description="Your file is stored securely, queued for analysis, then transcribed and summarised by the background worker."
      />
      <AudioUploadForm />
    </>
  );
}
