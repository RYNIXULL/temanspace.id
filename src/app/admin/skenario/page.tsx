import React from "react";
import { QuizzesManager } from "@/components/admin/quizzes-manager";

export const dynamic = "force-dynamic";

export default function AdminScenariosPage() {
  return <QuizzesManager quizType="SCENARIO" />;
}
