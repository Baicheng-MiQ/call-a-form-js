// components/ui/Button.jsx
export function Button({ children, onClick, className = '', ...props }) {
    return (
      <button
        onClick={onClick}
        className={`px-4 py-2 rounded-lg text-white transition-colors ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
  