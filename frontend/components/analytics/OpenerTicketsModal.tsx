import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { getOpenerTickets, Task } from '../../lib/api';
import { Button } from '../ui';

interface OpenerTicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
  openedBy?: string;
  component?: string;
  onTaskClick: (taskId: number) => void;
}

export function OpenerTicketsModal({
  isOpen,
  onClose,
  openedBy,
  component,
  onTaskClick,
}: OpenerTicketsModalProps) {
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

  if (!isOpen) return null;

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
    <div
      className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-6xl flex-col rounded-lg bg-white shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Ticketlar</h2>
            <div className="mt-1 text-sm text-gray-500">
              {openedBy && <span className="font-medium">{openedBy}</span>}
              {openedBy && component && <span className="mx-2">•</span>}
              {component && <span className="font-medium">{component}</span>}
              <span className="ml-2">({tickets.length} ticket)</span>
            </div>
          </div>
          <Button variant="ghost" size="md" onClick={onClose}>
            <X size={24} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-8 text-center text-gray-500">Yükleniyor...</div>
          ) : tickets.length === 0 ? (
            <div className="py-8 text-center text-gray-500">Ticket bulunamadı</div>
          ) : (
            <div className="space-y-3">
              {tickets.map(ticket => (
                <div
                  key={ticket.id}
                  onClick={() => {
                    onTaskClick(ticket.id);
                    onClose();
                  }}
                  className="cursor-pointer rounded-lg border p-4 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="mb-2 font-medium text-gray-900">{ticket.title}</h3>
                      {ticket.description && (
                        <p className="mb-2 line-clamp-2 text-sm text-gray-600">
                          {ticket.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className={`rounded-full px-2 py-1 ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </span>
                        {ticket.severity && (
                          <span
                            className={`rounded-full px-2 py-1 ${getSeverityColor(ticket.severity)}`}
                          >
                            {ticket.severity}
                          </span>
                        )}
                        {ticket.project && (
                          <span className="rounded-full bg-indigo-50 px-2 py-1 text-indigo-600">
                            {ticket.project}
                          </span>
                        )}
                        {ticket.componentName && (
                          <span className="rounded-full bg-purple-50 px-2 py-1 text-purple-600">
                            {ticket.componentName}
                          </span>
                        )}
                        {ticket.bucketName && (
                          <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-600">
                            {ticket.bucketName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-xs whitespace-nowrap text-gray-500">
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
        </div>

        <div className="border-t bg-gray-50 p-4">
          <Button variant="secondary" size="md" onClick={onClose}>
            Kapat
          </Button>
        </div>
      </div>
    </div>
  );
}
