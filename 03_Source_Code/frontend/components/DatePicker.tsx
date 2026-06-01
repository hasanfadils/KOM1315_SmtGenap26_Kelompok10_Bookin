import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  minDate?: string;
  label?: string;
  required?: boolean;
}

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, minDate, label, required }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // State for the calendar view (which month/year is currently shown)
  const [viewDate, setViewDate] = useState(new Date());
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize view based on value or current date
  useEffect(() => {
    if (value) {
      setViewDate(new Date(value));
    }
  }, []); // Run once on mount

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const selectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    // Adjust for timezone offset to ensure YYYY-MM-DD matches local time
    const offset = selectedDate.getTimezoneOffset();
    const localDate = new Date(selectedDate.getTime() - (offset * 60 * 1000));
    const dateString = localDate.toISOString().split('T')[0];
    
    onChange(dateString);
    setIsOpen(false);
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    // Empty slots for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
    }

    const today = new Date();
    today.setHours(0,0,0,0);
    
    const minDateObj = minDate ? new Date(minDate) : null;
    if (minDateObj) minDateObj.setHours(0,0,0,0);

    const selectedDateObj = value ? new Date(value) : null;
    if (selectedDateObj) selectedDateObj.setHours(0,0,0,0);

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDayDate = new Date(year, month, day);
      const isToday = currentDayDate.getTime() === today.getTime();
      const isSelected = selectedDateObj && currentDayDate.getTime() === selectedDateObj.getTime();
      
      let isDisabled = false;
      if (minDateObj && currentDayDate < minDateObj) {
        isDisabled = true;
      }

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => !isDisabled && handleDateClick(day)}
          disabled={isDisabled}
          className={`
            h-9 w-9 rounded-full flex items-center justify-center text-sm font-medium transition-all
            ${isSelected 
              ? 'bg-ipb-blue text-white shadow-md' 
              : isToday 
                ? 'text-ipb-blue font-bold border border-ipb-blue bg-blue-50' 
                : 'text-slate-700 hover:bg-slate-100'}
            ${isDisabled ? 'text-slate-300 cursor-not-allowed hover:bg-transparent' : 'cursor-pointer'}
          `}
        >
          {day}
        </button>
      );
    }
    return days;
  };

  return (
    <div className="relative" ref={containerRef}>
      {label && <label className="block text-sm font-bold text-slate-800 mb-2">{label}</label>}
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full pl-12 pr-4 py-3 rounded-xl border bg-white cursor-pointer flex items-center shadow-sm transition-all
          ${isOpen ? 'ring-4 ring-ipb-blue/10 border-ipb-blue' : 'border-slate-300 hover:border-slate-400'}
        `}
      >
        <CalendarIcon className="absolute left-4 h-5 w-5 text-slate-400" />
        <span className={`text-sm font-semibold ${value ? 'text-slate-900' : 'text-slate-400'}`}>
          {value ? formatDateDisplay(value) : 'Pilih Tanggal'}
        </span>
      </div>

      {/* Hidden input to ensure HTML5 validation still works if needed */}
      <input 
        type="text" 
        className="opacity-0 absolute h-0 w-0" 
        value={value} 
        required={required} 
        onChange={() => {}} 
        tabIndex={-1}
      />

      {isOpen && (
        <div className="absolute z-[60] mt-2 p-4 bg-white rounded-2xl shadow-2xl border border-slate-200 w-[320px] animate-fade-in-up origin-top">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 px-2">
            <button 
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
            >
                <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-slate-800 font-bold text-base">
                {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>
            <button 
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
            >
                <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Weekday Names */}
          <div className="grid grid-cols-7 mb-2">
            {DAY_NAMES.map(day => (
              <div key={day} className="text-center text-xs font-bold text-slate-400 uppercase tracking-wide">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-y-1 justify-items-center">
            {renderCalendarDays()}
          </div>
        </div>
      )}
    </div>
  );
};