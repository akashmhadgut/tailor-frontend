import React, { useState } from 'react';
import { BASE_URL } from '../api';

const OrderDetails = ({ order, onEdit, onClose }) => {
  if (!order) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'new': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'ready_for_pickup': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content overflow-y-auto max-h-[90vh] w-full max-w-lg md:max-w-2xl animate-scale-in">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-2xl font-bold text-gray-900">{order.customerName}</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(order.status)} uppercase tracking-wider`}>
                {order.status?.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">{order.orderId}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all text-2xl leading-none">&times;</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Order Info */}
          <div className="space-y-6">
            <section>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Order Details</h4>
              <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Dress Type</span>
                  <span className="text-sm font-semibold text-gray-800">{order.type}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Quantity</span>
                  <span className="text-sm font-semibold text-gray-800">{order.quantity}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Delivery Date</span>
                  <span className="text-sm font-semibold text-indigo-600">{formatDate(order.deliveryDate)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Payment Status</span>
                  <span className={`text-sm font-semibold ${order.paymentStatus === 'Paid' ? 'text-green-600' : 'text-amber-600'}`}>
                    {order.paymentStatus}
                  </span>
                </div>
              </div>
            </section>

            {order.tags && order.tags.length > 0 && (
              <section>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {order.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 shadow-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Customer & Notes */}
          <div className="space-y-6">
            <section>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Attachments</h4>
              {order.attachments && order.attachments.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {order.attachments.map((file, idx) => {
                    const isImg = file.match(/\.(jpg|jpeg|png|gif)$/i);
                    const url = file.startsWith('http') ? file : `${BASE_URL}${file}`;
                    return (
                      <a key={idx} href={url} target="_blank" rel="noreferrer" className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:border-primary-400 transition-all">
                        {isImg ? (
                          <img src={url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400 text-3xl">📄</div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <span className="text-white text-xs font-medium">View File</span>
                        </div>
                      </a>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <p className="text-sm text-gray-400">No attachments</p>
                </div>
              )}
            </section>

            {order.notes && (
              <section>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Notes</h4>
                <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4">
                  <p className="text-sm text-gray-700 leading-relaxed italic">"{order.notes}"</p>
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary">Close</button>
          <button 
            onClick={() => onEdit(order)} 
            className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 shadow-lg shadow-primary-200 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Order Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
