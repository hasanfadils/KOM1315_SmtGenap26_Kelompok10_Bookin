import React, { useState, useEffect, useRef } from 'react';
import { Clock, ChevronDown } from 'lucide-react';

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

export const TimePicker: React.FC<TimePickerProps> = ({ value, onChange, label, required, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate hours (00-23)
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  
  // Generate minutes (00, 15, 30, 45) - Standard for facility booking
  const minutes = ['00', '15', '30', '45'];

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

  const handleTimeSelect = (type: 'hour' | 'minute', val: string) => {
    if (!value) {
        // If no value yet, set default to 08:00
        const defaultHour = type === 'hour' ? val : '08';
        const defaultMinute = type === 'minute' ? val : '00';
        onChange(`${defaultHour}:${defaultMinute}`);
    } else {
        const [currentHour, currentMinute] = value.split(':');
        if (type === 'hour') {
            onChange(`${val}:${currentMinute || '00'}`);
        } else {
            onChange(`${currentHour || '00'}:${val}`);
        }
    }
  };

  const [displayHour, displayMinute] = value ? value.split(':') : ['--', '--'];

  return (
    <div className="relative" ref={containerRef}>
      {label && <label className="block text-sm font-bold text-slate-800 mb-2">{label}</label>}
      
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          w-full pl-12 pr-4 py-3 rounded-xl border bg-white flex items-center shadow-sm transition-all justify-between
          ${disabled ? 'bg-slate-100 cursor-not-allowed text-slate-400 border-slate-200' : 'cursor-pointer hover:border-slate-400'}
          ${isOpen ? 'ring-4 ring-ipb-blue/10 border-ipb-blue' : 'border-slate-300'}
        `}
      >
        <div className="flex items-center">
            <Clock className={`absolute left-4 h-5 w-5 ${value ? 'text-ipb-blue' : 'text-slate-400'}`} />
            <span className={`text-sm font-semibold ${value ? 'text-slate-900' : 'text-slate-400'}`}>
            {value ? `${displayHour} : ${displayMinute} WIB` : 'Pilih Jam'}
            </span>
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Hidden Input for HTML5 validation */}
      <input 
        type="text" 
        className="opacity-0 absolute h-0 w-0" 
        value={value} 
        required={required} 
        onChange={() => {}} 
        tabIndex={-1}
      />

      {isOpen && (
        <div className="absolute z-[60] mt-2 p-3 bg-white rounded-xl shadow-2xl border border-slate-200 w-full min-w-[200px] animate-fade-in-up origin-top">
            <div className="flex gap-2 h-48">
                {/* Hours Column */}
                <div className="flex-1 overflow-y-auto no-scrollbar border-r border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 text-center mb-2 sticky top-0 bg-white py-1">JAM</div>
                    <div className="space-y-1 px-1">
                        {hours.map(h => (
                            <button
                                key={h}
                                type="button"
                                onClick={() => handleTimeSelect('hour', h)}
                                className={`w-full text-center py-1.5 rounded-lg text-sm font-bold transition-colors ${
                                    displayHour === h 
                                    ? 'bg-ipb-blue text-white shadow-sm' 
                                    : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                {h}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Minutes Column */}
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    <div className="text-[10px] font-bold text-slate-400 text-center mb-2 sticky top-0 bg-white py-1">MENIT</div>
                    <div className="space-y-1 px-1">
                        {minutes.map(m => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => handleTimeSelect('minute', m)}
                                className={`w-full text-center py-1.5 rounded-lg text-sm font-bold transition-colors ${
                                    displayMinute === m 
                                    ? 'bg-ipb-blue text-white shadow-sm' 
                                    : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 text-center">
                 <button 
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="text-xs font-bold text-ipb-blue hover:underline"
                 >
                    Selesai
                 </button>
            </div>
        </div>
      )}
    </div>
  );
};