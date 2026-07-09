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
            <input type="password" id="loginPassword" required autocomplete="current-password" />
          </div>
          <p class="auth-error" id="authError" hidden></p>
        </form>
        <footer class="modal__footer">
          <button type="submit" form="loginForm" class="btn btn--primary" id="loginSubmitBtn">Entrar</button>
        </footer>
      </div>
    `;
    document.body.appendChild(this.overlay);
    document.body.classList.add('no-scroll');

    const form = this.overlay.querySelector('#loginForm');
    const errorEl = this.overlay.querySelector('#authError');
    const submitBtn = this.overlay.querySelector('#loginSubmitBtn');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorEl.hidden = true;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Entrando…';
      const email = this.overlay.querySelector('#loginEmail').value.trim();
      const password = this.overlay.querySelector('#loginPassword').value;
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
