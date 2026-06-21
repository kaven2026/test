import { promises as fs } from "node:fs";
import path from "node:path";
import LeadManagementPage, { type Lead } from "@/components/lead-management-page";

export const dynamic = "force-dynamic";

async function getLeads() {
  const filePath = path.join(process.cwd(), "data", "leads.json");
  const file = await fs.readFile(filePath, "utf8");
  return JSON.parse(file) as Lead[];
}

export default async function Home() {
  const leads = await getLeads();
  return <LeadManagementPage leads={leads} />;
}
