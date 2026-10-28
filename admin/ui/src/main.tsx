import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { takeInviteToken } from './invite';
import './styles.css';
import { initTheme } from './theme';

initTheme();

// Token undangan dibaca dari fragmen URL lalu langsung dihapus dari bilah alamat; hanya disimpan di memori.
const inviteToken = takeInviteToken();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App inviteToken={inviteToken} />
  </StrictMode>,
);
