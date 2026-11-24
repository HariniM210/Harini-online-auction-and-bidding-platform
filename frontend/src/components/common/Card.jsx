
const Card = ({ children, className = '', hoverable = false, ...props }) => {
  return (
    <div
      {...props}
      className={`bg-white rounded-xl border border-gray-200 shadow-sm transition-all duration-200
        ${hoverable ? 'hover:border-purple-500/50 hover:shadow-md' : ''}
        ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;