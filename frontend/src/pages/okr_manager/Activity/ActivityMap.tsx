// import React, { useEffect, useState } from "react";
// import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
// import L from "leaflet";
// import "leaflet/dist/leaflet.css";
// import { Select, Spin, Button, Space, Input } from "antd";
// import axios from "axios";
// import dayjs from "dayjs";

// const { Option } = Select;

// interface Activity {
//   id: number;
//   name: string;
//   description?: string;
//   latitude: number;
//   longitude: number;
//   start_date?: string;
//   end_date?: string;
//   progress?: number;
//   status?: "Not Started" | "In Progress" | "Completed";
//   assigned_users?: string[];
// }

// // Fix default marker icon issue
// // delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl:
//     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
//   iconUrl:
//     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
//   shadowUrl:
//     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
// });

// export const ActivityMap: React.FC = () => {
//   const [activities, setActivities] = useState<Activity[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [filterStatus, setFilterStatus] = useState<string | undefined>();
//   const [searchText, setSearchText] = useState("");

//   const fetchActivities = async () => {
//     setLoading(true);
//     try {
//       const res = await axios.get("/api/activities");
//       setActivities(res.data);
//     } catch {
//       console.error("Failed to fetch activities");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchActivities();
//   }, []);

//   // Apply filters
//   const filteredActivities = activities.filter((act) => {
//     if (filterStatus && act.status !== filterStatus) return false;
//     if (searchText && !act.name.toLowerCase().includes(searchText.toLowerCase()))
//       return false;
//     return true;
//   });

//   return (
//     <div style={{ width: "100%", height: "100%" }}>
//       <Space style={{ marginBottom: 16 }}>
//         <Input
//           placeholder="Search by activity name"
//           value={searchText}
//           onChange={(e) => setSearchText(e.target.value)}
//           style={{ width: 200 }}
//         />
//         <Select
//           placeholder="Filter by status"
//           allowClear
//           value={filterStatus}
//           onChange={(val) => setFilterStatus(val)}
//           style={{ width: 180 }}
//         >
//           <Option value="Not Started">Not Started</Option>
//           <Option value="In Progress">In Progress</Option>
//           <Option value="Completed">Completed</Option>
//         </Select>
//         <Button onClick={fetchActivities}>Reload</Button>
//       </Space>

//       {loading ? (
//         <Spin tip="Loading..." />
//       ) : (
//         <MapContainer
//           center={[0, 0]}
//           zoom={2}
//           style={{ width: "100%", height: "600px" }}
//         >
//           <TileLayer
//             attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
//             url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//           />

//           {filteredActivities.map((activity) => (
//             <Marker
//               key={activity.id}
//               position={[activity.latitude, activity.longitude]}
//             >
//               <Popup>
//                 <h3>{activity.name}</h3>
//                 {activity.description && <p>{activity.description}</p>}
//                 {activity.start_date && (
//                   <p>
//                     Start: {dayjs(activity.start_date).format("YYYY-MM-DD")}
//                   </p>
//                 )}
//                 {activity.end_date && (
//                   <p>End: {dayjs(activity.end_date).format("YYYY-MM-DD")}</p>
//                 )}
//                 <p>Progress: {activity.progress ?? 0}%</p>
//                 {activity.assigned_users && (
//                   <p>Assigned: {activity.assigned_users.join(", ")}</p>
//                 )}
//                 <p>Status: {activity.status}</p>
//               </Popup>
//             </Marker>
//           ))}
//         </MapContainer>
//       )}
//     </div>
//   );
// };

// export default ActivityMap;