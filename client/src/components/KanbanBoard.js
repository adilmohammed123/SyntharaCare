import React, { useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQueryClient } from 'react-query';
import { appointmentsAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Trash2,
  Filter,
  Search,
  Plus,
  Eye,
  GripVertical
} from 'lucide-react';

// Sortable Appointment Card Component
function SortableAppointmentCard({ appointment, status, onStatusChange, onViewDetails }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: appointment._id,
    data: {
      type: 'appointment',
      appointment: appointment,
      status: status,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'in-progress': return <AlertCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (type) => {
    switch (type) {
      case 'emergency': return 'bg-red-500';
      case 'follow-up': return 'bg-orange-500';
      case 'routine': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg border-2 p-4 mb-3 shadow-sm hover:shadow-md transition-all cursor-pointer ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      }`}
      onClick={() => onViewDetails(appointment)}
      data-status={status}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-between mb-2"
      >
        <div className="flex items-center space-x-2">
          <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
          <span className="text-xs font-medium text-gray-500">
            #{appointment.queuePosition || 'N/A'}
          </span>
        </div>
        <div className={`w-3 h-3 rounded-full ${getPriorityColor(appointment.type)}`} />
      </div>

      {/* Patient/Doctor Info */}
      <div className="flex items-center space-x-2 mb-3">
        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
          <User className="h-4 w-4 text-primary-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">
            {appointment.patientId?.profile?.firstName} {appointment.patientId?.profile?.lastName}
          </div>
          <div className="text-xs text-gray-500 truncate">
            {appointment.patientId?.email}
          </div>
        </div>
      </div>

      {/* Appointment Details */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center space-x-2 text-xs text-gray-600">
          <Calendar className="h-3 w-3" />
          <span>{new Date(appointment.date).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-gray-600">
          <Clock className="h-3 w-3" />
          <span>{appointment.time}</span>
        </div>
      </div>

      {/* Type Badge */}
      <div className="mb-3">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {appointment.type}
        </span>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
          {getStatusIcon(appointment.status)}
          <span className="ml-1">{appointment.status}</span>
        </span>
        
        {/* Quick Actions */}
        <div className="flex space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(appointment);
            }}
            className="p-1 text-gray-400 hover:text-gray-600"
            title="View Details"
          >
            <Eye className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Kanban Column Component
function KanbanColumn({ title, status, appointments, onStatusChange, onViewDetails, color }) {
  const {
    setNodeRef,
    isOver,
  } = useSortable({
    id: status,
    data: {
      type: 'column',
      droppableId: status,
    },
  });

  return (
    <div 
      ref={setNodeRef}
      className={`bg-gray-50 rounded-lg p-4 min-h-[600px] transition-all duration-200 ${
        isOver ? 'bg-blue-50 border-2 border-blue-200 shadow-lg scale-105' : ''
      }`}
      data-status={status}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-semibold text-sm ${color}`}>
          {title}
        </h3>
        <span className="bg-white text-gray-600 text-xs font-medium px-2 py-1 rounded-full">
          {appointments.length}
        </span>
      </div>
      
      <div className="space-y-3 min-h-[400px]">
        {appointments.map((appointment) => (
          <SortableAppointmentCard
            key={appointment._id}
            appointment={appointment}
            status={status}
            onStatusChange={onStatusChange}
            onViewDetails={onViewDetails}
          />
        ))}
        {appointments.length === 0 && (
          <div className="flex items-center justify-center h-32 text-gray-400 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-sm">Drop appointments here</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Main Kanban Board Component
function KanbanBoard({ appointments, onViewDetails, onStatusChange }) {
  const [activeId, setActiveId] = useState(null);
  const [activeAppointment, setActiveAppointment] = useState(null);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group appointments by status
  const columns = useMemo(() => {
    const statusGroups = {
      scheduled: { title: 'Scheduled', color: 'text-blue-600', appointments: [] },
      confirmed: { title: 'Confirmed', color: 'text-green-600', appointments: [] },
      'in-progress': { title: 'In Progress', color: 'text-yellow-600', appointments: [] },
      completed: { title: 'Completed', color: 'text-gray-600', appointments: [] },
      cancelled: { title: 'Cancelled', color: 'text-red-600', appointments: [] },
    };

    appointments.forEach(appointment => {
      if (statusGroups[appointment.status]) {
        statusGroups[appointment.status].appointments.push(appointment);
      }
    });

    return statusGroups;
  }, [appointments]);

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
    const appointment = appointments.find(app => app._id === active.id);
    setActiveAppointment(appointment);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveAppointment(null);

    if (active.id !== over?.id && over) {
      // Get the status from the droppable area
      const newStatus = over.data?.current?.droppableId;
      const currentAppointment = appointments.find(app => app._id === active.id);
      
      if (currentAppointment && newStatus && newStatus !== currentAppointment.status) {
        console.log(`Moving appointment ${active.id} from ${currentAppointment.status} to ${newStatus}`);
        onStatusChange(active.id, newStatus);
      }
    }
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    
    if (active.id !== over?.id && over) {
      const newStatus = over.data?.current?.droppableId;
      const currentAppointment = appointments.find(app => app._id === active.id);
      
      if (currentAppointment && newStatus && newStatus !== currentAppointment.status) {
        // Visual feedback for valid drop
        console.log(`Hovering over ${newStatus} column`);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {Object.entries(columns).map(([status, column]) => (
          <SortableContext
            key={status}
            items={column.appointments.map(app => app._id)}
            strategy={verticalListSortingStrategy}
          >
            <KanbanColumn
              title={column.title}
              status={status}
              appointments={column.appointments}
              onStatusChange={onStatusChange}
              onViewDetails={onViewDetails}
              color={column.color}
            />
          </SortableContext>
        ))}
      </div>
      
      <DragOverlay>
        {activeAppointment ? (
          <div className="bg-white rounded-lg border-2 p-4 shadow-lg opacity-80">
            <div className="flex items-center space-x-2 mb-2">
              <GripVertical className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">
                #{activeAppointment.queuePosition || 'N/A'}
              </span>
            </div>
            <div className="flex items-center space-x-2 mb-3">
              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                <User className="h-4 w-4 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {activeAppointment.patientId?.profile?.firstName} {activeAppointment.patientId?.profile?.lastName}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {activeAppointment.patientId?.email}
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-600">
              {new Date(activeAppointment.date).toLocaleDateString()} at {activeAppointment.time}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default KanbanBoard;
