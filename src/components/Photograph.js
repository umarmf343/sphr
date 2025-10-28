export default class Photograph {
  constructor(file) {
    this.visible = false;
    this.container = this._ensureContainer();
    this.imageElement = this.container ? this.container.querySelector('img') : null;
    this.captionElement = this.container ? this.container.querySelector('p') : null;

    this.setFile(file);

    // Ensure the element is shown after the next paint so CSS transitions work
    if (this.container) {
      requestAnimationFrame(() => {
        this.show();
      });
    }
  }

  setFile(file) {
    this.file = file;

    const src = this._getFileSource(file);
    const alt = (file && (file.alt || file.title || file.caption)) || 'Tour media';

    if (!src) {
      this.slideOut();
      return;
    }

    if (this.imageElement) {
      this.imageElement.src = src;
      this.imageElement.alt = alt;
    }

    if (this.captionElement) {
      this.captionElement.textContent = file && file.caption ? file.caption : '';
      const hasCaption = Boolean(file && file.caption);
      this.captionElement.classList.toggle('tour-photograph__caption--hidden', !hasCaption);
    }

    this.show();
  }

  slideOut() {
    if (!this.container) {
      return;
    }

    this.container.classList.add('tour-photograph--hidden');
    this.visible = false;
  }

  show() {
    if (!this.container) {
      return;
    }

    this.container.classList.remove('tour-photograph--hidden');
    this.visible = true;
  }

  update() {
    // Currently there is no per-frame behaviour required for photographs,
    // but keep the method to match the public API expected by the app.
  }

  _ensureContainer() {
    if (typeof document === 'undefined') {
      return null;
    }

    let container = document.getElementById('tour-photograph-container');

    if (!container) {
      container = document.createElement('div');
      container.id = 'tour-photograph-container';
      container.className = 'tour-photograph tour-photograph--hidden';

      const image = document.createElement('img');
      image.className = 'tour-photograph__image';

      const caption = document.createElement('p');
      caption.className = 'tour-photograph__caption tour-photograph__caption--hidden';

      container.appendChild(image);
      container.appendChild(caption);

      const root = document.getElementById('app') || document.body;
      root.appendChild(container);
    }

    if (!container.querySelector('img')) {
      const image = document.createElement('img');
      image.className = 'tour-photograph__image';
      container.appendChild(image);
    }

    if (!container.querySelector('p')) {
      const caption = document.createElement('p');
      caption.className = 'tour-photograph__caption tour-photograph__caption--hidden';
      container.appendChild(caption);
    }

    return container;
  }

  _getFileSource(file) {
    if (!file) {
      return '';
    }

    if (typeof file === 'string') {
      return file;
    }

    return file.url || file.src || file.path || '';
  }
}

