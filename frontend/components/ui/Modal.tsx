import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm duration-200"
      onClick={onClose}
    >
      <div
        className="animate-in zoom-in-95 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-6">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <Button
            variant="ghost"
            size="md"
            onClick={onClose}
            className="h-8 w-8 p-1"
            leftIcon={<X size={24} />}
          />
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};
