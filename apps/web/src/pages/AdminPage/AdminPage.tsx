import { displayValue, locale, translateMessage, t } from "../../i18n";
import { useTranslation } from "react-i18next";
import { friendlyError } from "../../utils/formValidation";
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

function formatDetail(key: string, value: unknown): string {
  if (value === null) return t("AdminPage.none");
  if (typeof value === "boolean") return value ? t("AdminPage.yes") : t("AdminPage.no");
  if (typeof value === "number") return value.toLocaleString(locale());
  if (["primaryMuscles", "secondaryMuscles"].includes(key) && Array.isArray(value)) return value.map(item => displayValue(String(item))).join(", ");
  if (["equipment", "difficulty", "exerciseType", "category", "role", "status"].includes(key)) return displayValue(String(value));
  if (["createdAt", "updatedAt", "startedAt", "endedAt", "deletedAt"].includes(key) && typeof value === "string" && Number.isFinite(Date.parse(value))) return new Intl.DateTimeFormat(locale(), { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  return Array.isArray(value) ? value.join(", ") : String(value);
}

type Confirmation = { title: string; description: string; action: () => Promise<unknown> };
export default function AdminPage() {
    useTranslation();
    const totalLabels: Record<string, string> = { users: t("AdminPage.activeUsers"), admins: t("AdminPage.activeAdmins"), workouts: t("common.completedWorkouts"), exercises: t("common.exercises"), sharedExercises: t("AdminPage.sharedExercises"), templates: t("common.workoutTemplates"), sharedTemplates: t("AdminPage.sharedTemplates"), drafts: t("AdminPage.openWorkoutAndTemplateDrafts") };
    const detailLabels: Record<string, string> = { _id: t("AdminPage.recordID"), createdBy: t("common.ownerID"), userId: t("common.ownerID"), isCustom: t("AdminPage.personalExercise"), isPublic: t("AdminPage.sharedTemplate"), deletedAt: t("AdminPage.inactiveSince"), createdAt: t("AdminPage.created"), updatedAt: t("AdminPage.updated"), startedAt: t("AdminPage.workoutStart"), endedAt: t("AdminPage.workoutEnd"), exerciseType: t("common.exerciseType"), primaryMuscles: t("common.primaryMuscles"), secondaryMuscles: t("common.secondaryMuscles"), videoUrl: t("common.videoURL"), imageUrl: t("common.imageURL") };

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
    setError(friendlyError(cause, t("AdminPage.requestFailed")));
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
  const error = actionError || (query.error ? friendlyError(query.error, t("common.unableToLoadThisContentPleaseTryAgain")) : "");
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
    const action = body.role ? t("AdminPage.changeRoleToValue", { value0: displayValue(body.role) }) : body.active ? t("AdminPage.restoreAccount") : t("AdminPage.deactivateAccount");
    setConfirmation({ title: action, description: t("AdminPage.valueForValueDeactivationImmediatelyBlocksLoginAndAPI", { value0: action, value1: item.username }), action: () => adminRequest(`/users/${item._id}`, "PATCH", body) });
  }
  async function execute() {
    if (!confirmation) return;
    setError("");
    try { await write.mutateAsync(confirmation.action); setConfirmation(null); setDetail(null); setMessage(t("AdminPage.changeSavedSuccessfully")); }
    catch (cause) { failure(cause); }
  }
  if (access || queryAccess) return <Navigate to={(access ?? queryAccess) === 401 ? "/login" : "/profile"} replace />;
  if (!tabs.includes(section as typeof tabs[number])) return <Navigate to="/admin" replace />;
  return <section className={styles.page}>
    <header><h1>{t("AdminPage.adminDashboard")}</h1><p>{t("AdminPage.manageSharedResourcesAndUserAccountsPersonalWorkoutData")}</p></header>
    <nav className={styles.tabs} aria-label={t("AdminPage.adminNavigation")}>{tabs.map(tab => <NavLink key={tab} to={tab === "overview" ? "/admin" : `/admin/${tab}`} end onClick={() => { setPage(1); setSearch(""); setScope("all"); setDetail(null); setEditor(null); setMessage(""); }} className={({ isActive }) => isActive ? styles.active : undefined}>{tab === "sessions" ? t("common.workouts") : displayValue(tab)}</NavLink>)}</nav>
    {message && <p role="status">{translateMessage(message)}</p>}
    {error && <div role="alert" className={styles.error}><p>{translateMessage(error)}</p><Button variant="secondary" onClick={() => { setError(""); void query.refetch(); }}>{t("common.retry")}</Button></div>}
    {section !== "overview" && <div className={styles.toolbar}>
      <Input label={resource === "sessions" ? t("AdminPage.searchByExerciseName") : t("AdminPage.search")} type="search" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} />
      {["exercises", "templates"].includes(section) && <label className={styles.field}>{t("AdminPage.visibility")}<select value={scope} onChange={event => { setScope(event.target.value); setPage(1); }}><option value="all">{t("AdminPage.allResources")}</option><option value="shared">{t("AdminPage.sharedResources")}</option><option value="personal">{t("AdminPage.personalResources")}</option></select></label>}
      {resource !== "users" && <Button disabled={busy} onClick={() => setEditor({ resource: resource as Exclude<Resource, "users">, item: null })}>{t("AdminPage.create")} {resource === "sessions" ? t("AdminPage.workoutRecord") : resource === "templates" ? t("AdminPage.sharedTemplate2") : t("AdminPage.sharedExercise")}</Button>}
    </div>}
    {loading && <p role="status">{t("AdminPage.loadingAdminData")}</p>}
    {totals && <div className={styles.stats}>{Object.entries(totals).map(([key, value]) => <article key={key}><h2>{totalLabels[key] ?? key}</h2><strong>{value.toLocaleString(locale())}</strong></article>)}</div>}
    {list && <>
      {!list.items.length ? <p>{t("AdminPage.noMatchingRecords")}</p> : <div className={styles.tableWrap} role="region" aria-label={t("AdminPage.recordsScrollHorizontallyToSeeAllColumns")} tabIndex={0}><table><caption>{section === "sessions" ? t("common.completedWorkouts") : displayValue(section)} ({list.total})</caption><thead><tr><th scope="col">{t("AdminPage.record")}</th><th scope="col">{t("AdminPage.ownershipStatus")}</th><th scope="col">{t("AdminPage.actions")}</th></tr></thead><tbody>{list.items.map(item => <tr key={item._id}>
        <td><strong>{item.name ?? t("AdminPage.workoutValue", { value0: item.endedAt ? new Date(item.endedAt).toLocaleDateString(locale()) : "" })}</strong>{item.username && <div>@{item.username}</div>}<small>{t("AdminPage.id")} {item._id}</small></td>
        <td>{resource === "users" ? <>{displayValue(item.role)} · {item.deletedAt ? t("AdminPage.inactive") : t("AdminPage.active")}</> : resource === "sessions" ? <>{t("AdminPage.personalOwner")} {item.userId}</> : <>{(resource === "exercises" ? !item.isCustom : item.isPublic) ? t("AdminPage.shared") : t("AdminPage.personalOwnerValue", { value0: item.createdBy })}</>}</td>
        <td><div className={styles.actions}><Button variant="ghost" disabled={busy} onClick={() => open(item, false)}>{t("AdminPage.details")}</Button>
          {resource === "users" ? <>
            <Button variant="secondary" disabled={busy || item._id === user?._id} onClick={() => confirmUser(item, { role: item.role === "admin" ? "user" : "admin" })}>{item.role === "admin" ? t("AdminPage.demote") : t("AdminPage.makeAdmin")}</Button>
            <Button variant={item.deletedAt ? "secondary" : "danger"} disabled={busy || item._id === user?._id} onClick={() => confirmUser(item, { active: !!item.deletedAt })}>{item.deletedAt ? t("AdminPage.restore") : t("AdminPage.deactivate")}</Button>
          </> : <><Button variant="secondary" disabled={busy} onClick={() => open(item, true)}>{t("common.edit")}</Button><Button variant="danger" disabled={busy} onClick={() => setConfirmation({ title: t("AdminPage.deleteResource"), description: resource === "exercises" ? t("AdminPage.deleteValueThisRemovesTheExerciseFromItsLibrary", { value0: item.name }) : resource === "templates" ? t("AdminPage.permanentlyDeleteValueExistingWorkoutHistoryAndDraftsAre", { value0: item.name }) : t("AdminPage.removeThisPersonalWorkoutFromTheOwnerSHistory"), action: () => adminRequest(`/${resource}/${item._id}`, "DELETE") })}>{t("common.delete")}</Button></>}
        </div></td>
      </tr>)}</tbody></table></div>}
      <div className={styles.actions}><Button variant="secondary" disabled={page <= 1 || busy} onClick={() => setPage(value => value - 1)}>{t("common.previous")}</Button><span>{t("common.page")} {page} {t("common.of")} {Math.max(1, Math.ceil(list.total / list.limit))}</span><Button variant="secondary" disabled={page * list.limit >= list.total || busy} onClick={() => setPage(value => value + 1)}>{t("common.next")}</Button></div>
    </>}
    <Modal title={t("AdminPage.recordDetails")} isOpen={!!detail} onClose={() => setDetail(null)} actions={<Button onClick={() => setDetail(null)}>{t("common.close")}</Button>}>
      {detail && <><dl className={styles.details}>{Object.entries(detail).filter(([key]) => !["exercises", "totals", "__v", "deletedBy", "deleteReason"].includes(key)).map(([key, value]) => <div key={key}><dt>{detailLabels[key] ?? t("fields." + key, { defaultValue: key.charAt(0).toUpperCase() + key.slice(1) })}</dt><dd>{formatDetail(key, value)}</dd></div>)}</dl>
        {detail.totals && <dl className={styles.details}>{Object.entries(detail.totals).map(([key, value]) => <div key={key}><dt>{t("fields." + key, { defaultValue: key })}</dt><dd>{value.toLocaleString(locale())}</dd></div>)}</dl>}
        {detail.exercises?.map((row, index) => <article className={styles.record} key={index}><h3>{row.exerciseName}</h3><p>{t("AdminPage.exerciseID")} {row.exerciseId ?? row.exercise ?? t("common.none")}</p><ul>{(row.sets ?? row.plannedSets ?? []).map((set, i) => <li key={i}>{set.reps ?? "—"} {t("AdminPage.reps")} {set.weight ?? "—"} {t("common.kg")}{set.restSeconds != null ? t("AdminPage.valuesRest", { value0: set.restSeconds }) : ""}{set.notes ? t("AdminPage.value", { value0: set.notes }) : ""}</li>)}</ul></article>)}</>}
    </Modal>
    <Modal title={editor?.item ? t("AdminPage.editResource") : t("AdminPage.createResource")} isOpen={!!editor} onClose={() => setEditor(null)}>{editor && <AdminEditor key={`${editor.resource}-${editor.item?._id ?? "new"}`} {...editor} onCancel={() => setEditor(null)} onSaved={() => { setEditor(null); setMessage(t("AdminPage.resourceSavedSuccessfully")); }} />}</Modal>
    <Modal title={confirmation?.title && translateMessage(confirmation?.title)} isOpen={!!confirmation} onClose={() => { if (!busy) setConfirmation(null); }} actions={<><Button variant="ghost" disabled={busy} onClick={() => setConfirmation(null)}>{t("common.cancel")}</Button><Button variant="danger" disabled={busy} onClick={execute}>{busy ? t("common.saving2") : t("AdminPage.confirm")}</Button></>}><p>{confirmation?.description && translateMessage(confirmation?.description)}</p>{error && <p role="alert" className={styles.error}>{translateMessage(error)}</p>}</Modal>
  </section>;
}
