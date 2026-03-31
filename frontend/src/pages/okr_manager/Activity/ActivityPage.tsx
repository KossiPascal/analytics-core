// import React, { useEffect, useRef, useState } from "react";
// import { useQueryClient } from "@tanstack/react-query";
// import { useForm, Controller } from "react-hook-form";
// import { Plus, Edit, Trash2, Check, X } from "lucide-react";
// import { tenantService, userService } from "@/services/identity.service";
// import { activityService, projectService, okrGlobalService, taskService, teamScopeService } from "../components-tabs/services";
// import { Tenant, User } from "@/models/identity.model";
// import { OkrActivity, OkrProject, OkrGlobal, OkrProjectTask, OkrTeamScope } from "../models";
// import { useAuth } from "@/contexts/AuthContext";


// // ----------- Page Component ----------------
// const ActivityPage: React.FC = () => {

//   const { user } = useAuth();
//   const queryClient = useQueryClient();

//   // const createMutation = useMutation(createActivity, { onSuccess: () => queryClient.invalidateQueries(["activities"]) });
//   // const updateMutation = useMutation(({ id, data }: { id: number; data: any }) => updateActivity(id, data), { onSuccess: () => queryClient.invalidateQueries(["activities"]) });
//   // const deleteMutation = useMutation(deleteActivity, { onSuccess: () => queryClient.invalidateQueries(["activities"]) });

//   const [tenants, setTenants] = useState<Tenant[]>([]);
//   const [tenant_id, setTenantId] = useState<number | undefined>(undefined);
//   const [activities, setActivities] = useState<OkrActivity[]>([]);
//   const [projects, setProjects] = useState<OkrProject[]>([]);
//   const [okrs, setOkrs] = useState<OkrGlobal[]>([]);
//   const [tasks, setTasks] = useState<OkrProjectTask[]>([]);
//   const [users, setUsers] = useState<User[]>([]);
//   const [teams, setTeams] = useState<OkrTeamScope[]>([]);
//   const [editingId, setEditingId] = useState<number | null>(null);
//   const [loading, setLoading] = useState<boolean>(false);



//   const didLoad = useRef(false);


//   useEffect(() => {
//     if (didLoad.current) return;
//     didLoad.current = true;
//     tenantService.list().then(t => {
//       setTenants(t || []);
//       setTenantId(user?.tenant_id);
//       setLoading(false);
//     });
//   }, []);



//   useEffect(() => {
//     if (!tenant_id) return;
//     activityService.list(tenant_id).then(d => setActivities(d));
//     projectService.list(tenant_id).then(d => setProjects(d));
//     okrGlobalService.list(tenant_id).then(d => setOkrs(d));
//     taskService.list(tenant_id).then(d => setTasks(d));
//     userService.list(tenant_id).then(d => setUsers(d));
//     teamScopeService.list(tenant_id).then(d => setTeams(d));

//   }, [tenant_id]);



//   const { control, handleSubmit, reset } = useForm<OkrActivity>({
//     defaultValues: {
//       title: "",
//       start_date: "",
//       progress: 0,
//     },
//   });

//   const onSubmit = (data: any) => {
//     // if (editingId) {
//     //   updateMutation.mutate({ id: editingId, data });
//     //   setEditingId(null);
//     // } else {
//     //   createMutation.mutate(data);
//     // }
//     reset({
//       title: "",
//       start_date: "",
//     });
//   };

//   if (loading) return <div>Loading Activities...</div>;

//   function deleteMutation(id: number): void {
//     throw new Error("Function not implemented.");
//   }

//   return (
//     <div className="p-6 max-w-7xl mx-auto">
//       <h1 className="text-3xl font-bold mb-6">Activities</h1>

//       {/* Form */}
//       <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col md:flex-row gap-2 mb-6 flex-wrap">
//         <Controller name={"name" as any} control={control} rules={{ required: "Name required" }} render={({ field, fieldState }) => (
//           <div className="flex-1">
//             <input {...field} placeholder="Activity Name" className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
//             {fieldState.error && <p className="text-red-500 text-sm">{fieldState.error.message}</p>}
//           </div>
//         )} />

//         <Controller name={"description" as any} control={control} render={({ field }) => <input {...field as any} placeholder="Description" className="flex-1 border p-2 rounded" />} />

