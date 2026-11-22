import { describe, it, expect, beforeAll, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { SESSION_COOKIE_NAME } from "@/lib/session";

// Mock next/headers cookies() so Route Handlers work seamlessly inside Vitest
const mockCookieJar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = mockCookieJar.get(name);
      return value ? { name, value } : undefined;
    },
    set: (opts: { name: string; value: string }) => {
      if (!opts.value) mockCookieJar.delete(opts.name);
      else mockCookieJar.set(opts.name, opts.value);
    },
  }),
}));

import { POST as registerHandler } from "@/app/api/auth/register/route";
import { POST as loginHandler } from "@/app/api/auth/login/route";
import { POST as logoutHandler } from "@/app/api/auth/logout/route";
import { GET as meHandler } from "@/app/api/auth/me/route";
import { POST as statusLookupHandler } from "@/app/api/registration-status/route";
import { POST as decisionHandler } from "@/app/api/admin/registrations/[id]/decision/route";
import { PATCH as studentUpdateHandler } from "@/app/api/admin/students/[id]/route";
import {
  GET as adminCategoriesGet,
  POST as adminCategoriesPost,
} from "@/app/api/admin/categories/route";
import {
  PATCH as adminCategoryPatch,
  DELETE as adminCategoryDelete,
} from "@/app/api/admin/categories/[id]/route";
import { POST as adminMaterialPost } from "@/app/api/admin/materials/route";
import {
  PATCH as adminMaterialPatch,
  DELETE as adminMaterialDelete,
} from "@/app/api/admin/materials/[id]/route";
import { POST as adminQuizPost } from "@/app/api/admin/quizzes/route";
import { DELETE as adminQuizDelete } from "@/app/api/admin/quizzes/[id]/route";
import { POST as adminQuestionPost } from "@/app/api/admin/quizzes/[id]/questions/route";
import { PATCH as adminQuestionPatch } from "@/app/api/admin/questions/[questionId]/route";
import { POST as studentAttemptPost } from "@/app/api/student/quizzes/[id]/attempt/route";
import { POST as adminHelpPost } from "@/app/api/admin/help-resources/route";
import {
  PATCH as adminHelpPatch,
  DELETE as adminHelpDelete,
} from "@/app/api/admin/help-resources/[id]/route";
import { GET as studentOverviewGet } from "@/app/api/student/overview/route";
import { GET as adminAuditLogsGet } from "@/app/api/admin/audit-logs/route";

