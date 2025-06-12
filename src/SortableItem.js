import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function SortableItem({ id, children, disabled = false }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || undefined,
    opacity: isDragging ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : 'grab',
    touchAction: 'none', // Prevent scrolling on touch devices
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      {...attributes}
    >
      {React.cloneElement(React.Children.only(children), {
        dragHandleProps: !disabled ? {
          ...listeners,
          style: { cursor: 'grab', display: 'inline-flex' }
        } : {},
        isDragging,
      })}
    </div>
  );
}
