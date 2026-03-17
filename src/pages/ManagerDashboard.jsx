import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function ManagerDashboard({ doctors, appointments, onRemoveDoc, onAddDoc }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDoc, setNewDoc] = useState({
    name: "",
    specialty: "",
    clinic: "",
    image: "https://i.pravatar.cc/150?img=1",
  });

  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 font-sans">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800">
            System Manager Portal
          </h2>
          <p className="text-slate-500">
            Total System Control: {doctors.length} Doctors |{" "}
            {appointments.length} Bookings
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-teal-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-teal-500 transition-all cursor-pointer shadow-lg"
        >
          {showAddForm ? "Close Form" : "+ Add New Doctor"}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-teal-100 mb-10">
          <h3 className="font-bold text-lg mb-4 text-slate-800">
            Register New Doctor
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Doctor Name"
              className="p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-teal-400"
              onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Specialty"
              className="p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-teal-400"
              onChange={(e) =>
                setNewDoc({ ...newDoc, specialty: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Clinic Name"
              className="p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-teal-400"
              onChange={(e) => setNewDoc({ ...newDoc, clinic: e.target.value })}
            />
          </div>
          <button
            onClick={() => {
              onAddDoc(newDoc);
              setShowAddForm(false);
            }}
            className="mt-4 bg-slate-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-700"
          >
            Confirm Registration
          </button>
        </div>
      )}

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold">
            <tr>
              <th className="p-6">Doctor</th>
              <th className="p-6">Specialty / Clinic</th>
              <th className="p-6 text-center">Status</th>
              <th className="p-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map((doc) => (
              <tr
                key={doc.id}
                className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors"
              >
                <td className="p-6">
                  <div className="flex items-center gap-3">
                    <img
                      src={doc.image}
                      className="w-10 h-10 rounded-full"
                      alt=""
                    />
                    <span className="font-bold text-slate-800">{doc.name}</span>
                  </div>
                </td>
                <td className="p-6">
                  <p className="text-sm font-medium text-teal-600">
                    {doc.specialty}
                  </p>
                  <p className="text-xs text-slate-400">{doc.clinic}</p>
                </td>
                {/* 3. SHOW SUSPENDED STATUS */}
                <td className="p-6 text-center">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${doc.isSuspended ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}
                  >
                    {doc.isSuspended ? "Suspended" : "Active"}
                  </span>
                </td>
                <td className="p-6 text-right">
                  {/* 4. CHANGE TO A 'MANAGE' BUTTON */}
                  <button
                    onClick={() => navigate(`/manager/doctor/${doc.id}`)}
                    className="bg-slate-800 text-white hover:bg-slate-700 font-bold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    Manage Profile
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ManagerDashboard;
