import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function InstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (value: Event) => {
      value.preventDefault();
      setEvent(value as BeforeInstallPromptEvent);
      if (localStorage.getItem('pedeja-install-dismissed') !== '1') {
        window.setTimeout(() => setVisible(true), 3500);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!visible || !event) return null;

  async function install() {
    await event.prompt();
    const choice = await event.userChoice;
    setVisible(false);
    setEvent(null);
    if (choice.outcome === 'dismissed') localStorage.setItem('pedeja-install-dismissed', '1');
  }

  function dismiss() {
    localStorage.setItem('pedeja-install-dismissed', '1');
    setVisible(false);
  }

  return (
    <aside className="install-prompt" aria-label="Instalar Pedejá">
      <div>
        <strong>Instala o Pedejá</strong>
        <p>Adiciona o Pedejá ao teu ecrã inicial para abrir como uma app.</p>
      </div>
      <div className="install-actions">
        <button type="button" onClick={dismiss}>Agora não</button>
        <button type="button" className="install-primary" onClick={install}>Instalar</button>
      </div>
    </aside>
  );
}
