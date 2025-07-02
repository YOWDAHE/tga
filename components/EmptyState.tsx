interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No data found",
  description = "There are no items to display at the moment.",
  icon,
  action,
  className = "",
}) => {
  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 72px)',
        padding: '48px 16px',
        ...(className && { className })
      }}
    >
      {icon && (
        <div style={{ marginBottom: '2px', color: '#9CA3AF' }}>
          {icon}
        </div>
      )}
      <h3 style={{ 
        fontSize: '18px', 
        fontWeight: '500', 
        color: '#111827', 
        marginBottom: '8px' 
      }}>
        {title}
      </h3>
      <p style={{ 
        fontSize: '14px', 
        color: '#6B7280', 
        textAlign: 'center', 
        maxWidth: '384px', 
        marginBottom: '24px' 
      }}>
        {description}
      </p>
      {action && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
