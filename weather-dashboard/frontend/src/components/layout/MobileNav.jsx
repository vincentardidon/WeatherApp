import { CalendarDays, Clock, Gauge, Sunrise, Thermometer } from "lucide-react";
import useActiveSection from "../../hooks/useActiveSection.js";

// Each id matches a section id on the dashboard.
const NAV_ITEMS = [
  { id: "overview", label: "Now", icon: Thermometer },
  { id: "details", label: "Details", icon: Gauge },
  { id: "hourly", label: "Hourly", icon: Clock },
  { id: "daily", label: "7-Day", icon: CalendarDays },
  { id: "sun", label: "Sun", icon: Sunrise },
];

const SECTION_IDS = NAV_ITEMS.map((item) => item.id);

// Bottom tab bar, shown on phones only (hidden from 768px up by CSS).
function MobileNav() {
  const activeId = useActiveSection(SECTION_IDS);

  return (
    <nav className="mobile-nav" aria-label="Dashboard sections">
      <ul>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeId === id;
          return (
            <li key={id}>
              <a>
                href={`#${id}`}
                className={`mobile-nav-link ${isActive ? "is-active" : ""}`}
                aria-current={isActive ? "location" : undefined}
              
                <Icon size={20} aria-hidden="true" />
                <span>{label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default MobileNav;