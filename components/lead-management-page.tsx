"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

export type LeadPriority = "高" | "中" | "低";

export type Lead = {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  priority: LeadPriority;
  source: string;
  owner: string;
};

type Filters = {
  createdAt: string;
  name: string;
  phone: string;
  source: string;
  priority: string;
};

type LeadFormValues = {
  name: string;
  phone: string;
  priority: LeadPriority;
  source: string;
  owner: string;
};

const allSources = "全部来源";
const allPriorities = "全部优先级";
const pageSize = 10;

const emptyFilters: Filters = {
  createdAt: "",
  name: "",
  phone: "",
  source: allSources,
  priority: allPriorities,
};

const emptyLeadForm: LeadFormValues = {
  name: "",
  phone: "",
  priority: "中",
  source: "官网咨询",
  owner: "",
};

const sources = [allSources, "官网咨询", "电话推广", "朋友推荐", "线下活动"];
const editableSources = sources.slice(1);
const priorities: Array<typeof allPriorities | LeadPriority> = [
  allPriorities,
  "高",
  "中",
  "低",
];
const editablePriorities: LeadPriority[] = ["高", "中", "低"];

function formatDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createLeadId(leads: Lead[]) {
  const datePart = formatDate().replace(/-/g, "");
  const todayCount = leads.filter((lead) => lead.id.includes(datePart)).length + 1;
  return `XS${datePart}${String(todayCount).padStart(3, "0")}`;
}

function priorityClass(priority: LeadPriority) {
  if (priority === "高") {
    return "bg-red-50 text-crm-danger";
  }

  if (priority === "中") {
    return "bg-amber-50 text-crm-warning";
  }

  return "bg-emerald-50 text-crm-success";
}

