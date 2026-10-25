import React, { useState } from 'react';
import { GLOSSARY_TERMS } from '../data/glossary';
import { BookOpen, X, Search, HelpCircle } from 'lucide-react';

export function GlossaryTooltip({ termKey, children }) {
  const [isOpen, setIsOpen] = useState(false);
  const entry = GLOSSARY_TERMS[termKey] || {
    term: termKey,
    plainDefinition: 'Industry term for UK electricity market operations.',
    example: 'Used by traders to manage wholesale exposure.'
  };

  return (
    <span 
      className="glossary-term-wrapper"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
      tabIndex={0}
      role="button"
      aria-label={`Definition for ${entry.term}`}
    >
      <span className="glossary-term-text">{children || entry.term}</span>
      {isOpen && (
        <span className="glossary-popover" role="tooltip">
          <span className="popover-title">{entry.term}</span>
          <span className="popover-def">{entry.plainDefinition}</span>
          <span className="popover-example">
            <strong>Example:</strong> {entry.example}
          </span>
        </span>
      )}
    </span>
  );
}

export function GlossaryDrawer({ isOpen, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredEntries = Object.entries(GLOSSARY_TERMS).filter(([key, item]) => {
    const q = searchTerm.toLowerCase();
    return (
      key.toLowerCase().includes(q) ||
      item.term.toLowerCase().includes(q) ||
      item.plainDefinition.toLowerCase().includes(q) ||
      item.example.toLowerCase().includes(q)
    );
  });

  return (
    <div className="glossary-drawer-overlay" onClick={onClose}>
      <aside 
        className="glossary-drawer" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Plain English Market Glossary"
      >
        <div className="drawer-header">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-cyan" />
            <h3 className="drawer-title">Plain English Market Glossary</h3>
          </div>
          <button 
            className="drawer-close-btn" 
            onClick={onClose}
            aria-label="Close Glossary"
          >
            <X size={18} />
          </button>
        </div>

        <p className="drawer-desc">
          Zero-jargon definitions of every UK electricity and forecasting concept used on this platform.
        </p>

        <div className="drawer-search-box">
          <Search size={15} className="text-muted shrink-0" />
          <input
            type="text"
            placeholder="Search terms (e.g. P90, cashout, buffer)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="drawer-search-input"
            autoFocus
          />
          {searchTerm && (
            <button 
              className="search-clear-btn"
              onClick={() => setSearchTerm('')}
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div className="drawer-list">
          {filteredEntries.length === 0 ? (
            <div className="drawer-empty">
              <HelpCircle size={28} className="text-muted" />
              <p>No glossary terms match "{searchTerm}"</p>
            </div>
          ) : (
            filteredEntries.map(([key, item]) => (
              <div key={key} className="drawer-item">
                <div className="drawer-item-title">{item.term}</div>
                <div className="drawer-item-def">{item.plainDefinition}</div>
                <div className="drawer-item-example">
                  <strong>Example:</strong> {item.example}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
