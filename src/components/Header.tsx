import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  { id: 'welcome', label: 'Welcome', type: 'section' as const },
  { id: 'past-papers', label: 'Past Papers', type: 'route' as const, path: '/pastpapers' },
  { id: 'statistics', label: 'Statistics', type: 'route' as const, path: '/statistics' },
  { id: 'supports', label: 'Supports', type: 'section' as const }
];

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('welcome');

  useEffect(() => {
    if (location.pathname === '/pastpapers') {
      setActiveSection('past-papers');
      return;
    }

    if (location.pathname === '/statistics') {
      setActiveSection('statistics');
      return;
    }

    if (location.pathname !== '/') {
      setActiveSection('welcome');
      return;
    }

    const handleScroll = () => {
      const viewportHeight = window.innerHeight;
      const doc = document.documentElement;
      const distanceToBottom = doc.scrollHeight - (window.scrollY + viewportHeight);
      const nearPageBottom = distanceToBottom <= viewportHeight * 0.5;
      const supportsElement = document.getElementById('supports');

      if (supportsElement) {
        const supportsRect = supportsElement.getBoundingClientRect();
        const supportsVisibleHeight = Math.max(
          0,
          Math.min(supportsRect.bottom, viewportHeight) - Math.max(supportsRect.top, 0)
        );
        const supportsVisibleRatio = supportsVisibleHeight / Math.max(1, supportsRect.height);
        const supportsHalfVisible = supportsVisibleRatio >= 0.5;

        if (supportsHalfVisible) {
          setActiveSection('supports');
          return;
        }
      }

      if (nearPageBottom) {
        setActiveSection('supports');
        return;
      }

      let bestSection = navItems[0].id;
      let bestRatio = 0;

      for (const item of navItems) {
        const element = document.getElementById(item.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          const visibleHeight = Math.max(
            0,
            Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0)
          );
          const sectionHeight = Math.max(1, Math.min(rect.height, viewportHeight));
          const visibleRatio = visibleHeight / sectionHeight;

          if (visibleRatio > bestRatio) {
            bestRatio = visibleRatio;
            bestSection = item.id;
          }
        }
      }

      if (bestRatio > 0) {
        setActiveSection(bestSection);
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  const handleNavClick = (item: (typeof navItems)[number]) => {
    if (item.type === 'route' && item.path) {
      navigate(item.path);
      setIsMenuOpen(false);
      return;
    }

    if (location.pathname !== '/') {
      navigate({
        pathname: '/',
        hash: item.id === 'supports' ? '#supports' : '#welcome',
      });
      setIsMenuOpen(false);
      return;
    }

    const element = document.getElementById(item.id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(item.id);
    }

    setIsMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-900/80 backdrop-blur-sm border-b border-zinc-800">
      <nav className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          
          <div className="flex items-center text-lg sm:text-2xl font-bold tracking-[0.05em] sm:tracking-[0.2em] text-white">
            <img src="/assets/Logo 2.png" alt="STEPsFurther Logo" className="h-10 w-auto mr-0 header-logo" />
            <span>STEPsFurther</span>
          </div>
          

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className={`text-sm tracking-[0.15em] uppercase transition-colors duration-300 hover:text-white ${
                  activeSection === item.id ? 'text-white' : 'text-zinc-400'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white p-2"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-zinc-800">
            <div className="flex flex-col space-y-4 pt-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className={`text-left text-sm tracking-[0.15em] uppercase transition-colors duration-300 hover:text-white ${
                    activeSection === item.id ? 'text-white' : 'text-zinc-400'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
