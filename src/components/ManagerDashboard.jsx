import React from "react";

export default function ManagerDashboard() {
    return (
        <div className="container mt-5">
            <h2>Manager Dashboard</h2>
            <p>Welcome, Manager! এখানে তুমি inventory এবং order track করতে পারবে।</p>

            <div className="card mt-3">
                <div className="card-body">
                    <h5 className="card-title">Manager Actions</h5>
                    <ul>
                        <li>Manage Inventory</li>
                        <li>Track Orders</li>
                        <li>Generate Reports</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