async function persistLeads(method: "POST" | "PUT" | "DELETE", payload: unknown) {
  const response = await fetch("/api/leads", {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const result = await response.json().catch(() => null);
    throw new Error(result?.message ?? "保存线索数据失败");
  }

  return (await response.json()) as { leads: Lead[] };
}

export default function LeadManagementPage({ leads }: { leads: Lead[] }) {
  const [leadRows, setLeadRows] = useState<Lead[]>(leads);
  const [draftFilters, setDraftFilters] = useState<Filters>(emptyFilters);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editValues, setEditValues] = useState<LeadFormValues>(emptyLeadForm);
  const [deleteLead, setDeleteLead] = useState<Lead | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addValues, setAddValues] = useState<LeadFormValues>(emptyLeadForm);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredLeads = useMemo(() => {
    return leadRows.filter((lead) => {
      const normalizedPhone = lead.phone.replace(/\s/g, "");
      const phoneFilter = filters.phone.trim().replace(/\s/g, "");

      return (
        (!filters.createdAt || lead.createdAt === filters.createdAt) &&
        (!filters.name.trim() || lead.name.includes(filters.name.trim())) &&
        (!phoneFilter || normalizedPhone.includes(phoneFilter)) &&
        (filters.source === allSources || lead.source === filters.source) &&
        (filters.priority === allPriorities || lead.priority === filters.priority)
      );
    });
  }, [filters, leadRows]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize));
  const pageStartIndex = (currentPage - 1) * pageSize;
  const pageLeads = filteredLeads.slice(pageStartIndex, pageStartIndex + pageSize);
  const displayStart = filteredLeads.length === 0 ? 0 : pageStartIndex + 1;
  const displayEnd = Math.min(pageStartIndex + pageSize, filteredLeads.length);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function updateFilter(key: keyof Filters, value: string) {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  }

  function handleQuery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters({
      ...draftFilters,
      name: draftFilters.name.trim(),
      phone: draftFilters.phone.trim(),
    });
    setCurrentPage(1);
  }

  function openEditDrawer(lead: Lead) {
    setErrorMessage("");
    setDetailLead(null);
    setEditingLead(lead);
    setEditValues({
      name: lead.name,
      phone: lead.phone,
      priority: lead.priority,
      source: lead.source,
      owner: lead.owner,
    });
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingLead) return;

    const nextLead: Lead = {
      ...editingLead,
      name: editValues.name.trim(),
      phone: editValues.phone.trim(),
      priority: editValues.priority,
      source: editValues.source,
      owner: editValues.owner.trim(),
    };

    setIsSaving(true);
    setErrorMessage("");
    try {
      const result = await persistLeads("PUT", nextLead);
      setLeadRows(result.leads);
      setEditingLead(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "保存线索数据失败");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextLead: Lead = {
      id: createLeadId(leadRows),
      createdAt: formatDate(),
      name: addValues.name.trim(),
      phone: addValues.phone.trim(),
      priority: addValues.priority,
      source: addValues.source,
      owner: addValues.owner.trim(),
    };

    setIsSaving(true);
    setErrorMessage("");
    try {
      const result = await persistLeads("POST", nextLead);
      setLeadRows(result.leads);
      setCurrentPage(1);
      setAddValues(emptyLeadForm);
      setIsAddOpen(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "保存线索数据失败");
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteLead) return;

    setIsSaving(true);
    setErrorMessage("");
    try {
      const result = await persistLeads("DELETE", { id: deleteLead.id });
      setLeadRows(result.leads);
      setDeleteLead(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "删除线索失败");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-[244px_minmax(0,1fr)] max-[760px]:block">
      <aside
        className="sticky top-0 h-screen border-r border-white/10 bg-crm-sidebar px-4 py-[22px] text-slate-200 max-[760px]:relative max-[760px]:h-auto max-[760px]:p-4"
        aria-label="主导航"
      >
        <div className="flex items-center gap-2.5 px-2 pb-6 max-[760px]:px-1 max-[760px]:pb-3.5">
          <div className="grid h-[42px] w-[42px] place-items-center rounded-crm bg-gradient-to-br from-blue-500 to-emerald-500 shadow-[0_14px_28px_rgba(37,99,235,0.28)]">
            <Icon className="h-6 w-6">
              <path d="M9 5h6" />
              <path d="M9 9h6" />
              <path d="M9 13h4" />
              <path d="M5 3h14v18H5z" />
            </Icon>
          </div>
          <div>
            <p className="m-0 text-[15px] font-extrabold leading-tight text-white">
              CRM Console
            </p>
            <p className="mt-1 text-[11px] text-slate-400">销售增长工作台</p>
          </div>
        </div>

        <div className="px-2.5 pb-2.5 text-xs font-bold text-slate-500 max-[760px]:hidden">
          业务菜单
        </div>
        <nav className="mt-2 grid gap-1.5 max-[760px]:grid-cols-5 max-[760px]:gap-2">
          <NavItem label="数据仪表盘">
            <path d="M4 13h6V4H4z" />
            <path d="M14 20h6V4h-6z" />
            <path d="M4 20h6v-3H4z" />
          </NavItem>
          <NavItem label="线索管理" active>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
            <path d="M8 13h8" />
            <path d="M8 17h5" />
          </NavItem>
          <NavItem label="商品管理">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <path d="M3.27 6.96 12 12.01l8.73-5.05" />
            <path d="M12 22.08V12" />
          </NavItem>
          <NavItem label="订单管理">
            <path d="M9 11h6" />
            <path d="M9 15h6" />
            <path d="M8 3h8l2 3v15H6V6z" />
          </NavItem>
          <NavItem label="账号管理">
            <path d="M20 21a8 8 0 0 0-16 0" />
            <circle cx="12" cy="7" r="4" />
          </NavItem>
        </nav>
      </aside>

      <main className="min-w-0 p-[22px] max-[760px]:px-4 max-[760px]:py-5">
        <header className="mb-4 flex items-start justify-between gap-5 max-[760px]:flex-col max-[760px]:items-stretch">
          <div>
            <h1 className="m-0 text-[30px] font-bold leading-[1.16] text-crm-text max-[760px]:text-2xl">
              客户线索管理
            </h1>
            <p className="mt-2 max-w-[720px] text-[13px] leading-[1.65] text-crm-muted">
              集中查看新线索、筛选高价值客户并快速分配跟进动作，帮助销售团队保持稳定转化节奏。
            </p>
          </div>
          <Button onClick={() => setIsAddOpen(true)}>
            <Icon>
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </Icon>
            新增线索
          </Button>
        </header>

        {errorMessage ? (
          <div className="mb-3 rounded-crm border border-red-200 bg-red-50 px-3 py-2 text-[13px] font-bold text-crm-danger">
            {errorMessage}
          </div>
        ) : null}

        <section
          className="overflow-hidden rounded-crm border border-crm-border bg-white/90 shadow-crm-panel"
          aria-label="客户线索数据"
        >
          <div className="border-b border-crm-border bg-gradient-to-b from-white to-crm-surface-soft p-4">
            <form
              className="grid grid-cols-[minmax(150px,1fr)_minmax(108px,0.78fr)_minmax(132px,0.86fr)_minmax(128px,0.9fr)_minmax(112px,0.74fr)_max-content] items-end gap-2 max-[1080px]:grid-cols-3 max-[760px]:grid-cols-1"
              onSubmit={handleQuery}
            >
              <Field label="创建时间" htmlFor="createdAt">
                <input
                  className="crm-control"
                  id="createdAt"
                  type="date"
                  value={draftFilters.createdAt}
                  onChange={(event) => updateFilter("createdAt", event.target.value)}
                />
              </Field>
              <Field label="姓名" htmlFor="name">
                <input
                  className="crm-control"
                  id="name"
                  type="search"
                  placeholder="输入姓名"
                  value={draftFilters.name}
                  onChange={(event) => updateFilter("name", event.target.value)}
                />
              </Field>
              <Field label="电话" htmlFor="phone">
                <input
                  className="crm-control"
                  id="phone"
                  type="tel"
                  placeholder="输入手机号"
                  value={draftFilters.phone}
                  onChange={(event) => updateFilter("phone", event.target.value)}
                />
              </Field>
              <Field label="客户来源" htmlFor="source">
                <select
                  className="crm-control"
                  id="source"
                  value={draftFilters.source}
                  onChange={(event) => updateFilter("source", event.target.value)}
                >
                  {sources.map((source) => (
                    <option key={source}>{source}</option>
                  ))}
                </select>
              </Field>
              <Field label="优先级" htmlFor="priority">
                <select
                  className="crm-control"
                  id="priority"
                  value={draftFilters.priority}
                  onChange={(event) => updateFilter("priority", event.target.value)}
                >
                  {priorities.map((priority) => (
                    <option key={priority}>{priority}</option>
                  ))}
                </select>
              </Field>
              <div className="flex flex-wrap gap-2 max-[1080px]:col-span-full max-[760px]:[&>button]:flex-1">
                <Button type="submit">
                  <Icon>
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </Icon>
                  查询
                </Button>
              </div>
            </form>
          </div>

          <div className="w-full overflow-x-hidden bg-white">
            <table className="w-full table-fixed border-collapse">
              <thead>
                <tr className="[&>th]:border-b [&>th]:border-crm-border [&>th]:bg-slate-50 [&>th]:px-2.5 [&>th]:py-3 [&>th]:text-left [&>th]:text-[11px] [&>th]:font-extrabold [&>th]:text-slate-600">
                  <th className="w-[16%]">线索编号</th>
                  <th className="w-[12%]">创建时间</th>
                  <th className="w-[9%]">姓名</th>
                  <th className="w-[14%]">电话</th>
                  <th className="w-[8%]">优先级</th>
                  <th className="w-[14%]">客户来源</th>
                  <th className="w-[9%]">跟进人</th>
                  <th className="w-[118px] text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {pageLeads.map((lead) => (
                  <tr
                    className="[&>td]:overflow-hidden [&>td]:whitespace-nowrap [&>td]:border-b [&>td]:border-crm-border [&>td]:px-2.5 [&>td]:py-3 [&>td]:text-[13px] [&>td]:font-normal [&>td]:text-slate-800 [&>td]:text-ellipsis"
                    key={lead.id}
                  >
                    <td className="tabular-nums text-crm-muted">{lead.id}</td>
                    <td className="text-crm-muted">{lead.createdAt}</td>
                    <td>{lead.name}</td>
                    <td className="tabular-nums">{lead.phone}</td>
                    <td>
                      <span
                        className={`inline-flex min-h-6 items-center rounded-full px-[9px] text-[11px] font-extrabold ${priorityClass(lead.priority)}`}
                      >
                        {lead.priority}
                      </span>
                    </td>
                    <td>{lead.source}</td>
                    <td>{lead.owner}</td>
                    <td className="!overflow-visible text-right">
                      <div className="flex justify-end gap-[5px]">
                        <IconButton label="详情" onClick={() => setDetailLead(lead)}>
                          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                          <circle cx="12" cy="12" r="3" />
                        </IconButton>
                        <IconButton label="修改" onClick={() => openEditDrawer(lead)}>
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
                        </IconButton>
                        <IconButton label="删除" danger onClick={() => setDeleteLead(lead)}>
                          <path d="M3 6h18" />
                          <path d="M8 6V4h8v2" />
                          <path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
                {pageLeads.length === 0 ? (
                  <tr>
                    <td
                      className="border-b border-crm-border px-4 py-10 text-center text-[13px] text-crm-muted"
                      colSpan={8}
                    >
                      没有匹配的线索数据
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-crm-border bg-white px-4 py-3 max-[760px]:flex-col max-[760px]:items-stretch">
            <div className="text-xs text-crm-muted">
              共 <strong className="font-extrabold text-crm-text">{filteredLeads.length}</strong>{" "}
              条筛选结果，当前展示{" "}
              <strong className="font-extrabold text-crm-text">
                {displayStart}-{displayEnd}
              </strong>{" "}
              条
            </div>
            {totalPages > 1 ? (
              <div
                className="flex items-center gap-1.5 max-[760px]:justify-end"
                aria-label="分页"
              >
                <PageButton
                  disabled={currentPage === 1}
                  label="上一页"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                >
                  &lt;
                </PageButton>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                  <PageButton
                    active={page === currentPage}
                    key={page}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </PageButton>
                ))}
                <PageButton
                  disabled={currentPage === totalPages}
                  label="下一页"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                >
                  &gt;
                </PageButton>
              </div>
            ) : null}
          </div>
        </section>
      </main>

      <Drawer title="线索详情" open={Boolean(detailLead)} onClose={() => setDetailLead(null)}>
        {detailLead ? (
          <div className="grid gap-3">
            <DetailRow label="线索编号" value={detailLead.id} />
            <DetailRow label="创建时间" value={detailLead.createdAt} />
            <DetailRow label="姓名" value={detailLead.name} />
            <DetailRow label="电话" value={detailLead.phone} />
            <DetailRow label="优先级" value={detailLead.priority} />
            <DetailRow label="客户来源" value={detailLead.source} />
            <DetailRow label="跟进人" value={detailLead.owner} />
          </div>
        ) : null}
      </Drawer>

      <Drawer title="线索修改" open={Boolean(editingLead)} onClose={() => setEditingLead(null)}>
        <LeadForm
          disabled={isSaving}
          values={editValues}
          submitText={isSaving ? "保存中..." : "保存修改"}
          onChange={setEditValues}
          onSubmit={handleEditSubmit}
        />
      </Drawer>

      <Modal title="添加线索" open={isAddOpen} onClose={() => setIsAddOpen(false)}>
        <LeadForm
          disabled={isSaving}
          layout="grid"
          values={addValues}
          submitText={isSaving ? "添加中..." : "添加"}
          onChange={setAddValues}
          onSubmit={handleAddSubmit}
        />
      </Modal>

      <Modal title="删除确认" open={Boolean(deleteLead)} onClose={() => setDeleteLead(null)}>
        <p className="m-0 text-[13px] leading-6 text-crm-muted">
          确认删除线索{" "}
          <strong className="font-extrabold text-crm-text">{deleteLead?.name}</strong>
          吗？删除后当前列表中将不再展示该线索。
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteLead(null)}>
            取消
          </Button>
          <Button variant="danger" onClick={confirmDelete} disabled={isSaving}>
            {isSaving ? "删除中..." : "确认删除"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function Icon({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <svg
      className={`h-[17px] w-[17px] fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round] ${className}`}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function Button({
  children,
  disabled = false,
  variant = "primary",
  type = "button",
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
}) {
  return (
    <button
      className={[
        "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-crm px-3 text-[13px] font-bold transition duration-200 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0",
        variant === "primary"
          ? "border border-crm-primary bg-crm-primary text-white shadow-crm-button hover:bg-crm-primary-hover focus-visible:ring-blue-600/15"
          : "",
        variant === "secondary"
          ? "border border-crm-border-strong bg-white text-crm-text hover:border-crm-primary focus-visible:ring-blue-600/15"
          : "",
        variant === "danger"
          ? "border border-crm-danger bg-crm-danger text-white hover:bg-red-700 focus-visible:ring-red-600/15"
          : "",
      ].join(" ")}
      type={type}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function Field({
  children,
  htmlFor,
  label,
}: {
  children: ReactNode;
  htmlFor: string;
  label: string;
}) {
  return (
    <div className="min-w-0">
      <label
        className="mb-[5px] block text-[11px] font-extrabold text-slate-700"
        htmlFor={htmlFor}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function NavItem({
  active = false,
  children,
  label,
}: {
  active?: boolean;
  children: ReactNode;
  label: string;
}) {
  return (
    <a
      className={[
        "flex min-h-10 w-full items-center gap-2.5 rounded-crm border px-[11px] py-[9px] text-slate-300 no-underline transition duration-200 hover:bg-white/5 hover:text-white focus-visible:bg-white/5 focus-visible:text-white focus-visible:outline-none max-[760px]:justify-center max-[760px]:p-2.5",
        active
          ? "border-blue-400/45 bg-blue-600/20 text-white"
          : "border-transparent",
      ].join(" ")}
      href="#"
      aria-current={active ? "page" : undefined}
    >
      <Icon>{children}</Icon>
      <span className="max-[760px]:hidden">{label}</span>
    </a>
  );
}

function IconButton({
  children,
  danger = false,
  label,
  onClick,
}: {
  children: ReactNode;
  danger?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={[
        "grid h-[31px] w-[31px] place-items-center rounded-crm border border-crm-border bg-white text-crm-muted transition duration-200 hover:border-crm-primary hover:bg-blue-50 hover:text-crm-primary focus-visible:border-crm-primary focus-visible:bg-blue-50 focus-visible:text-crm-primary focus-visible:outline-none",
        danger
          ? "hover:border-crm-danger hover:bg-red-50 hover:text-crm-danger focus-visible:border-crm-danger focus-visible:bg-red-50 focus-visible:text-crm-danger"
          : "",
      ].join(" ")}
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
    >
      <Icon>{children}</Icon>
    </button>
  );
}

function PageButton({
  active = false,
  children,
  disabled = false,
  label,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  disabled?: boolean;
  label?: string;
  onClick?: () => void;
}) {
  return (
    <button
      className={[
        "grid h-8 min-w-8 place-items-center rounded-crm border text-xs font-bold transition duration-200 hover:border-crm-primary hover:bg-blue-50 hover:text-crm-primary focus-visible:border-crm-primary focus-visible:bg-blue-50 focus-visible:text-crm-primary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-crm-border disabled:hover:bg-white disabled:hover:text-crm-muted",
        active
          ? "border-crm-primary bg-crm-primary text-white"
          : "border-crm-border bg-white text-crm-muted",
      ].join(" ")}
      type="button"
      aria-current={active ? "page" : undefined}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Drawer({
  children,
  onClose,
  open,
  title,
}: {
  children: ReactNode;
  onClose: () => void;
  open: boolean;
  title: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/30" role="dialog" aria-modal="true">
      <div className="absolute right-0 top-0 flex h-full w-[420px] max-w-full flex-col border-l border-crm-border bg-white shadow-crm-panel">
        <div className="flex items-center justify-between border-b border-crm-border px-5 py-4">
          <h2 className="m-0 text-lg font-bold text-crm-text">{title}</h2>
          <button
            className="grid h-8 w-8 place-items-center rounded-crm border border-crm-border bg-white text-crm-muted hover:border-crm-primary hover:bg-blue-50 hover:text-crm-primary"
            type="button"
            aria-label="关闭"
            onClick={onClose}
          >
            x
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

function Modal({
  children,
  onClose,
  open,
  title,
}: {
  children: ReactNode;
  onClose: () => void;
  open: boolean;
  title: string;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 px-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-[460px] overflow-hidden rounded-crm border border-crm-border bg-white shadow-crm-panel">
        <div className="flex items-center justify-between border-b border-crm-border px-5 py-4">
          <h2 className="m-0 text-lg font-bold text-crm-text">{title}</h2>
          <button
            className="grid h-8 w-8 place-items-center rounded-crm border border-crm-border bg-white text-crm-muted hover:border-crm-primary hover:bg-blue-50 hover:text-crm-primary"
            type="button"
            aria-label="关闭"
            onClick={onClose}
          >
            x
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-crm border border-crm-border bg-slate-50 px-3 py-2">
      <div className="text-[11px] font-extrabold text-slate-500">{label}</div>
      <div className="mt-1 text-[13px] font-bold text-crm-text">{value}</div>
    </div>
  );
}

function LeadForm({
  disabled = false,
  layout = "stack",
  onChange,
  onSubmit,
  submitText,
  values,
}: {
  disabled?: boolean;
  layout?: "stack" | "grid";
  onChange: (values: LeadFormValues) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  submitText: string;
  values: LeadFormValues;
}) {
  function updateValue(key: keyof LeadFormValues, value: string) {
    onChange({ ...values, [key]: value });
  }

  return (
    <form
      className={[
        "grid gap-3",
        layout === "grid" ? "grid-cols-2 max-[520px]:grid-cols-1" : "",
      ].join(" ")}
      onSubmit={onSubmit}
    >
      <Field label="姓名" htmlFor={`${submitText}-name`}>
        <input
          className="crm-control"
          id={`${submitText}-name`}
          required
          value={values.name}
          onChange={(event) => updateValue("name", event.target.value)}
          disabled={disabled}
        />
      </Field>
      <Field label="电话" htmlFor={`${submitText}-phone`}>
        <input
          className="crm-control"
          id={`${submitText}-phone`}
          required
          value={values.phone}
          onChange={(event) => updateValue("phone", event.target.value)}
          disabled={disabled}
        />
      </Field>
      <Field label="优先级" htmlFor={`${submitText}-priority`}>
        <select
          className="crm-control"
          id={`${submitText}-priority`}
          value={values.priority}
          onChange={(event) => updateValue("priority", event.target.value as LeadPriority)}
          disabled={disabled}
        >
          {editablePriorities.map((priority) => (
            <option key={priority}>{priority}</option>
          ))}
        </select>
      </Field>
      <Field label="客户来源" htmlFor={`${submitText}-source`}>
        <select
          className="crm-control"
          id={`${submitText}-source`}
          value={values.source}
          onChange={(event) => updateValue("source", event.target.value)}
          disabled={disabled}
        >
          {editableSources.map((source) => (
            <option key={source}>{source}</option>
          ))}
        </select>
      </Field>
      <Field label="跟进人" htmlFor={`${submitText}-owner`}>
        <input
          className="crm-control"
          id={`${submitText}-owner`}
          required
          value={values.owner}
          onChange={(event) => updateValue("owner", event.target.value)}
          disabled={disabled}
        />
      </Field>
      <div
        className={[
          "mt-2 flex justify-end",
          layout === "grid" ? "col-span-2 max-[520px]:col-span-1" : "",
        ].join(" ")}
      >
        <Button type="submit" disabled={disabled}>
          {submitText}
        </Button>
      </div>
    </form>
  );
}
