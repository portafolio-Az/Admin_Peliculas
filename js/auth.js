/**
 * auth.js
 * Control de acceso con Firebase Authentication. Si Firebase no está activo
 * (modo local), esta clase no hace nada y el acceso a la app es inmediato,
 * exactamente como antes.
 *
 * Pensado para uso personal: un único usuario (tú) inicia sesión con el
 * correo y contraseña que crees en Firebase Console → Authentication → Users.
 * Ver README para los pasos exactos.
 *
 * Depende de storage.js (storageService.mode) y del SDK de Firebase Auth,
 * que deben cargarse antes que este archivo en index.html.
 */

class AuthController {
  constructor() {
    this.enabled =
      typeof storageService !== 'undefined' &&
      storageService.mode === 'firebase' &&
      typeof firebase !== 'undefined' &&
      typeof firebase.auth === 'function';
    this.overlay = null;
  }

  /** Resuelve la Promise en cuanto haya un usuario autenticado (o de inmediato si no aplica). */
  requireAuth() {
    return new Promise((resolve) => {
      if (!this.enabled) {
        resolve();
        return;
      }
      let resolved = false;
      firebase.auth().onAuthStateChanged((user) => {
        if (user) {
          this._hideLoginScreen();
          if (!resolved) {
            resolved = true;
            resolve();
          }
        } else {
          this._showLoginScreen();
        }
      });
    });
  }

  isLoggedIn() {
    return this.enabled ? Boolean(firebase.auth().currentUser) : false;
  }

  logout() {
    if (!this.enabled) return;
    firebase
      .auth()
      .signOut()
      .then(() => location.reload());
  }

  _showLoginScreen() {
    if (this.overlay) return; // ya está visible
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay is-open';
    this.overlay.id = 'authOverlay';
    this.overlay.innerHTML = `
      <div class="modal modal--auth" role="dialog" aria-modal="true" aria-labelledby="authTitle">
        <header class="modal__header">
          <h2 class="modal__title" id="authTitle">Iniciar sesión</h2>
        </header>
        <form class="modal__body" id="loginForm">
          <p class="auth-hint">Este panel es privado. Ingresa con la cuenta que configuraste en Firebase.</p>
          <div class="field">
            <label for="loginEmail">Correo</label>
            <input type="email" id="loginEmail" required autocomplete="username" />
          </div>
          <div class="field">
            <label for="loginPassword">Contraseña</label>
            <div class="password-field">
              <input type="password" id="loginPassword" required autocomplete="current-password" />
              <button type="button" class="password-field__btn" id="clearPasswordBtn" aria-label="Borrar contraseña" title="Borrar contraseña">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
              <button type="button" class="password-field__btn" id="togglePasswordBtn" aria-label="Mostrar contraseña" title="Mostrar contraseña">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
          </div>
          <p class="auth-error" id="authError" hidden></p>
        </form>
        <footer class="modal__footer">
          <button type="button" class="btn btn--ghost" id="closeAuthBtn">Cerrar</button>
          <button type="submit" form="loginForm" class="btn btn--primary" id="loginSubmitBtn">Entrar</button>
        </footer>
      </div>
    `;
    document.body.appendChild(this.overlay);
    document.body.classList.add('no-scroll');

    const form = this.overlay.querySelector('#loginForm');
    const errorEl = this.overlay.querySelector('#authError');
    const submitBtn = this.overlay.querySelector('#loginSubmitBtn');
    const emailInput = this.overlay.querySelector('#loginEmail');
    const passwordInput = this.overlay.querySelector('#loginPassword');
    const clearBtn = this.overlay.querySelector('#clearPasswordBtn');
    const toggleBtn = this.overlay.querySelector('#togglePasswordBtn');
    const closeBtn = this.overlay.querySelector('#closeAuthBtn');

    const eyeIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
    const eyeOffIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61C3.35 8.36 2 11.5 2 11.5s3.5 7 10 7a9.7 9.7 0 0 0 5.39-1.61M9.9 9.9a3 3 0 1 0 4.2 4.2"/><path d="M2 2l20 20"/></svg>';

    // Botón para mostrar/ocultar la contraseña en texto plano.
    toggleBtn.addEventListener('click', () => {
      const showing = passwordInput.type === 'text';
      passwordInput.type = showing ? 'password' : 'text';
      toggleBtn.innerHTML = showing ? eyeIcon : eyeOffIcon;
      toggleBtn.title = showing ? 'Mostrar contraseña' : 'Ocultar contraseña';
    });

    // Botón para borrar rápidamente lo escrito en el campo de contraseña.
    clearBtn.addEventListener('click', () => {
      passwordInput.value = '';
      passwordInput.focus();
    });

    // "Cerrar" limpia el formulario (correo y contraseña) sin enviarlo.
    closeBtn.addEventListener('click', () => {
      emailInput.value = '';
      passwordInput.value = '';
      errorEl.hidden = true;
      emailInput.focus();
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorEl.hidden = true;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Entrando…';
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      try {
        await firebase.auth().signInWithEmailAndPassword(email, password);
        // onAuthStateChanged (en requireAuth) se encarga de ocultar esta pantalla.
      } catch (err) {
        errorEl.textContent = this._friendlyError(err);
        errorEl.hidden = false;
        submitBtn.disabled = false;
        submitBtn.textContent = 'Entrar';
      }
    });
  }

  _hideLoginScreen() {
    if (!this.overlay) return;
    this.overlay.remove();
    this.overlay = null;
    document.body.classList.remove('no-scroll');
  }

  _friendlyError(err) {
    const messages = {
      'auth/invalid-email': 'El correo no es válido.',
      'auth/user-not-found': 'No existe una cuenta con ese correo.',
      'auth/wrong-password': 'Contraseña incorrecta.',
      'auth/invalid-credential': 'Correo o contraseña incorrectos.',
      'auth/too-many-requests': 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
    };
    return messages[err.code] || 'No se pudo iniciar sesión. Intenta de nuevo.';
  }
}

const authController = new AuthController();
