// src/components/common/Modal.tsx
'use client'

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { styles } from '@/styles/guide';
import { useModal } from '@/hooks/useModal';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, ...props }) => {
  useModal(isOpen);
  
  // Handle ESC key press
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        props.onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, props.onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.patterns.modalOverlay} />
      <div className={styles.patterns.modalContainer}>
        <div className={styles.patterns.modalContent}>
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-xl font-semibold text-black">{props.title}</h2>
            <button
              onClick={props.onClose}
              className={styles.button.iconButton}
            >
              <X size={24} />
            </button>
          </div>
          <div className="p-6 text-black">
            {props.children}
          </div>
        </div>
      </div>
    </>
  );
};

export default Modal;