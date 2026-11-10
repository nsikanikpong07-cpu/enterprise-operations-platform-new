import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sameOrigin } from "../../../lib/origin";
import { currentCompany } from "../../../lib/company";
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { message: "Request origin is not allowed." },
      { status: 403 },
    );
  const token = (await cookies()).get("enterprise_session")?.value;
  if (!token)
    return NextResponse.json({ message: "Please sign in." }, { status: 401 });
  const current = await currentCompany();
  if (!current.company)
    return NextResponse.json(
      { message: "Company workspace unavailable." },
      { status: current.status === 200 ? 403 : current.status },
    );
  let input: Record<string, unknown>;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }
  if (
    !input ||
    typeof input !== "object" ||
    typeof input.email !== "string" ||
    typeof input.password !== "string" ||
    input.password.length < 15 ||
    input.password.length > 128 ||
    typeof input.firstName !== "string" ||
    !input.firstName.trim() ||
    typeof input.lastName !== "string" ||
    !input.lastName.trim()
  )
    return NextResponse.json(
      {
        message:
          "Enter all required staff details and a password of at least 15 characters.",
      },
      { status: 400 },
    );
  try {
    const response = await fetch(
      `${process.env.BACKEND_URL ?? "https://enterprise-operations-platform-new.onrender.com"}/iam/users`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId: current.company.id,
          email: input.email,
          password: input.password,
          firstName: input.firstName,
          lastName: input.lastName,
          ...(typeof input.jobTitle === "string" && input.jobTitle.trim()
            ? { jobTitle: input.jobTitle.trim() }
            : {}),
          ...(typeof input.employeeNumber === "string" &&
          input.employeeNumber.trim()
            ? { employeeNumber: input.employeeNumber.trim() }
            : {}),

          ...(typeof input.departmentId === "string" &&
          input.departmentId.trim()
            ? { departmentId: input.departmentId.trim() }
            : {}),
        }),
        cache: "no-store",
      },
    );
    const result = await response.json().catch(() => ({}));
    return NextResponse.json(
      {
        message: response.ok
          ? "Staff account created."
          : (result.message ?? "Could not create staff account."),
      },
      { status: response.status },
    );
  } catch {
    return NextResponse.json(
      { message: "The service is unavailable." },
      { status: 503 },
    );
  }
}
