import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';

type Props = { onNext: () => void };

const prefersReduced =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function SplashView({ onNext }: Props) {
  const [taglineVisible, setTaglineVisible] = useState(false);

  useEffect(() => {
    if (prefersReduced) {
      setTaglineVisible(true);
      return;
    }

    const timer = setTimeout(() => setTaglineVisible(true), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="onboarding splash-screen">
      <div className="splash-center">
        <div className="splash-wordmark" aria-label="Pedejá">
          Pedejá<span className="brand-dot">.</span>
        </div>
        <p className={`splash-tagline ${taglineVisible ? 'visible' : ''}`}>
          A promessa que se move
        </p>
      </div>

      <button className="onboarding-next" onClick={onNext} aria-label="Próximo">
        <span>Próximo</span>
        <ArrowRight size={20} strokeWidth={2.5} aria-hidden="true" />
      </button>
    </main>
  );
}
