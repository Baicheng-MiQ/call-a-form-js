// components/ui/Input.jsx
export function Input({ value, onChange, placeholder, className = '', ...props }) {
    return (
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`border rounded-lg px-3 py-2 w-full ${className}`}
        {...props}
      />
    );
  }
  