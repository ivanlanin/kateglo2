import { Link } from 'react-router-dom';

function TombolSunting({
  to,
  entitas = 'glosarium',
  className = 'glosarium-edit-link-inline',
  ariaLabel,
  title,
  srLabel = 'Sunting',
  iconClassName = 'h-3.5 w-3.5',
}) {
  if (!to) return null;

  const ariaLabelFinal = ariaLabel || `Sunting entri ${entitas} di Redaksi`;
  const titleFinal = title || `Sunting entri ${entitas} di Redaksi`;

  return (
    <Link
      to={to}
      className={className}
      aria-label={ariaLabelFinal}
      title={titleFinal}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={iconClassName}>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
      </svg>
      <span className="sr-only">{srLabel}</span>
    </Link>
  );
}

export default TombolSunting;