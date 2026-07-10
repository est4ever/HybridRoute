import { Link, useLocation } from 'react-router-dom';
import { Cpu, BarChart3, Boxes, FlaskConical } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Home', icon: Cpu },
  { path: '/demo', label: 'Routing Console', icon: FlaskConical },
  { path: '/metrics', label: 'Metrics', icon: BarChart3 },
  { path: '/architecture', label: 'Architecture', icon: Boxes },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-t-0 border-x-0 rounded-none">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="group"
            aria-label="Home"
          >
            <span className="font-heading text-lg sm:text-xl font-bold text-foreground">
              Hybrid<span className="text-local">Route</span>
            </span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
                    transition-all duration-200 ease-out cursor-pointer
                    ${isActive
                      ? 'bg-local/10 text-local border border-local/20'
                      : 'text-muted hover:text-foreground border border-transparent'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}