//         <Controller name="start_date" control={control} render={({ field }) => <input {...field as any} type="date" className="border p-2 rounded" />} />
//         {/* <Controller name="end_date" control={control} render={({ field }) => <input {...field} type="date" className="border p-2 rounded" />} /> */}
//         <Controller name="progress" control={control} render={({ field }) => <input {...field} type="number" placeholder="Progress %" className="border p-2 rounded w-28" />} />
//         <Controller name={"budget" as any} control={control} render={({ field }) => <input {...field} type="number" placeholder="Budget" className="border p-2 rounded w-28" />} />
//         <Controller name={"location" as any} control={control} render={({ field }) => <input {...field} type="text" placeholder="Location" className="border p-2 rounded flex-1" />} />

//         <Controller name={"projects" as any} control={control} render={({ field }) => (
//           <select {...field} multiple className="border p-2 rounded flex-1">
//             {projects?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
//           </select>
//         )} />
//         <Controller name={"okrs" as any} control={control} render={({ field }) => (
//           <select {...field} multiple className="border p-2 rounded flex-1">
//             {okrs?.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
//           </select>
//         )} />
//         <Controller name={"tasks" as any} control={control} render={({ field }) => (
//           <select {...field} multiple className="border p-2 rounded flex-1">
//             {tasks?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
//           </select>
//         )} />
//         <Controller name={"users" as any} control={control} render={({ field }) => (
//           <select {...field} multiple className="border p-2 rounded flex-1">
//             {users?.map(u => <option key={u.id} value={u.id as any}>{u.fullname}</option>)}
//           </select>
//         )} />
//         <Controller name={"teams" as any} control={control} render={({ field }) => (
//           <select {...field} multiple className="border p-2 rounded flex-1">
//             {teams?.map(t => <option key={t.id} value={t.id}>{t.id}</option>)}
//           </select>
//         )} />

//         <div className="flex gap-2">
//           <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-1">
//             {editingId ? <Check size={16} /> : <Plus size={16} />}
//             {editingId ? "Update" : "Add"}
//           </button>
//           {editingId && <button type="button" onClick={() => { setEditingId(null); reset(); }} className="bg-gray-300 px-3 py-2 rounded flex items-center gap-1"><X size={16} /> Cancel</button>}
//         </div>
//       </form>

//       {/* Table */}
//       <table className="w-full border-collapse table-auto">
//         <thead>
//           <tr className="bg-gray-100">
//             <th className="border p-2">#</th>
//             <th className="border p-2">Name</th>
//             <th className="border p-2">Description</th>
//             <th className="border p-2">Dates</th>
//             <th className="border p-2">Progress</th>
//             <th className="border p-2">Budget</th>
//             <th className="border p-2">Location</th>
//             <th className="border p-2">Projects / OKRs</th>
//             <th className="border p-2">Tasks / Users / Teams</th>
//             <th className="border p-2">Actions</th>
//           </tr>
//         </thead>
//         <tbody>
//           {activities?.map((act, idx) => (
//             <tr key={act.id} className="hover:bg-gray-50">
//               <td className="border p-2">{idx + 1}</td>
//               {/* <td className="border p-2">{act.name}</td>
//               <td className="border p-2">{act.description || "-"}</td> */}
//               {/* <td className="border p-2">{act.start_date || "-"} → {act.end_date || "-"}</td> */}
//               <td className="border p-2">{act.progress || 0}%</td>
//               {/* <td className="border p-2">{act.budget || 0}</td>
//               <td className="border p-2">{act.location || "-"}</td>
//               <td className="border p-2">{act.projects?.map(p => p.name).join(", ")} | {act.okrs?.map(o => o.name).join(", ")}</td>
//               <td className="border p-2">{act.tasks?.map(t => t.name).join(", ")} | {act.users?.map(u => u.name).join(", ")} | {act.teams?.map(t => t.name).join(", ")}</td> */}
//               <td className="border p-2 flex gap-2">
//                 <button onClick={() => {
//                   setEditingId(act.id);
//                   // reset({
//                   //   ...act,
//                   //   projects: act.projects?.map(p => p.id) || [],
//                   //   okrs: act.okrs?.map(o => o.id) || [],
//                   //   tasks: act.tasks?.map(t => t.id) || [],
//                   //   users: act.users?.map(u => u.id) || [],
//                   //   teams: act.teams?.map(t => t.id) || [],
//                   // });
//                 }} className="bg-yellow-400 text-white px-3 py-1 rounded flex items-center gap-1">
//                   <Edit size={16} /> Edit
//                 </button>
//                 <button onClick={() => deleteMutation(act.id)} className="bg-red-500 text-white px-3 py-1 rounded flex items-center gap-1">
//                   <Trash2 size={16} /> Delete
//                 </button>
//               </td>
//             </tr>
//           ))}
//           {activities?.length === 0 && (
//             <tr>
//               <td colSpan={10} className="text-center p-4 text-gray-500">No activities found.</td>
//             </tr>
//           )}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export default ActivityPage;