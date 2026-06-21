import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import type { Lead } from "@/components/lead-management-page";

export const dynamic = "force-dynamic";

const filePath = path.join(process.cwd(), "data", "leads.json");

async function readLeads() {
  const file = await fs.readFile(filePath, "utf8");
  return JSON.parse(file) as Lead[];
}

async function writeLeads(leads: Lead[]) {
  await fs.writeFile(filePath, `${JSON.stringify(leads, null, 2)}\n`, "utf8");
}

function validateLeadPayload(lead: Partial<Lead>) {
  return Boolean(
    lead.id &&
      lead.createdAt &&
      lead.name?.trim() &&
      lead.phone?.trim() &&
      lead.priority &&
      lead.source &&
      lead.owner?.trim(),
  );
}

export async function GET() {
  const leads = await readLeads();
  return NextResponse.json({ leads });
}

export async function POST(request: Request) {
  const lead = (await request.json()) as Lead;

  if (!validateLeadPayload(lead)) {
    return NextResponse.json({ message: "线索信息不完整" }, { status: 400 });
  }

  const leads = await readLeads();
  const nextLeads = [lead, ...leads];
  await writeLeads(nextLeads);

  return NextResponse.json({ leads: nextLeads });
}

export async function PUT(request: Request) {
  const lead = (await request.json()) as Lead;

  if (!validateLeadPayload(lead)) {
    return NextResponse.json({ message: "线索信息不完整" }, { status: 400 });
  }

  const leads = await readLeads();
  const exists = leads.some((item) => item.id === lead.id);

  if (!exists) {
    return NextResponse.json({ message: "线索不存在" }, { status: 404 });
  }

  const nextLeads = leads.map((item) => (item.id === lead.id ? lead : item));
  await writeLeads(nextLeads);

  return NextResponse.json({ leads: nextLeads });
}

export async function DELETE(request: Request) {
  const { id } = (await request.json()) as { id?: string };

  if (!id) {
    return NextResponse.json({ message: "缺少线索编号" }, { status: 400 });
  }

  const leads = await readLeads();
  const nextLeads = leads.filter((lead) => lead.id !== id);
  await writeLeads(nextLeads);

  return NextResponse.json({ leads: nextLeads });
}
