type Props = {
  dark?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

/**
 * Pedejá brand lockup.
 *
 * Brand rule:
 * - P mark is always white.
 * - Signature period is always Pedejá purple.
 * - The splash uses the wordmark only; the P mark belongs inside the app.
 */
export function Logo({ dark = false, size = 'md' }: Props) {
  const sizeClass = size === 'lg' ? 'logo-lg' : size === 'sm' ? 'logo-sm' : '';

  return (
    <div
      className={`pedeja-logo ${dark ? 'pedeja-logo-dark' : 'pedeja-logo-light'} ${sizeClass}`}
      aria-label="Pedejá"
    >
      <span className="pedeja-logo-mark-wrap" aria-hidden="true">
        <img src="/brand/pedeja-mark-white.svg" alt="" />
      </span>
      <span className="pedeja-logo-wordmark">
        Pedejá<span className="brand-dot">.</span>
      </span>
    </div>
  );
}
