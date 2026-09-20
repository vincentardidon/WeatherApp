// Reusable titled card used by every dashboard section.
function Card({ id, title, icon: Icon, className = "", children }) {
  const headingId = id ? `${id}-title` : undefined;

  return (
    <section id={id} className={`card ${className}`} aria-labelledby={headingId}>
      <header className="card-header">
        {Icon && <Icon size={18} aria-hidden="true" />}
        <h2 id={headingId}>{title}</h2>
      </header>
      {children}
    </section>
  );
}

export default Card;