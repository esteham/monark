import React, { useEffect, useState } from "react";
import axios from "axios";

export default function AdminSlots() {
  const [slots, setSlots] = useState([]);
  const [parkings, setParkings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [filterParking, setFilterParking] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [formData, setFormData] = useState({
    parking_id: "",
    slot_code: "",
    type: "Standard",
    available: true
  });

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`https://monark.xetroot.com/api/admin/slots`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (res.data.success) {
        setSlots(res.data.data);
      } else {
        setSlots([]);
      }
    } catch (err) {
      console.error("Error fetching slots:", err.response?.data || err.message);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchParkings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`https://monark.xetroot.com/api/admin/parkings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (res.data.success) {
        setParkings(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching parkings:", err.response?.data || err.message);
    }
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`https://monark.xetroot.com/api/admin/slots`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (res.data.success) {
        alert('Slot added successfully!');
        setShowAddModal(false);
        resetForm();
        fetchSlots();
      }
    } catch (err) {
      console.error("Error adding slot:", err);
      alert('Failed to add slot');
    }
  };

  const handleEditSlot = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`https://monark.xetroot.com/api/admin/slots/${selectedSlot.id}`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (res.data.success) {
        alert('Slot updated successfully!');
        setShowEditModal(false);
        resetForm();
        fetchSlots();
      }
    } catch (err) {
      console.error("Error updating slot:", err);
      alert('Failed to update slot');
    }
  };

  const handleDeleteSlot = async (slotId, slotCode) => {
    if (!window.confirm(`Are you sure you want to delete slot "${slotCode}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete(`https://monark.xetroot.com/api/admin/slots/${slotId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (res.data.success) {
        alert('Slot deleted successfully!');
        fetchSlots();
      }
    } catch (err) {
      console.error("Error deleting slot:", err);
      alert('Failed to delete slot');
    }
  };

  const toggleSlotAvailability = async (slot) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`https://monark.xetroot.com/api/admin/slots/${slot.id}/toggle-availability`, {
        available: !slot.available
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (res.data.success) {
        fetchSlots();
      }
    } catch (err) {
      console.error("Error toggling slot availability:", err);
      alert('Failed to update slot availability');
    }
  };

  const resetForm = () => {
    setFormData({
      parking_id: "",
      slot_code: "",
      type: "Standard",
      available: true
    });
    setSelectedSlot(null);
  };

  const openEditModal = (slot) => {
    setSelectedSlot(slot);
    setFormData({
      parking_id: slot.parking_id,
      slot_code: slot.slot_code,
      type: slot.type,
      available: slot.available
    });
    setShowEditModal(true);
  };

  useEffect(() => {
    fetchSlots();
    fetchParkings();
  }, []);

  // Filtered slots
  const filteredSlots = slots.filter(slot => {
    return (
      (filterParking === "" || slot.parking_id.toString() === filterParking) &&
      (filterStatus === "" || 
        (filterStatus === "available" && slot.available) ||
        (filterStatus === "occupied" && !slot.available))
    );
  });

  const getParkingName = (parkingId) => {
    const parking = parkings.find(p => p.id === parkingId);
    return parking ? parking.name : 'Unknown Parking';
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">
          <i className="fas fa-parking me-2"></i>
          Parking Slots Management
        </h2>
        <button 
          className="btn btn-success"
          onClick={() => setShowAddModal(true)}
        >
          <i className="fas fa-plus me-2"></i>
          Add New Slot
        </button>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Filter by Parking</label>
              <select 
                className="form-select"
                value={filterParking}
                onChange={(e) => setFilterParking(e.target.value)}
              >
                <option value="">All Parkings</option>
                {parkings.map(parking => (
                  <option key={parking.id} value={parking.id}>
                    {parking.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Filter by Status</label>
              <select 
                className="form-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">&nbsp;</label>
              <button 
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setFilterParking("");
                  setFilterStatus("");
                }}
              >
                <i className="fas fa-times me-2"></i>
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-grow text-primary mb-3" style={{width: '3rem', height: '3rem'}} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading slots data...</p>
        </div>
      ) : filteredSlots.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <i className="fas fa-parking fa-4x text-muted mb-3"></i>
            <h4 className="text-muted">No Slots Found</h4>
            <p className="text-muted">
              {filterParking || filterStatus 
                ? 'No slots match your filter criteria.' 
                : 'There are no parking slots in the system yet.'
              }
            </p>
            <button 
              className="btn btn-success"
              onClick={() => setShowAddModal(true)}
            >
              <i className="fas fa-plus me-2"></i>
              Add First Slot
            </button>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="border-0 py-3 fw-bold text-uppercase text-muted small">Slot Code</th>
                    <th className="border-0 py-3 fw-bold text-uppercase text-muted small">Parking Location</th>
                    <th className="border-0 py-3 fw-bold text-uppercase text-muted small">Type</th>
                    <th className="border-0 py-3 fw-bold text-uppercase text-muted small">Status</th>
                    <th className="border-0 py-3 fw-bold text-uppercase text-muted small">Created At</th>
                    <th className="border-0 py-3 fw-bold text-uppercase text-muted small text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSlots.map(slot => (
                    <tr key={slot.id} className="border-top border-light">
                      <td className="py-3">
                        <span className="badge bg-primary fs-6 px-3 py-2">
                          <i className="fas fa-parking me-2"></i>
                          {slot.slot_code}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="fw-semibold text-dark">
                          {getParkingName(slot.parking_id)}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`badge ${slot.type === 'Large' ? 'bg-warning text-dark' : 'bg-secondary'} px-3 py-2`}>
                          {slot.type}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`badge ${slot.available ? 'bg-success' : 'bg-danger'} px-3 py-2`}>
                          <i className={`fas ${slot.available ? 'fa-check-circle' : 'fa-times-circle'} me-2`}></i>
                          {slot.available ? 'Available' : 'Occupied'}
                        </span>
                      </td>
                      <td className="py-3">
                        <small className="text-muted">
                          {new Date(slot.created_at).toLocaleDateString('en-BD')}
                        </small>
                      </td>
                      <td className="py-3 text-center">
                        <div className="d-flex justify-content-center gap-2">
                          <button 
                            className={`btn ${slot.available ? 'btn-warning' : 'btn-success'} btn-sm`}
                            onClick={() => toggleSlotAvailability(slot)}
                            title={slot.available ? "Mark as Occupied" : "Mark as Available"}
                          >
                            <i className={`fas ${slot.available ? 'fa-times' : 'fa-check'}`}></i>
                          </button>
                          <button 
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => openEditModal(slot)}
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteSlot(slot.id, slot.slot_code)}
                            disabled={!slot.available}
                            title={!slot.available ? "Cannot delete occupied slot" : "Delete slot"}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Slot Modal */}
      {showAddModal && (
        <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-dark">Add New Parking Slot</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                ></button>
              </div>
              <form onSubmit={handleAddSlot}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Select Parking</label>
                    <select 
                      className="form-select"
                      value={formData.parking_id}
                      onChange={(e) => setFormData({...formData, parking_id: e.target.value})}
                      required
                    >
                      <option value="">Choose Parking...</option>
                      {parkings.map(parking => (
                        <option key={parking.id} value={parking.id}>
                          {parking.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Slot Code</label>
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="e.g., A1, B2, C3"
                      value={formData.slot_code}
                      onChange={(e) => setFormData({...formData, slot_code: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Slot Type</label>
                    <select 
                      className="form-select"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      required
                    >
                      <option value="Standard">Standard</option>
                      <option value="Large">Large</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <div className="form-check">
                      <input 
                        type="checkbox" 
                        className="form-check-input"
                        checked={formData.available}
                        onChange={(e) => setFormData({...formData, available: e.target.checked})}
                      />
                      <label className="form-check-label">
                        Available for booking
                      </label>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success">
                    Add Slot
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Slot Modal */}
      {showEditModal && selectedSlot && (
        <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-dark">Edit Slot - {selectedSlot.slot_code}</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                ></button>
              </div>
              <form onSubmit={handleEditSlot}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Select Parking</label>
                    <select 
                      className="form-select"
                      value={formData.parking_id}
                      onChange={(e) => setFormData({...formData, parking_id: e.target.value})}
                      required
                    >
                      <option value="">Choose Parking...</option>
                      {parkings.map(parking => (
                        <option key={parking.id} value={parking.id}>
                          {parking.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Slot Code</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={formData.slot_code}
                      onChange={(e) => setFormData({...formData, slot_code: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Slot Type</label>
                    <select 
                      className="form-select"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      required
                    >
                      <option value="Standard">Standard</option>
                      <option value="Large">Large</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <div className="form-check">
                      <input 
                        type="checkbox" 
                        className="form-check-input"
                        checked={formData.available}
                        onChange={(e) => setFormData({...formData, available: e.target.checked})}
                      />
                      <label className="form-check-label">
                        Available for booking
                      </label>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowEditModal(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success">
                    Update Slot
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}