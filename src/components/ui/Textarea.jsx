// components/ui/Textarea.jsx
export function Textarea({ value, onChange, placeholder, rows = 4, className = '', ...props }) {
    return (
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className={`border rounded-lg px-3 py-2 w-full ${className}`}
        {...props}
      />
    );
  }
  