import React from "react";
import { Outlet, Link } from "react-router-dom";

export default function ManagerLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold">Manager Panel</h1>
        <nav className="flex gap-4">
          <Link to="/manager" className="hover:underline">Overview</Link>
          <Link to="/manager/bookings" className="hover:underline">Bookings</Link>
          <Link to="/manager/parkings" className="hover:underline">Parkings</Link>
          <Link to="/" className="hover:underline">Back to Site</Link>
        </nav>
      </header>

      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
