'use client';

import { useState, useEffect, useCallback } from 'react';
import TopBar from '@/components/layout/TopBar';
import { motion } from 'framer-motion';

interface CalendarEvent {
  id: number;
  title: string;
  starts_at: string;
  ends_at: string | null;
  source: string;
  details: string | null;
}

const eventColors: Record<string, string> = {
  meeting: 'bg-accent-blue',
  task: 'bg-accent-green',
  reminder: 'bg-accent-yellow',
  deadline: 'bg-accent-red',
  recurring: 'bg-accent-purple',
  local: 'bg-accent-cyan',
};

const alwaysRunning = [
  { name: 'System Monitor', emoji: '📊', status: 'active' },
  { name: 'Heartbeat Check', emoji: '💓', status: 'active' },
  { name: 'Memory Indexer', emoji: '🧠', status: 'active' },
];

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day;
    return new Date(now.setDate(diff));
  });

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/calendar');
      const data = await res.json();
      if (data.success) {
        setEvents(data.data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleSave = async (eventData: Partial<CalendarEvent>) => {
    try {
      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });

      const data = await res.json();
      if (data.success) {
        setEvents([...events, data.data]);
        setShowModal(false);
      }
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  // Generate week days
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + i);
    return date;
  });

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getEventsForDay = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.starts_at);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getUpcomingEvents = () => {
    const now = new Date();
    return events
      .filter((event) => new Date(event.starts_at) > now)
      .slice(0, 5);
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `in ${days}d`;
    if (hours > 0) return `in ${hours}h`;
    return 'soon';
  };

  const prevWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-dark-muted">Loading calendar...</div>
      </div>
    );
  }

  return (
    <>
      <TopBar title="Calendar" subtitle="Scheduled tasks and events" />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Main Calendar */}
        <div className="flex-1 p-4 overflow-y-auto">
          {/* Week Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Scheduled Tasks</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={prevWeek}
                className="px-3 py-1.5 bg-dark-card border border-dark-border rounded-lg text-dark-muted hover:text-white transition-colors"
              >
                ←
              </button>
              <span className="text-sm text-dark-muted px-3">
                {currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
                {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <button
                onClick={nextWeek}
                className="px-3 py-1.5 bg-dark-card border border-dark-border rounded-lg text-dark-muted hover:text-white transition-colors"
              >
                →
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="px-3 py-1.5 bg-accent-blue hover:bg-blue-600 text-white rounded-lg transition-colors ml-2"
              >
                + Add Event
              </button>
            </div>
          </div>

          {/* Week Grid */}
          <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-dark-border">
              {dayNames.map((day, i) => (
                <div
                  key={day}
                  className={`p-3 text-center border-r border-dark-border last:border-r-0 ${
                    isToday(weekDays[i]) ? 'bg-accent-blue/10' : ''
                  }`}
                >
                  <div className="text-xs text-dark-muted mb-1">{day}</div>
                  <div
                    className={`text-lg font-semibold ${
                      isToday(weekDays[i]) ? 'text-accent-blue' : 'text-white'
                    }`}
                  >
                    {weekDays[i].getDate()}
                  </div>
                </div>
              ))}
            </div>

            {/* Day Content */}
            <div className="grid grid-cols-7 min-h-[300px]">
              {weekDays.map((date, i) => {
                const dayEvents = getEventsForDay(date);
                return (
                  <div
                    key={i}
                    className={`p-2 border-r border-dark-border last:border-r-0 ${
                      isToday(date) ? 'bg-accent-blue/5' : ''
                    }`}
                  >
                    {dayEvents.map((event) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`${
                          eventColors[event.source] || eventColors.local
                        } rounded px-2 py-1 mb-1 text-xs text-white truncate cursor-pointer hover:opacity-80 transition-opacity`}
                        title={event.title}
                      >
                        {new Date(event.starts_at).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}{' '}
                        {event.title}
                      </motion.div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="w-80 border-l border-dark-border bg-dark-card flex flex-col">
          {/* Always Running */}
          <div className="p-4 border-b border-dark-border">
            <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
              Always Running
            </h3>
            <div className="space-y-2">
              {alwaysRunning.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-3 bg-dark-bg rounded-lg px-3 py-2"
                >
                  <span className="text-lg">{item.emoji}</span>
                  <span className="text-sm text-white">{item.name}</span>
                  <span className="ml-auto w-2 h-2 rounded-full bg-accent-green" />
                </div>
              ))}
            </div>
          </div>

          {/* Next Up */}
          <div className="flex-1 p-4 overflow-y-auto">
            <h3 className="text-sm font-medium text-white mb-3">Next Up</h3>
            <div className="space-y-2">
              {getUpcomingEvents().length > 0 ? (
                getUpcomingEvents().map((event) => (
                  <div
                    key={event.id}
                    className="bg-dark-bg rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white truncate">
                        {event.title}
                      </span>
                      <span className="text-xs text-accent-blue ml-2 shrink-0">
                        {formatRelativeTime(event.starts_at)}
                      </span>
                    </div>
                    <div className="text-xs text-dark-muted">
                      {new Date(event.starts_at).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-dark-muted text-sm py-4">
                  No upcoming events
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <EventModal onSave={handleSave} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}

interface EventModalProps {
  onSave: (data: Partial<CalendarEvent>) => void;
  onClose: () => void;
}

function EventModal({ onSave, onClose }: EventModalProps) {
  const [title, setTitle] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [source, setSource] = useState('local');
  const [details, setDetails] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      starts_at: new Date(startsAt).toISOString(),
      source,
      details: details || null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-white mb-4">New Event</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-dark-muted mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent-blue"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-dark-muted mb-1">Date & Time</label>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent-blue"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-dark-muted mb-1">Type</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent-blue"
            >
              <option value="local">Local</option>
              <option value="meeting">Meeting</option>
              <option value="task">Task</option>
              <option value="reminder">Reminder</option>
              <option value="deadline">Deadline</option>
              <option value="recurring">Recurring</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-dark-muted mb-1">Details</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent-blue h-24 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-muted hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-accent-blue hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