function jsonReq(url: string, method: string, body?: unknown) {
  return new Request(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "127.0.0.10",
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

function syncCookieFromResponse(res: Response) {
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) return;
  const match = setCookie.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]*)`));
  if (match) {
    if (match[1]) mockCookieJar.set(SESSION_COOKIE_NAME, match[1]);
    else mockCookieJar.delete(SESSION_COOKIE_NAME);
  }
}

describe("TEMANSPACE.ID End-to-End API, Auth, RBAC & CRUD Suite", () => {
  const adminEmail = "admin-test@temanspace.local";
  const adminPass = "AdminTest#2026";
  let adminUserId = "";

  const studentEmail = "siswa1@contoh.id";
  const studentPass = "SiswaAman123";
  let studentRefCode = "";
  let studentRegId = "";
  let studentUserId = "";

  const rejectedEmail = "siswa-ditolak@contoh.id";
  let rejectedRegId = "";

  beforeAll(async () => {
    const adminRole = await prisma.role.create({
      data: {
        code: "ADMIN",
        name: "Administrator",
        description: "Test Admin Role",
      },
    });
    await prisma.role.create({
      data: {
        code: "STUDENT",
        name: "Siswa",
        description: "Test Student Role",
      },
    });

    const admin = await prisma.user.create({
      data: {
        roleId: adminRole.id,
        fullName: "Admin Pengelola Uji",
        email: adminEmail,
        passwordHash: await hashPassword(adminPass),
        status: "approved",
      },
    });
    adminUserId = admin.id;
  });

  it("1. Rejects invalid registration input and ignores client-supplied role/status", async () => {
    const badRes = await registerHandler(
      jsonReq("http://localhost/api/auth/register", "POST", {
        fullName: "A",
        email: "bukan-email",
        gradeLevel: "10",
        password: "short",
        confirmPassword: "short",
      })
    );
    expect(badRes.status).toBe(400);

    // Attempt to spoof roleCode="ADMIN" and status="approved"
    const res = await registerHandler(
      jsonReq("http://localhost/api/auth/register", "POST", {
        fullName: "Budi Santoso",
        email: studentEmail,
        gradeLevel: "8",
        password: studentPass,
        confirmPassword: studentPass,
        reasonNote: "Ingin belajar komunikasi asertif",
        roleCode: "ADMIN",
        status: "approved",
      })
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.status).toBe("pending");
    expect(data.referenceCode).toMatch(/^TS-[A-F0-9]{6}$/);
    studentRefCode = data.referenceCode;

    const dbUser = await prisma.user.findUnique({
      where: { email: studentEmail },
      include: { role: true, registrationRequest: true },
    });
    expect(dbUser?.role.code).toBe("STUDENT");
    expect(dbUser?.status).toBe("pending");
    studentUserId = dbUser!.id;
    studentRegId = dbUser!.registrationRequest!.id;
  });

  it("2. Blocks duplicate email registration", async () => {
    const res = await registerHandler(
      jsonReq("http://localhost/api/auth/register", "POST", {
        fullName: "Duplikat",
        email: studentEmail,
        gradeLevel: "7",
        password: studentPass,
        confirmPassword: studentPass,
      })
    );
    expect(res.status).toBe(409);
  });

  it("3. Allows registration status lookup by email + referenceCode", async () => {
    const wrongRes = await statusLookupHandler(
      jsonReq("http://localhost/api/registration-status", "POST", {
        email: studentEmail,
        referenceCode: "TS-000000",
      })
    );
    expect(wrongRes.status).toBe(404);

    const okRes = await statusLookupHandler(
      jsonReq("http://localhost/api/registration-status", "POST", {
        email: studentEmail,
        referenceCode: studentRefCode,
      })
    );
    expect(okRes.status).toBe(200);
    const data = await okRes.json();
    expect(data.registration.accountStatus).toBe("pending");
    expect(data.registration.fullName).toBe("Budi Santoso");
  });

  it("4. Blocks login for pending student account", async () => {
    const res = await loginHandler(
      jsonReq("http://localhost/api/auth/login", "POST", {
        email: studentEmail,
        password: studentPass,
      })
    );
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.code).toBe("ACCOUNT_PENDING");
  });

  it("5. Blocks unauthenticated access to student & admin endpoints", async () => {
    mockCookieJar.clear();
    expect((await meHandler()).status).toBe(401);
    expect((await studentOverviewGet()).status).toBe(401);
    expect((await adminCategoriesGet()).status).toBe(401);
  });

  it("6. Enforces login rate limiting after repeated failed attempts", async () => {
    const targetEmail = "ratelimit-target@contoh.id";
    for (let i = 0; i < 3; i++) {
      await loginHandler(
        jsonReq("http://localhost/api/auth/login", "POST", {
          email: targetEmail,
          password: "WrongPassword1",
        })
      );
    }
    const lockedRes = await loginHandler(
      jsonReq("http://localhost/api/auth/login", "POST", {
        email: targetEmail,
        password: "WrongPassword1",
      })
    );
    expect(lockedRes.status).toBe(429);
    const data = await lockedRes.json();
    expect(data.code).toBe("RATE_LIMITED");
  });

  it("7. Admin logs in, approves student1, and rejects student2 with audit logging", async () => {
    await registerHandler(
      jsonReq("http://localhost/api/auth/register", "POST", {
        fullName: "Calon Ditolak",
        email: rejectedEmail,
        gradeLevel: "9",
        password: studentPass,
        confirmPassword: studentPass,
      })
    );
    const rejUser = await prisma.user.findUnique({
      where: { email: rejectedEmail },
      include: { registrationRequest: true },
    });
    rejectedRegId = rejUser!.registrationRequest!.id;

    const loginRes = await loginHandler(
      jsonReq("http://localhost/api/auth/login", "POST", {
        email: adminEmail,
        password: adminPass,
      })
    );
    expect(loginRes.status).toBe(200);
    syncCookieFromResponse(loginRes);

    const approveRes = await decisionHandler(
      jsonReq(
        `http://localhost/api/admin/registrations/${studentRegId}/decision`,
        "POST",
        { decision: "approve", reviewNote: "Disetujui untuk belajar" }
      ),
      { params: Promise.resolve({ id: studentRegId }) }
    );
    expect(approveRes.status).toBe(200);

    const rejectRes = await decisionHandler(
      jsonReq(
        `http://localhost/api/admin/registrations/${rejectedRegId}/decision`,
        "POST",
        { decision: "reject", reviewNote: "Data belum sesuai" }
      ),
      { params: Promise.resolve({ id: rejectedRegId }) }
    );
    expect(rejectRes.status).toBe(200);

    const logsRes = await adminAuditLogsGet(
      new Request("http://localhost/api/admin/audit-logs")
    );
    expect(logsRes.status).toBe(200);
    const logsData = await logsRes.json();
    const actions = logsData.logs.map((l: { action: string }) => l.action);
    expect(actions).toContain("APPROVE_REGISTRATION");
    expect(actions).toContain("REJECT_REGISTRATION");

    const updatedReq = await prisma.registrationRequest.findUnique({
      where: { id: studentRegId },
    });
    expect(updatedReq?.reviewedById).toBe(adminUserId);
    expect(updatedReq?.reviewedAt).not.toBeNull();
  });

  it("8. Rejected student cannot login; Approved student can login and is restricted from admin APIs", async () => {
    mockCookieJar.clear();
    const rejLogin = await loginHandler(
      jsonReq("http://localhost/api/auth/login", "POST", {
        email: rejectedEmail,
        password: studentPass,
      })
    );
    expect(rejLogin.status).toBe(403);
    expect((await rejLogin.json()).code).toBe("ACCOUNT_REJECTED");

    const stuLogin = await loginHandler(
      jsonReq("http://localhost/api/auth/login", "POST", {
        email: studentEmail,
        password: studentPass,
      })
    );
    expect(stuLogin.status).toBe(200);
    syncCookieFromResponse(stuLogin);

    expect((await studentOverviewGet()).status).toBe(200);
    expect((await adminCategoriesGet()).status).toBe(403);
  });

  it("9. Admin CRUD for Categories, Materials, Quizzes, Questions, Help Resources, and Student Quiz Attempt", async () => {
    mockCookieJar.clear();
    const adminLogin = await loginHandler(
      jsonReq("http://localhost/api/auth/login", "POST", {
        email: adminEmail,
        password: adminPass,
      })
    );
    syncCookieFromResponse(adminLogin);

    const catRes = await adminCategoriesPost(
      jsonReq("http://localhost/api/admin/categories", "POST", {
        name: "Pertemanan Sehat Uji",
        description: "Kategori pengujian pertemanan sehat.",
        iconName: "heart-handshake",
        sortOrder: 1,
        isPublished: true,
      })
    );
    expect(catRes.status).toBe(201);
    const catId = (await catRes.json()).category.id;

    const catPatchRes = await adminCategoryPatch(
      jsonReq(`http://localhost/api/admin/categories/${catId}`, "PATCH", {
        name: "Pertemanan Sehat Updated",
      }),
      { params: Promise.resolve({ id: catId }) }
    );
    expect(catPatchRes.status).toBe(200);

    const matRes = await adminMaterialPost(
      jsonReq("http://localhost/api/admin/materials", "POST", {
        categoryId: catId,
        title: "Mengenal Batasan Pertemanan",
        summary: "Penjelasan ringkas mengenai batasan sehat antarteman.",
        content:
          "Pertemanan sehat dibangun di atas rasa aman dan saling menghargai.",
        keyPoints: ["Saling menghargai", "Menjaga rasa aman"],
        examples: [
          {
            situation: "Teman berbeda pendapat",
            response: "Mendengarkan dengan tenang tanpa mengejek.",
          },
        ],
        readingMinutes: 4,
        sortOrder: 1,
        isPublished: true,
      })
    );
    expect(matRes.status).toBe(201);
    const matId = (await matRes.json()).material.id;

    const matPatch = await adminMaterialPatch(
      jsonReq(`http://localhost/api/admin/materials/${matId}`, "PATCH", {
        readingMinutes: 6,
      }),
      { params: Promise.resolve({ id: matId }) }
    );
    expect(matPatch.status).toBe(200);

    const quizRes = await adminQuizPost(
      jsonReq("http://localhost/api/admin/quizzes", "POST", {
        categoryId: catId,
        title: "Skenario Uji Komunikasi",
        description: "Latihan komunikasi asertif sehari-hari di SMP.",
        type: "SCENARIO",
        sortOrder: 1,
        isPublished: true,
      })
    );
    expect(quizRes.status).toBe(201);
    const quizId = (await quizRes.json()).quiz.id;

    const qRes = await adminQuestionPost(
      jsonReq(`http://localhost/api/admin/quizzes/${quizId}/questions`, "POST", {
        prompt: "Apa langkah paling asertif saat teman memotong pembicaraan?",
        scenarioContext: "Saat diskusi kelompok di kelas.",
        sortOrder: 1,
        options: [
          {
            label: "A",
            optionText: "Aku merasa kurang nyaman saat dipotong, boleh aku selesaikan dulu?",
            isRecommended: true,
            feedbackText: "Tepat, kalimat ini sopan dan jelas.",
            sortOrder: 1,
          },
          {
            label: "B",
            optionText: "Diam lalu marah di grup chat.",
            isRecommended: false,
            feedbackText: "Lebih baik sampaikan langsung dengan tenang.",
            sortOrder: 2,
          },
        ],
      }),
      { params: Promise.resolve({ id: quizId }) }
    );
    expect(qRes.status).toBe(201);
    const questionData = (await qRes.json()).question;
    const questionId = questionData.id;
    const recommendedOptionId = questionData.options[0].id;

    const qPatch = await adminQuestionPatch(
      jsonReq(`http://localhost/api/admin/questions/${questionId}`, "PATCH", {
        prompt: "Langkah paling asertif saat pendapatmu dipotong teman adalah...",
        scenarioContext: "Saat diskusi kelompok di kelas.",
        sortOrder: 1,
        options: questionData.options,
      }),
      { params: Promise.resolve({ questionId }) }
    );
    expect(qPatch.status).toBe(200);
    const updatedOptionId = (await qPatch.json()).question.options[0].id;

    const helpRes = await adminHelpPost(
      jsonReq("http://localhost/api/admin/help-resources", "POST", {
        title: "Menghubungi Guru BK",
        audienceScope: "SCHOOL",
        summary: "Guru BK siap membantu ketika mengalami masalah pertemanan.",
        whenToReachOut: "Saat mengalami pengucilan atau ancaman.",
        steps: ["Datangi ruang BK", "Ceritakan kejadian secara jujur"],
        contactRole: "Guru Bimbingan dan Konseling",
        sortOrder: 1,
        isPublished: true,
      })
    );
    expect(helpRes.status).toBe(201);
    const helpId = (await helpRes.json()).resource.id;
    expect(
      (
        await adminHelpPatch(
          jsonReq(`http://localhost/api/admin/help-resources/${helpId}`, "PATCH", {
            sortOrder: 2,
          }),
          { params: Promise.resolve({ id: helpId }) }
        )
      ).status
    ).toBe(200);
    expect(
      (
        await adminHelpDelete(
          jsonReq(`http://localhost/api/admin/help-resources/${helpId}`, "DELETE"),
          { params: Promise.resolve({ id: helpId }) }
        )
      ).status
    ).toBe(200);

    mockCookieJar.clear();
    const stuLogin = await loginHandler(
      jsonReq("http://localhost/api/auth/login", "POST", {
        email: studentEmail,
        password: studentPass,
      })
    );
    syncCookieFromResponse(stuLogin);

    const attemptRes = await studentAttemptPost(
      jsonReq(`http://localhost/api/student/quizzes/${quizId}/attempt`, "POST", {
        answers: [{ questionId, selectedOptionId: updatedOptionId || recommendedOptionId }],
      }),
      { params: Promise.resolve({ id: quizId }) }
    );
    expect(attemptRes.status).toBe(201);
    const attemptData = await attemptRes.json();
    expect(attemptData.attempt.recommendedCount).toBe(1);
    expect(attemptData.disclaimer).toContain("bukan alat diagnosis psikologis");

    mockCookieJar.clear();
    syncCookieFromResponse(
      await loginHandler(
        jsonReq("http://localhost/api/auth/login", "POST", {
          email: adminEmail,
          password: adminPass,
        })
      )
    );
    expect(
      (
        await adminQuizDelete(
          jsonReq(`http://localhost/api/admin/quizzes/${quizId}`, "DELETE"),
          { params: Promise.resolve({ id: quizId }) }
        )
      ).status
    ).toBe(200);
    expect(
      (
        await adminMaterialDelete(
          jsonReq(`http://localhost/api/admin/materials/${matId}`, "DELETE"),
          { params: Promise.resolve({ id: matId }) }
        )
      ).status
    ).toBe(200);
    expect(
      (
        await adminCategoryDelete(
          jsonReq(`http://localhost/api/admin/categories/${catId}`, "DELETE"),
          { params: Promise.resolve({ id: catId }) }
        )
      ).status
    ).toBe(200);
  });

  it("10. Suspending a logged-in student immediately revokes session and blocks future logins", async () => {
    mockCookieJar.clear();
    const stuLogin = await loginHandler(
      jsonReq("http://localhost/api/auth/login", "POST", {
        email: studentEmail,
        password: studentPass,
      })
    );
    expect(stuLogin.status).toBe(200);
    syncCookieFromResponse(stuLogin);
    const savedStudentCookie = mockCookieJar.get(SESSION_COOKIE_NAME)!;
    expect(savedStudentCookie).toBeTruthy();

    mockCookieJar.clear();
    syncCookieFromResponse(
      await loginHandler(
        jsonReq("http://localhost/api/auth/login", "POST", {
          email: adminEmail,
          password: adminPass,
        })
      )
    );
    const suspendRes = await studentUpdateHandler(
      jsonReq(`http://localhost/api/admin/students/${studentUserId}`, "PATCH", {
        status: "suspended",
      }),
      { params: Promise.resolve({ id: studentUserId }) }
    );
    expect(suspendRes.status).toBe(200);

    mockCookieJar.set(SESSION_COOKIE_NAME, savedStudentCookie);
    expect((await studentOverviewGet()).status).toBe(401);

    const suspendedLogin = await loginHandler(
      jsonReq("http://localhost/api/auth/login", "POST", {
        email: studentEmail,
        password: studentPass,
      })
    );
    expect(suspendedLogin.status).toBe(403);
    expect((await suspendedLogin.json()).code).toBe("ACCOUNT_SUSPENDED");

    const logoutRes = await logoutHandler(
      jsonReq("http://localhost/api/auth/logout", "POST")
    );
    syncCookieFromResponse(logoutRes);
    expect(mockCookieJar.get(SESSION_COOKIE_NAME)).toBeUndefined();
  });
});
