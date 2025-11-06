import React from "react";

export default function Ticket({ booking, ticketNumber }) {
  return (
    <div className="card border-primary" style={{ maxWidth: '400px' }}>
      <div className="card-header bg-primary text-white text-center">
        <h4 className="mb-0">PARKING TICKET</h4>
      </div>
      <div className="card-body">
        <div className="text-center mb-3">
          <h5 className="text-primary">{ticketNumber}</h5>
          <small className="text-muted">Generated on: {new Date().toLocaleString()}</small>
        </div>
        
        <hr />
        
        <div className="row">
          <div className="col-6">
            <strong>User:</strong>
          </div>
          <div className="col-6">
            {booking.user?.name}
          </div>
        </div>
        
        <div className="row">
          <div className="col-6">
            <strong>Parking:</strong>
          </div>
          <div className="col-6">
            {booking.parking?.name}
          </div>
        </div>
        
        <div className="row">
          <div className="col-6">
            <strong>Slot:</strong>
          </div>
          <div className="col-6">
            {booking.slot?.slot_code}
          </div>
        </div>
        
        <div className="row">
          <div className="col-6">
            <strong>Duration:</strong>
          </div>
          <div className="col-6">
            {booking.hours} hour(s)
          </div>
        </div>
        
        <div className="row">
          <div className="col-6">
            <strong>Base Charge:</strong>
          </div>
          <div className="col-6">
            BDT {parseFloat(booking.total_price).toFixed(2)}
          </div>
        </div>
        
        {booking.extra_charges > 0 && (
          <div className="row">
            <div className="col-6">
              <strong>Extra Charges:</strong>
            </div>
            <div className="col-6 text-warning">
              + BDT {parseFloat(booking.extra_charges).toFixed(2)}
            </div>
          </div>
        )}
        
        <hr />
        
        <div className="row">
          <div className="col-6">
            <strong>Total Paid:</strong>
          </div>
          <div className="col-6 text-success fw-bold">
            BDT {(parseFloat(booking.total_price) + parseFloat(booking.extra_charges || 0)).toFixed(2)}
          </div>
        </div>
        
        <div className="text-center mt-3">
          <small className="text-muted">
            Thank you for using our parking service!
          </small>
        </div>
      </div>
    </div>
  );
}