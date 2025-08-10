import React, { useState, useRef, useEffect } from 'react'

const DropdownMenu = ({ trigger, children, align = 'right' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const toggleDropdown = (e) => {
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  const closeDropdown = () => {
    setIsOpen(false)
  }

  const alignmentClasses = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 transform -translate-x-1/2'
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger */}
      <div onClick={toggleDropdown}>
        {trigger}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`absolute z-50 mt-1 w-fit min-w-[100px] origin-top-right shadow-lg ${alignmentClasses[align]}`} style={{border: '1px solid var(--color-border-primary)', background: 'var(--color-background-primary)'}}>
          <div className="py-0">
            {React.Children.map(children, (child) => 
              React.cloneElement(child, { closeDropdown })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Dropdown Item Component
export const DropdownItem = ({ children, onClick, closeDropdown, disabled = false, className = "" }) => {
  const handleClick = (e) => {
    e.stopPropagation()
    if (!disabled && onClick) {
      onClick(e)
      closeDropdown()
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`block w-full text-left px-2.5 py-1 text-caption-1 transition-colors ${
        disabled 
          ? 'text-tertiary cursor-not-allowed' 
          : 'text-primary hover:bg-background-secondary cursor-pointer'
      } ${className}`}
    >
      {children}
    </button>
  )
}

export default DropdownMenu 