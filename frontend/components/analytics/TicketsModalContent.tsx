import React, { useEffect, useState } from 'react';
import { getOpenerTickets, Task } from '../../lib/api';
import { Modal } from '../Modal';

interface TicketsModalContentProps {
  isOpen: boolean;
  onClose: () => void;
  openedBy?: string;
  component?: string;
  onTaskClick: (taskId: number) => void;
}

export function TicketsModalContent({
  isOpen,
  onClose,
  openedBy,
  component,
  onTaskClick,
}: TicketsModalContentProps) {
  const [tickets, setTickets] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && (openedBy || component)) {
      loadTickets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, openedBy, component]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await getOpenerTickets(openedBy, component);
      setTickets(data);
    } catch (error) {
      console.error('Failed to load tickets', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'done' || status === 'completed') return 'text-green-600 bg-green-50';
    if (status === 'in_progress' || status === 'inprogress') return 'text-blue-600 bg-blue-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getSeverityColor = (severity?: string) => {
    if (severity === 'critical') return 'text-red-600 bg-red-50';
    if (severity === 'high') return 'text-orange-600 bg-orange-50';
    if (severity === 'medium') return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ticketlar">
      <div className="mb-4">
        <div className="text-sm text-gray-500">
          {openedBy && <span className="font-medium">{openedBy}</span>}
          {openedBy && component && <span className="mx-2">•</span>}
          {component && <span className="font-medium">{component}</span>}
          <span className="ml-2">({tickets.length} ticket)</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Ticket bulunamadı</div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => {
                onTaskClick(ticket.id);
                onClose();
              }}
              className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 mb-2">{ticket.title}</h3>
                  {ticket.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {ticket.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className={`px-2 py-1 rounded-full ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                    {ticket.severity && (
                      <span className={`px-2 py-1 rounded-full ${getSeverityColor(ticket.severity)}`}>
                        {ticket.severity}
                      </span>
                    )}
                    {ticket.project && (
                      <span className="px-2 py-1 rounded-full text-indigo-600 bg-indigo-50">
                        {ticket.project}
                      </span>
                    )}
                    {ticket.componentName && (
                      <span className="px-2 py-1 rounded-full text-purple-600 bg-purple-50">
                        {ticket.componentName}
                      </span>
                    )}
                    {ticket.bucketName && (
                      <span className="px-2 py-1 rounded-full text-gray-600 bg-gray-100">
                        {ticket.bucketName}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right text-xs text-gray-500 whitespace-nowrap">
                  <div>{new Date(ticket.createdAt).toLocaleDateString('tr-TR')}</div>
                  {ticket.assignedTo && (
                    <div className="mt-1 text-gray-700">→ {ticket.assignedTo}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
