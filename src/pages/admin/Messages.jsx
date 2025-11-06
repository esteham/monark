import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch messages from database
  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError("");
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch("http://127.0.0.1:8000/api/messages", {
        method: 'GET',
        headers: headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch messages");
      }

      const data = await response.json();
      
      // Check if response has success property
      if (data.success && Array.isArray(data.data)) {
        setMessages(data.data);
      } else if (Array.isArray(data)) {
        setMessages(data);
      } else {
        setMessages([]);
      }
      
    } catch (err) {
      console.error('Fetch messages error:', err);
      setError(err.message || "Failed to load messages");
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  // Mark message as read
  const markAsRead = async (messageId) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`http://127.0.0.1:8000/api/messages/${messageId}/read`, {
        method: 'PUT',
        headers: headers,
      });

      if (response.ok) {
        // Update messages list
        const updatedMessages = messages.map(msg => 
          msg.id === messageId ? { ...msg, status: 'read' } : msg
        );
        setMessages(updatedMessages);
        
        // Update selected message if it's the same
        if (selectedMessage?.id === messageId) {
          setSelectedMessage(prev => ({ ...prev, status: 'read' }));
        }
      }
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  // Mark message as replied
  const markAsReplied = async (messageId) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`http://127.0.0.1:8000/api/messages/${messageId}/replied`, {
        method: 'PUT',
        headers: headers,
      });

      if (response.ok) {
        // Update messages list
        const updatedMessages = messages.map(msg => 
          msg.id === messageId ? { ...msg, status: 'replied' } : msg
        );
        setMessages(updatedMessages);
        
        // Update selected message if it's the same
        if (selectedMessage?.id === messageId) {
          setSelectedMessage(prev => ({ ...prev, status: 'replied' }));
        }
      }
    } catch (err) {
      console.error('Error marking message as replied:', err);
    }
  };

  // Delete message
  const deleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`http://127.0.0.1:8000/api/messages/${messageId}`, {
        method: 'DELETE',
        headers: headers,
      });

      if (response.ok) {
        // Remove from messages list
        const updatedMessages = messages.filter(msg => msg.id !== messageId);
        setMessages(updatedMessages);
        
        // Close modal if deleted message was selected
        if (selectedMessage?.id === messageId) {
          setSelectedMessage(null);
          setShowModal(false);
        }
        
        alert('Message deleted successfully!');
      } else {
        throw new Error('Failed to delete message');
      }
    } catch (err) {
      console.error('Error deleting message:', err);
      alert('Failed to delete message. Please try again.');
    }
  };

  const handleMessageClick = (message) => {
    setSelectedMessage(message);
    setShowModal(true);
    
    // Auto mark as read when clicking on unread message
    if (message.status === 'unread') {
      markAsRead(message.id);
    }
  };

  const handleEmailReply = (message) => {
    const subject = `Re: ${message.subject || 'Your Message'}`;
    const body = `Dear ${message.name},\n\nThank you for contacting Smart Parking System. We have received your message and will respond to you shortly.\n\nBest regards,\nSmart Parking Team\nCustomer Support\n\n--- Original Message ---\nFrom: ${message.name}\nEmail: ${message.email}\nDate: ${new Date(message.created_at).toLocaleString()}\nSubject: ${message.subject || 'No Subject'}\n\nMessage:\n${message.message}`;
    
    // Create mailto link
    const mailtoLink = `mailto:${message.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Open email client
    window.location.href = mailtoLink;
    
    // Mark as replied after email attempt
    setTimeout(() => {
      markAsReplied(message.id);
    }, 1000);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedMessage(null);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      unread: { class: 'bg-warning text-dark', text: 'Unread' },
      read: { class: 'bg-success text-white', text: 'Read' },
      replied: { class: 'bg-info text-white', text: 'Replied' }
    };
    
    const config = statusConfig[status] || statusConfig.unread;
    return <span className={`badge ${config.class}`}>{config.text}</span>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p>Loading messages...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1 text-gray-800">Messages</h1>
        </div>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-outline-info"
            onClick={fetchMessages}
            disabled={loading}
          >
            <i className="fas fa-sync-alt me-2"></i>
            Refresh
          </button>
          <Link to="/admin" className="btn btn-outline-secondary">
            <i className="fas fa-arrow-left me-2"></i>
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <strong>Error!</strong> {error}
          <button type="button" className="btn-close" onClick={() => setError("")}></button>
        </div>
      )}

      {/* Statistics */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h3>{messages.filter(m => m.status === 'unread').length}</h3>
                  <p className="mb-0">Unread Messages</p>
                </div>
                <div className="align-self-center">
                  <i className="fas fa-envelope fa-2x"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h3>{messages.filter(m => m.status === 'read').length}</h3>
                  <p className="mb-0">Read Messages</p>
                </div>
                <div className="align-self-center">
                  <i className="fas fa-envelope-open fa-2x"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-info text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h3>{messages.filter(m => m.status === 'replied').length}</h3>
                  <p className="mb-0">Replied Messages</p>
                </div>
                <div className="align-self-center">
                  <i className="fas fa-reply fa-2x"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Table */}
      <div className="card shadow">
        <div className="card-header bg-primary text-white py-3">
          <h5 className="card-title mb-0">
            <i className="fas fa-inbox me-2"></i>
            Messages ({messages.length})
          </h5>
        </div>
        <div className="card-body p-0">
          {messages.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
              <p className="text-muted">No messages found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-striped mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Status</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Subject</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((message) => (
                    <tr 
                      key={message.id}
                      className={message.status === 'unread' ? 'fw-bold' : ''}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleMessageClick(message)}
                    >
                      <td>
                        {getStatusBadge(message.status)}
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <i className="fas fa-user-circle text-muted me-2"></i>
                          {message.name}
                        </div>
                      </td>
                      <td>
                        <i className="fas fa-envelope text-muted me-2"></i>
                        {message.email}
                      </td>
                      <td>
                        {message.subject || 'No Subject'}
                      </td>
                      <td>
                        <small className="text-muted">
                          {formatDate(message.created_at)}
                        </small>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMessageClick(message);
                            }}
                            title="View Message"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMessage(message.id);
                            }}
                            title="Delete Message"
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
          )}
        </div>
      </div>

      

      {/* Message Modal */}
      {showModal && selectedMessage && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title">
                  <i className="fas fa-envelope me-2"></i>
                  Message Details
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>From:</strong>
                    <p className="mb-1">{selectedMessage.name}</p>
                    <p className="text-muted">
                      <i className="fas fa-envelope me-1"></i>
                      {selectedMessage.email}
                    </p>
                  </div>
                  <div className="col-md-6 text-end">
                    <strong>Received:</strong>
                    <p className="text-muted">
                      <i className="fas fa-clock me-1"></i>
                      {formatDate(selectedMessage.created_at)}
                    </p>
                    <div>
                      {getStatusBadge(selectedMessage.status)}
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <strong>Subject:</strong>
                  <p className="mb-0 p-2 bg-light rounded">{selectedMessage.subject || 'No Subject'}</p>
                </div>

                <div className="mb-3">
                  <strong>Message:</strong>
                  <div className="border rounded p-3 mt-2 bg-light" style={{ minHeight: '150px' }}>
                    {selectedMessage.message}
                  </div>
                </div>
              </div>
              {/* <div className="modal-footer">
                <button
                  className="btn btn-primary"
                  onClick={() => handleEmailReply(selectedMessage)}
                >
                  <i className="fas fa-reply me-2"></i>
                  Reply via Email
                </button>
                
                {selectedMessage.status === 'read' && (
                  <button
                    className="btn btn-info"
                    onClick={() => markAsReplied(selectedMessage.id)}
                  >
                    <i className="fas fa-check me-2"></i>
                    Mark as Replied
                  </button>
                )}
                
                <button
                  className="btn btn-outline-secondary"
                  onClick={closeModal}
                >
                  <i className="fas fa-times me-2"></i>
                  Close
                </button>
              </div> */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}