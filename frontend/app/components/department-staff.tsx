"use client";
import { useState } from "react";
import styles from "../workspace/staff/staff.module.css";
type Member = { id: string; status?: string | null; jobTitle?: string | null; user?: { firstName?: string | null; lastName?: string | null } | null };
export default function DepartmentStaff({ staff }: { staff: Member[] }) {
 const [query, setQuery] = useState(""); const [page, setPage] = useState(1);
 const found = staff.filter(member => [member.user?.firstName, member.user?.lastName, member.jobTitle].join(" ").toLowerCase().includes(query.trim().toLowerCase()));
 const pages = Math.max(1, Math.ceil(found.length / 10)); const current = Math.min(page, pages);
 return <><label htmlFor="department-staff-search">Search staff</label><input id="department-staff-search" type="search" value={query} onChange={e => {setQuery(e.target.value); setPage(1);}} placeholder="Search by name or job title" />
 {found.length ? <div className={styles.tableScroll}><table className={styles.table}><thead><tr><th scope="col">Name</th><th scope="col">Job title</th><th scope="col">Status</th></tr></thead><tbody>{found.slice((current-1)*10,current*10).map(member => <tr key={member.id}><td>{[member.user?.firstName, member.user?.lastName].filter(Boolean).join(" ") || "Not provided"}</td><td>{member.jobTitle || "Not provided"}</td><td>{member.status || "Not provided"}</td></tr>)}</tbody></table></div> : <p>{staff.length ? "No staff match your search." : "No staff are assigned to this department."}</p>}
 <p>Page {current} of {pages}</p><button type="button" disabled={current <= 1} onClick={() => setPage(current-1)}>Previous</button> <button type="button" disabled={current >= pages} onClick={() => setPage(current+1)}>Next</button></>;
}
