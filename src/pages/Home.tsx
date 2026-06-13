import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../components/Header';
import WelcomeSection from '../components/WelcomeSection';
import StatisticsSection from '../components/StatisticsSection';
import PastPapersSection from '../components/PastPapersSection';
import FinalSection from '../components/FinalSection';
import Supports from '../components/Supports';

const Home: React.FC = () => {
  const location = useLocation();

  React.useEffect(() => {
    if (!location.hash) {
      return;
    }

    const targetId = location.hash.slice(1);

    const scrollToTarget = () => {
      const element = document.getElementById(targetId);

      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    window.requestAnimationFrame(scrollToTarget);
    window.setTimeout(scrollToTarget, 120);
  }, [location.hash]);

  return (
    <div className="bg-[#18181B]">
      <Header />
      <WelcomeSection />
      <PastPapersSection />
      <StatisticsSection />
      <FinalSection />
      <Supports />
    </div>
  );
};

export default Home;
