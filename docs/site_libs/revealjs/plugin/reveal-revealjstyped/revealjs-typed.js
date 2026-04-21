window.RevealRevealjstyped = function () {
  return {
    id: 'RevealRevealjstyped',
    init: function (deck) {
      initRevealjsTyped(deck);
    }
  };
};

const initRevealjsTyped = function (deck) {
  const instances = new WeakMap();
  const originalText = new WeakMap();

  const parseBoolean = function (value, fallback) {
    if (value === null || value === undefined) {
      return fallback;
    }
    const normalized = String(value).trim().toLowerCase();
    return normalized === '' || normalized === 'true' || normalized === '1';
  };

  const parseInteger = function (value, fallback) {
    if (value === null || value === undefined || value === '') {
      return fallback;
    }
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const parseStrings = function (value, fallbackText) {
    if (!value || !String(value).trim()) {
      return [fallbackText];
    }

    const trimmed = String(value).trim();

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item));
        }
      } catch (e) {
        // fall back to delimiter-based parsing
      }
    }

    return trimmed
      .split(/\s*\|\s*/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  };

  const getOriginalText = function (element) {
    if (originalText.has(element)) {
      return originalText.get(element);
    }

    const text = element.textContent.trim();
    originalText.set(element, text);
    return text;
  };

  const getTypedOptions = function (element) {
    return {
      strings: parseStrings(element.getAttribute('data-typed-strings'), getOriginalText(element)),
      typeSpeed: parseInteger(element.getAttribute('data-typed-speed'), 50),
      startDelay: parseInteger(element.getAttribute('data-typed-delay'), 250),
      backSpeed: parseInteger(element.getAttribute('data-typed-backspace-speed'), 30),
      backDelay: parseInteger(element.getAttribute('data-typed-backdelay'), 800),
      loop: parseBoolean(element.getAttribute('data-typed-loop'), false),
      cursor: element.getAttribute('data-typed-cursor') || '|',
      resetOnSlideChange: parseBoolean(element.getAttribute('data-typed-reset-on-slide-change'), false)
    };
  };

  const createTypedMarkup = function (element, options) {
    const typedText = document.createElement('span');
    typedText.className = 'revealjs-typed-text';

    const cursor = document.createElement('span');
    cursor.className = 'revealjs-typed-cursor';
    cursor.textContent = options.cursor;

    element.innerHTML = '';
    element.appendChild(typedText);
    element.appendChild(cursor);

    return {
      typedText,
      cursor
    };
  };

  const clearInstance = function (instance) {
    if (!instance) {
      return;
    }

    if (instance.timeoutId) {
      window.clearTimeout(instance.timeoutId);
    }

    instance.typedText = null;
    instance.cursor = null;
    instance.timeoutId = null;
  };

  const createInstance = function (element, options) {
    const markup = createTypedMarkup(element, options);

    const instance = {
      element,
      options,
      strings: options.strings,
      typedText: markup.typedText,
      cursor: markup.cursor,
      currentString: 0,
      currentChar: 0,
      isDeleting: false,
      timeoutId: null
    };

    instances.set(element, instance);
    instance.timeoutId = window.setTimeout(() => typeStep(instance), options.startDelay);
  };

  const typeStep = function (instance) {
    const currentString = instance.strings[instance.currentString] || '';
    const isComplete = instance.currentChar >= currentString.length;

    if (!instance.isDeleting && !isComplete) {
      instance.typedText.textContent += currentString.charAt(instance.currentChar);
      instance.currentChar += 1;
      instance.timeoutId = window.setTimeout(() => typeStep(instance), instance.options.typeSpeed);
      return;
    }

    if (!instance.isDeleting && isComplete) {
      if (instance.options.loop || instance.currentString + 1 < instance.strings.length) {
        instance.timeoutId = window.setTimeout(() => {
          instance.isDeleting = true;
          typeStep(instance);
        }, instance.options.backDelay);
      }

      return;
    }

    if (instance.isDeleting) {
      const currentText = instance.typedText.textContent;
      instance.typedText.textContent = currentText.slice(0, -1);

      if (instance.typedText.textContent.length > 0) {
        instance.timeoutId = window.setTimeout(() => typeStep(instance), instance.options.backSpeed);
        return;
      }

      instance.isDeleting = false;
      instance.currentString = instance.currentString + 1;

      if (instance.currentString >= instance.strings.length) {
        if (instance.options.loop) {
          instance.currentString = 0;
        } else {
          return;
        }
      }

      instance.currentChar = 0;
      instance.timeoutId = window.setTimeout(() => typeStep(instance), instance.options.typeSpeed);
    }
  };

  const attachToElement = function (element) {
    const options = getTypedOptions(element);
    const existing = instances.get(element);

    if (existing) {
      if (options.resetOnSlideChange) {
        clearInstance(existing);
        createInstance(element, options);
      }
      return;
    }

    createInstance(element, options);
  };

  const scanSlide = function (slide) {
    if (!slide || !slide.querySelectorAll) {
      return;
    }

    const typedElements = slide.querySelectorAll('[data-typed], .typed');

    if (!typedElements.length) {
      return;
    }

    typedElements.forEach((element) => {
      attachToElement(element);
    });
  };

  deck.on('ready', function () {
    scanSlide(deck.getCurrentSlide());
  });

  deck.on('slidechanged', function (event) {
    scanSlide(event.currentSlide);
  });
};
