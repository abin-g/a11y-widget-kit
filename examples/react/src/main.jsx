import { useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { A11yProvider, A11yWidget, AccessibilityIcon, registerLocale, useA11y } from 'a11y-widget-kit/react';
import ta from 'a11y-widget-kit/locales/ta';
import ar from 'a11y-widget-kit/locales/ar';
import 'a11y-widget-kit/styles.css';

registerLocale(ta, ar);

function LanguagePicker() {
  const { locale, setLocale } = useA11y();
  return (
    <select value={locale} onChange={(e) => setLocale(e.target.value)} aria-label="Language">
      <option value="en">English</option>
      <option value="ta">தமிழ்</option>
      <option value="ar">العربية</option>
    </select>
  );
}

function Settings() {
  const { settings } = useA11y();
  return <pre>{JSON.stringify(settings, null, 2)}</pre>;
}

function App() {
  const widget = useRef(null);
  return (
    <A11yProvider options={{ locale: 'auto' }}>
      <main style={{ maxWidth: 640, margin: '3rem auto', fontFamily: 'system-ui', padding: '0 1rem' }}>
        <h1>React example</h1>
        <p>
          <LanguagePicker />{' '}
          <button type="button" onClick={() => widget.current?.open()}>
            <AccessibilityIcon /> Open preferences
          </button>
        </p>
        <p>
          Some text with <a href="#">a link</a>.
        </p>
        <Settings />
      </main>
      <A11yWidget ref={widget} position="bottom-left" theme="auto" />
    </A11yProvider>
  );
}

createRoot(document.getElementById('root')).render(<App />);
