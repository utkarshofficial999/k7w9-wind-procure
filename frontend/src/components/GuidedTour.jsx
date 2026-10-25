import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check, Sparkles } from 'lucide-react';

const TOUR_STEPS = [
  {
    targetId: 'tour-date-picker',
    title: '1. Select Delivery Day',
    content: 'Choose any delivery date in January 2026 using the calendar arrows to see that specific day’s hourly performance.'
  },
  {
    targetId: 'tour-scope-switch',
    title: '2. Day or Month Scope',
    content: 'Switch between evaluating just this single 24-hour delivery day or the entire month of January (744 hours).'
  },
  {
    targetId: 'tour-kpi-cards',
    title: '3. At-a-Glance Scorecard',
    content: 'See average over-estimates, typical miss size, and the critical P90 worst-case shortfall to prepare your trading desk.'
  },
  {
    targetId: 'tour-chart',
    title: '4. Forecast vs Reality Chart',
    content: 'Watch actual wind generation (green) vs day-ahead forecast (purple). The shaded gap highlights unhedged deficit risk.'
  },
  {
    targetId: 'tour-tabs',
    title: '5. Deep-Dive Trading Tools',
    content: 'Explore diurnal worst hours, forecast evolution closer to gate closure, and calculate safety buffer savings.'
  }
];

export default function GuidedTour({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const stepData = TOUR_STEPS[currentStep];
  const isLast = currentStep === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="tour-modal-backdrop" onClick={onClose}>
      <div 
        className="tour-modal-card" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Welcome Tour"
      >
        <div className="tour-header">
          <div className="tour-step-badge">
            <Sparkles size={14} className="text-amber" />
            <span>Quick Tour • Step {currentStep + 1} of {TOUR_STEPS.length}</span>
          </div>
          <button 
            className="tour-close-btn" 
            onClick={onClose}
            aria-label="Close tour"
          >
            <X size={16} />
          </button>
        </div>

        <h3 className="tour-step-title">{stepData.title}</h3>
        <p className="tour-step-desc">{stepData.content}</p>

        <div className="tour-dots-row">
          {TOUR_STEPS.map((_, idx) => (
            <span
              key={idx}
              className={`tour-dot ${idx === currentStep ? 'active' : ''}`}
              onClick={() => setCurrentStep(idx)}
            />
          ))}
        </div>

        <div className="tour-actions">
          <button className="tour-skip-btn" onClick={onClose}>
            Skip tour
          </button>
          <div className="tour-nav-btns">
            {currentStep > 0 && (
              <button className="tour-btn secondary" onClick={handlePrev}>
                <ChevronLeft size={15} /> Back
              </button>
            )}
            <button className="tour-btn primary" onClick={handleNext}>
              {isLast ? (
                <>Got it! <Check size={15} /></>
              ) : (
                <>Next <ChevronRight size={15} /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
