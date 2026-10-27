export default function Notice({ message, onClose }) {
  if (!message) return null;
  return (
    <p className="notice" role="alert" onClick={onClose}>
      {message}
      <small>Click to dismiss</small>
    </p>
  );
}
