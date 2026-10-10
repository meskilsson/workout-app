import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { adminKeys } from "../../query/queryClient";
import { useAdminMutation } from "../../query/useAdminMutation";
import { useEffect, useState } from "react";
import { Navigate, NavLink } from "../../routes/navigation";
import { useParams } from "../../routes/navigationHooks";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/ui/button/Button";
import Input from "../../components/ui/input/Input";
import Modal from "../../components/ui/modal/Modal";
import { adminRequest, type AdminItem, type AdminList, type Resource } from "../../services/adminApi";
import { ApiRequestError } from "../../utils/parseJsonResponse";
import AdminEditor from "./AdminEditor";
import styles from "./AdminPage.module.css";

const tabs = ["overview", "users", "exercises", "templates", "sessions"] as const;
const totalLabels: Record<string, string> = { users: "Active users", admins: "Active admins", workouts: "Completed workouts", exercises: "Exercises", sharedExercises: "Shared exercises", templates: "Workout templates", sharedTemplates: "Shared templates", drafts: "Open workout and template drafts" };
const detailLabels: Record<string, string> = { _id: "Record ID", createdBy: "Owner ID", userId: "Owner ID", isCustom: "Personal exercise", isPublic: "Shared template", deletedAt: "Inactive since", createdAt: "Created", updatedAt: "Updated", startedAt: "Workout start", endedAt: "Workout end", exerciseType: "Exercise type", primaryMuscles: "Primary muscles", secondaryMuscles: "Secondary muscles", videoUrl: "Video URL", imageUrl: "Image URL" };
type Confirmation = { title: string; description: string; action: () => Promise<unknown> };
export default function AdminPage() {
  const { section = "overview" } = useParams();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [scope, setScope] = useState("all");


  const [opening, setOpening] = useState(false);
  const [actionError, setError] = useState("");
  const [message, setMessage] = useState("");
  const [access, setAccess] = useState<number | null>(null);

  const [detail, setDetail] = useState<AdminItem | null>(null);
  const [editor, setEditor] = useState<{ item: AdminItem | null; resource: Exclude<Resource, "users"> } | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const resource = section as Resource;
  function failure(cause: unknown) {
    setError(cause instanceof Error ? cause.message : "Request failed");
    if (cause instanceof ApiRequestError && [401, 403].includes(cause.status)) setAccess(cause.status);
  }
  const client = useQueryClient();
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => { const timer = setTimeout(() => setDebouncedSearch(search), 200); return () => clearTimeout(timer); }, [search]);
  const query = useQuery({
    queryKey: adminKeys.list(user?._id ?? "", section, debouncedSearch, page, scope),
    enabled: user?.role === "admin" && tabs.includes(section as typeof tabs[number]),
    queryFn: async ({ signal }) => section === "overview"
      ? { totals: await adminRequest<Record<string, number>>("/dashboard", "GET", undefined, signal), list: null }
      : { totals: null, list: await adminRequest<AdminList>("/" + section + "?" + new URLSearchParams({ search: debouncedSearch, page: String(page), scope }), "GET", undefined, signal) },
    placeholderData: (previous, previousQuery) => previousQuery?.queryKey[1] === user?._id && previousQuery?.queryKey[3] === section ? keepPreviousData(previous) : undefined,
  });
  const list = query.data?.list;
  const totals = query.data?.totals;
  const loading = query.isPending;
  const error = actionError || query.error?.message || "";
  const write = useAdminMutation((action: () => Promise<unknown>) => action());
  const busy = opening || write.isPending;
  const queryAccess = query.error instanceof ApiRequestError && [401, 403].includes(query.error.status) ? query.error.status : null;
  async function open(item: AdminItem, edit: boolean) {
    setOpening(true); setError("");
    try {
      const result = await client.fetchQuery({ queryKey: adminKeys.detail(user?._id ?? "", resource, item._id), queryFn: ({ signal }) => adminRequest<AdminItem>(`/${resource}/${item._id}`, "GET", undefined, signal) });
      if (edit && resource !== "users") setEditor({ resource, item: result }); else setDetail(result);
    } catch (cause) { failure(cause); } finally { setOpening(false); }
  }
  function confirmUser(item: AdminItem, body: { role?: string; active?: boolean }) {
    const action = body.role ? `Change role to ${body.role}` : body.active ? "Restore account" : "Deactivate account";
    setConfirmation({ title: action, description: `${action} for @${item.username}? Deactivation immediately blocks login and API access. Personal records are retained.`, action: () => adminRequest(`/users/${item._id}`, "PATCH", body) });
  }
  async function execute() {
    if (!confirmation) return;
    setError("");
    try { await write.mutateAsync(confirmation.action); setConfirmation(null); setDetail(null); setMessage("Change saved successfully."); }
    catch (cause) { failure(cause); }
  }
  if (access || queryAccess) return <Navigate to={(access ?? queryAccess) === 401 ? "/login" : "/profile"} replace />;
  if (!tabs.includes(section as typeof tabs[number])) return <Navigate to="/admin" replace />;
  return <section className={styles.page}>
    <header><h1>Admin dashboard</h1><p>Manage shared resources and user accounts. Personal workout data is available only when you open a record.</p></header>
    <nav className={styles.tabs} aria-label="Admin navigation">{tabs.map(tab => <NavLink key={tab} to={tab === "overview" ? "/admin" : `/admin/${tab}`} end onClick={() => { setPage(1); setSearch(""); setScope("all"); setDetail(null); setEditor(null); setMessage(""); }} className={({ isActive }) => isActive ? styles.active : undefined}>{tab === "sessions" ? "Workouts" : tab}</NavLink>)}</nav>
    {message && <p role="status">{message}</p>}
    {error && <div role="alert" className={styles.error}><p>{error}</p><Button variant="secondary" onClick={() => { setError(""); void query.refetch(); }}>Retry</Button></div>}
    {section !== "overview" && <div className={styles.toolbar}>
      <Input label={resource === "sessions" ? "Search by exercise name" : "Search"} type="search" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} />
      {["exercises", "templates"].includes(section) && <label className={styles.field}>Visibility<select value={scope} onChange={event => { setScope(event.target.value); setPage(1); }}><option value="all">All resources</option><option value="shared">Shared resources</option><option value="personal">Personal resources</option></select></label>}
      {resource !== "users" && <Button disabled={busy} onClick={() => setEditor({ resource: resource as Exclude<Resource, "users">, item: null })}>Create {resource === "sessions" ? "workout record" : resource === "templates" ? "shared template" : "shared exercise"}</Button>}
    </div>}
    {loading && <p role="status">Loading admin data…</p>}
    {totals && <div className={styles.stats}>{Object.entries(totals).map(([key, value]) => <article key={key}><h2>{totalLabels[key] ?? key}</h2><strong>{value.toLocaleString()}</strong></article>)}</div>}
    {list && <>
      {!list.items.length ? <p>No matching records.</p> : <div className={styles.tableWrap} role="region" aria-label="Records; scroll horizontally to see all columns" tabIndex={0}><table><caption>{section === "sessions" ? "Completed workouts" : section} ({list.total})</caption><thead><tr><th scope="col">Record</th><th scope="col">Ownership / status</th><th scope="col">Actions</th></tr></thead><tbody>{list.items.map(item => <tr key={item._id}>
        <td><strong>{item.name ?? `Workout ${item.endedAt ? new Date(item.endedAt).toLocaleDateString() : ""}`}</strong>{item.username && <div>@{item.username}</div>}<small>ID: {item._id}</small></td>
        <td>{resource === "users" ? <>{item.role} · {item.deletedAt ? "Inactive" : "Active"}</> : resource === "sessions" ? <>Personal · owner {item.userId}</> : <>{(resource === "exercises" ? !item.isCustom : item.isPublic) ? "Shared" : `Personal · owner ${item.createdBy}`}</>}</td>
        <td><div className={styles.actions}><Button variant="ghost" disabled={busy} onClick={() => open(item, false)}>Details</Button>
          {resource === "users" ? <>
            <Button variant="secondary" disabled={busy || item._id === user?._id} onClick={() => confirmUser(item, { role: item.role === "admin" ? "user" : "admin" })}>{item.role === "admin" ? "Demote" : "Make admin"}</Button>
            <Button variant={item.deletedAt ? "secondary" : "danger"} disabled={busy || item._id === user?._id} onClick={() => confirmUser(item, { active: !!item.deletedAt })}>{item.deletedAt ? "Restore" : "Deactivate"}</Button>
          </> : <><Button variant="secondary" disabled={busy} onClick={() => open(item, true)}>Edit</Button><Button variant="danger" disabled={busy} onClick={() => setConfirmation({ title: "Delete resource", description: resource === "exercises" ? `Delete ${item.name}? This removes the exercise from its library. Referenced exercises cannot be deleted.` : resource === "templates" ? `Permanently delete ${item.name}? Existing workout history and drafts are retained; this template can no longer be selected.` : "Remove this personal workout from the owner's history? The record is retained as deleted; other workouts and templates are unaffected.", action: () => adminRequest(`/${resource}/${item._id}`, "DELETE") })}>Delete</Button></>}
        </div></td>
      </tr>)}</tbody></table></div>}
      <div className={styles.actions}><Button variant="secondary" disabled={page <= 1 || busy} onClick={() => setPage(value => value - 1)}>Previous</Button><span>Page {page} of {Math.max(1, Math.ceil(list.total / list.limit))}</span><Button variant="secondary" disabled={page * list.limit >= list.total || busy} onClick={() => setPage(value => value + 1)}>Next</Button></div>
    </>}
    <Modal title="Record details" isOpen={!!detail} onClose={() => setDetail(null)} actions={<Button onClick={() => setDetail(null)}>Close</Button>}>
      {detail && <><dl className={styles.details}>{Object.entries(detail).filter(([key]) => !["exercises", "totals", "__v", "deletedBy", "deleteReason"].includes(key)).map(([key, value]) => <div key={key}><dt>{detailLabels[key] ?? key.charAt(0).toUpperCase() + key.slice(1)}</dt><dd>{Array.isArray(value) ? value.join(", ") : value === null ? "None" : typeof value === "boolean" ? value ? "Yes" : "No" : String(value)}</dd></div>)}</dl>
        {detail.totals && <dl>{Object.entries(detail.totals).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>}
        {detail.exercises?.map((row, index) => <article key={index}><h3>{row.exerciseName}</h3><p>Exercise ID: {row.exerciseId ?? row.exercise ?? "None"}</p><ul>{(row.sets ?? row.plannedSets ?? []).map((set, i) => <li key={i}>{set.reps ?? "—"} reps · {set.weight ?? "—"} kg{set.restSeconds != null ? ` · ${set.restSeconds}s rest` : ""}{set.notes ? ` · ${set.notes}` : ""}</li>)}</ul></article>)}</>}
    </Modal>
    <Modal title={editor?.item ? "Edit resource" : "Create resource"} isOpen={!!editor} onClose={() => setEditor(null)}>{editor && <AdminEditor key={`${editor.resource}-${editor.item?._id ?? "new"}`} {...editor} onCancel={() => setEditor(null)} onSaved={() => { setEditor(null); setMessage("Resource saved successfully."); }} />}</Modal>
    <Modal title={confirmation?.title} isOpen={!!confirmation} onClose={() => { if (!busy) setConfirmation(null); }} actions={<><Button variant="ghost" disabled={busy} onClick={() => setConfirmation(null)}>Cancel</Button><Button variant="danger" disabled={busy} onClick={execute}>{busy ? "Saving…" : "Confirm"}</Button></>}><p>{confirmation?.description}</p>{error && <p role="alert" className={styles.error}>{error}</p>}</Modal>
  </section>;
}
