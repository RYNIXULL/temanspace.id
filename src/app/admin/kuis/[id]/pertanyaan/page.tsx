import React from "react";
import { QuestionsManager } from "@/components/admin/questions-manager";

export const dynamic = "force-dynamic";

export default async function AdminQuizQuestionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <QuestionsManager quizId={id} />;
}
