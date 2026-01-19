'use client';

import { useState } from 'react';
import type { BookingConfig, BookingFormData } from '../types';

// Default time slots
const DEFAULT_TIME_SLOTS = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM'
];

// Calendar helper functions
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

// Icons
function CalendarIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

interface AppointmentBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  config?: BookingConfig;
}

export function AppointmentBookingModal({ isOpen, onClose, config }: AppointmentBookingModalProps) {
  const [step, setStep] = useState<'calendar' | 'time' | 'form' | 'success'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [formData, setFormData] = useState<BookingFormData>({ name: '', phone: '', email: '', notes: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timeSlots = config?.timeSlots || DEFAULT_TIME_SLOTS;
  const title = config?.title || 'Book an Appointment';
  const subtitle = config?.subtitle || 'Select a date for your appointment';
  const hintText = config?.hintText || 'Available Monday - Saturday, 9 AM - 5 PM';
  const monthsAhead = config?.monthsAhead || 2;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const handlePrevMonth = () => {
    const newMonth = new Date(year, month - 1, 1);
    if (newMonth >= new Date(today.getFullYear(), today.getMonth(), 1)) {
      setCurrentMonth(newMonth);
    }
  };

  const handleNextMonth = () => {
    const maxMonth = new Date(today.getFullYear(), today.getMonth() + monthsAhead, 1);
    const newMonth = new Date(year, month + 1, 1);
    if (newMonth < maxMonth) {
      setCurrentMonth(newMonth);
    }
  };

  const handleDateSelect = (day: number) => {
    const date = new Date(year, month, day);
    if (date >= today) {
      setSelectedDate(date);
      setStep('time');
      config?.onDateSelected?.(date);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep('form');
    config?.onTimeSelected?.(time);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !selectedDate || !selectedTime) return;

    setIsSubmitting(true);

    try {
      if (config?.onBookingSubmit) {
        await config.onBookingSubmit({
          date: selectedDate,
          time: selectedTime,
          formData,
        });
      } else {
        // Simulate API call if no handler provided
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      config?.onBookingSubmitted?.({
        date: selectedDate,
        time: selectedTime,
        hasEmail: !!formData.email,
        hasNotes: !!formData.notes,
      });

      setStep('success');
    } catch {
      // Handle error - could add error state here
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset state after animation
    setTimeout(() => {
      setStep('calendar');
      setSelectedDate(null);
      setSelectedTime(null);
      setFormData({ name: '', phone: '', email: '', notes: '' });
    }, 300);
  };

  const handleBack = () => {
    if (step === 'time') setStep('calendar');
    else if (step === 'form') setStep('time');
  };

  const canGoPrev = new Date(year, month, 1) > new Date(today.getFullYear(), today.getMonth(), 1);
  const canGoNext = new Date(year, month + 1, 1) < new Date(today.getFullYear(), today.getMonth() + monthsAhead, 1);

  if (!isOpen) return null;

  return (
    <div className="pcm-booking-overlay" onClick={handleClose}>
      <div className="pcm-booking-modal" onClick={(e) => e.stopPropagation()}>
        <button className="pcm-booking-close" onClick={handleClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {step !== 'success' && step !== 'calendar' && (
          <button className="pcm-booking-back" onClick={handleBack}>
            <ChevronLeftIcon /> Back
          </button>
        )}

        {step === 'calendar' && (
          <>
            <div className="pcm-booking-header">
              <div className="pcm-booking-icon">
                <CalendarIcon size={32} />
              </div>
              <h3 className="pcm-booking-title">{title}</h3>
              <p className="pcm-booking-subtitle">{subtitle}</p>
            </div>

            <div className="pcm-calendar">
              <div className="pcm-calendar-header">
                <button
                  className="pcm-calendar-nav"
                  onClick={handlePrevMonth}
                  disabled={!canGoPrev}
                >
                  <ChevronLeftIcon />
                </button>
                <span className="pcm-calendar-month">{monthName}</span>
                <button
                  className="pcm-calendar-nav"
                  onClick={handleNextMonth}
                  disabled={!canGoNext}
                >
                  <ChevronRightIcon />
                </button>
              </div>

              <div className="pcm-calendar-weekdays">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <span key={day} className="pcm-calendar-weekday">{day}</span>
                ))}
              </div>

              <div className="pcm-calendar-days">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <span key={`empty-${i}`} className="pcm-calendar-day pcm-calendar-day--empty" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const date = new Date(year, month, day);
                  const isPast = date < today;
                  const isToday = date.getTime() === today.getTime();
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  const isSelected = selectedDate && date.getTime() === selectedDate.getTime();

                  return (
                    <button
                      key={day}
                      className={`pcm-calendar-day ${isPast ? 'pcm-calendar-day--past' : ''} ${isToday ? 'pcm-calendar-day--today' : ''} ${isWeekend && !isPast ? 'pcm-calendar-day--weekend' : ''} ${isSelected ? 'pcm-calendar-day--selected' : ''}`}
                      onClick={() => handleDateSelect(day)}
                      disabled={isPast}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="pcm-booking-hint">
              <ClockIcon /> {hintText}
            </p>
          </>
        )}

        {step === 'time' && selectedDate && (
          <>
            <div className="pcm-booking-header">
              <div className="pcm-booking-icon pcm-booking-icon--small">
                <ClockIcon />
              </div>
              <h3 className="pcm-booking-title">Select a Time</h3>
              <p className="pcm-booking-subtitle">{formatDate(selectedDate)}</p>
            </div>

            <div className="pcm-time-slots">
              {timeSlots.map(time => (
                <button
                  key={time}
                  className={`pcm-time-slot ${selectedTime === time ? 'pcm-time-slot--selected' : ''}`}
                  onClick={() => handleTimeSelect(time)}
                >
                  {time}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 'form' && selectedDate && selectedTime && (
          <>
            <div className="pcm-booking-header">
              <h3 className="pcm-booking-title">Your Details</h3>
              <p className="pcm-booking-subtitle">
                {formatDate(selectedDate)} at {selectedTime}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="pcm-booking-form">
              <div className="pcm-form-group">
                <label className="pcm-form-label">Name *</label>
                <input
                  type="text"
                  className="pcm-form-input"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="pcm-form-group">
                <label className="pcm-form-label">Phone *</label>
                <input
                  type="tel"
                  className="pcm-form-input"
                  placeholder="Your phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="pcm-form-group">
                <label className="pcm-form-label">Email (optional)</label>
                <input
                  type="email"
                  className="pcm-form-input"
                  placeholder="Your email address"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={isSubmitting}
                />
              </div>

              <div className="pcm-form-group">
                <label className="pcm-form-label">Notes (optional)</label>
                <textarea
                  className="pcm-form-input pcm-form-textarea"
                  placeholder="Any specific concerns or notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  disabled={isSubmitting}
                  rows={3}
                />
              </div>

              <button
                type="submit"
                className="pcm-booking-submit"
                disabled={!formData.name.trim() || !formData.phone.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <span className="pcm-booking-spinner" />
                ) : (
                  'Confirm Booking'
                )}
              </button>
            </form>
          </>
        )}

        {step === 'success' && (
          <div className="pcm-booking-success">
            <div className="pcm-booking-success-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h3 className="pcm-booking-title">Booking Confirmed!</h3>
            <p className="pcm-booking-subtitle">
              Your appointment has been scheduled for<br />
              <strong>{selectedDate && formatDate(selectedDate)}</strong><br />
              at <strong>{selectedTime}</strong>
            </p>
            <p className="pcm-booking-confirm-text">
              We&apos;ll send you a confirmation SMS to {formData.phone}
            </p>
            <button className="pcm-booking-done" onClick={handleClose}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Export the calendar icon for use in ChatModal header
export function CalendarHeaderIcon({ size = 20 }: { size?: number }) {
  return <CalendarIcon size={size} />;
}
