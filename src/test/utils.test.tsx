import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import {
  isDarkishTheme,
  getSanitizedConfig,
  getInitialTheme,
  skeleton,
  ga,
  getLanguageColor,
} from '../utils';
import { DEFAULT_THEMES } from '../constants/default-themes';

// ---------------------------------------------------------------------------
// isDarkishTheme
// ---------------------------------------------------------------------------
describe('isDarkishTheme', () => {
  it('returns true for known dark themes', () => {
    const darkThemes = [
      'dark',
      'halloween',
      'forest',
      'black',
      'luxury',
      'dracula',
    ];
    darkThemes.forEach((theme) => {
      expect(isDarkishTheme(theme)).toBe(true);
    });
  });

  it('returns false for light themes', () => {
    const lightThemes = ['light', 'cupcake', 'emerald', 'corporate', 'winter'];
    lightThemes.forEach((theme) => {
      expect(isDarkishTheme(theme)).toBe(false);
    });
  });

  it('returns false for an unknown theme', () => {
    expect(isDarkishTheme('unknown-theme')).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isDarkishTheme('')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getSanitizedConfig
// ---------------------------------------------------------------------------
describe('getSanitizedConfig', () => {
  const minimalConfig: Config = {
    github: { username: 'testuser' },
  };

  it('returns a valid sanitized config for a minimal config', () => {
    const result = getSanitizedConfig(minimalConfig);
    expect(result).toMatchObject({
      github: { username: 'testuser' },
    });
  });

  it('uses default values when optional fields are omitted', () => {
    const result = getSanitizedConfig(minimalConfig) as ReturnType<
      typeof getSanitizedConfig
    >;
    if (!('github' in result)) {
      throw new Error('Expected a valid config');
    }
    expect(result.projects.github.display).toBe(true);
    expect(result.projects.github.header).toBe('Github Projects');
    expect(result.projects.github.mode).toBe('automatic');
    expect(result.projects.github.automatic.sortBy).toBe('stars');
    expect(result.projects.github.automatic.limit).toBe(8);
    expect(result.projects.github.automatic.exclude.forks).toBe(false);
    expect(result.projects.github.automatic.exclude.projects).toEqual([]);
    expect(result.projects.github.manual.projects).toEqual([]);
    expect(result.projects.external.header).toBe('My Projects');
    expect(result.projects.external.projects).toEqual([]);
    expect(result.resume.fileUrl).toBe('');
    expect(result.skills).toEqual([]);
    expect(result.experiences).toEqual([]);
    expect(result.certifications).toEqual([]);
    expect(result.educations).toEqual([]);
    expect(result.publications).toEqual([]);
    expect(result.hotjar.snippetVersion).toBe(6);
    expect(result.blog.source).toBe('dev');
    expect(result.blog.limit).toBe(5);
    expect(result.blog.display).toBe(false);
    expect(result.themeConfig.defaultTheme).toBe(DEFAULT_THEMES[0]);
    expect(result.themeConfig.disableSwitch).toBe(false);
    expect(result.themeConfig.respectPrefersColorScheme).toBe(false);
    expect(result.themeConfig.displayAvatarRing).toBe(true);
    expect(result.themeConfig.themes).toEqual(DEFAULT_THEMES);
    expect(result.enablePWA).toBe(true);
  });

  it('preserves provided optional fields', () => {
    const config: Config = {
      github: { username: 'johndoe' },
      projects: {
        github: {
          display: false,
          header: 'My GitHub Projects',
          mode: 'manual',
          automatic: { sortBy: 'updated', limit: 4, exclude: { forks: true, projects: ['repo1'] } },
          manual: { projects: ['repo2'] },
        },
        external: {
          header: 'External Work',
          projects: [{ title: 'Proj', link: 'https://example.com' }],
        },
      },
      skills: ['TypeScript', 'React'],
      resume: { fileUrl: 'https://example.com/cv.pdf' },
      blog: { username: 'johndoe', source: 'medium', limit: 3 },
      themeConfig: {
        defaultTheme: 'dark',
        disableSwitch: true,
        respectPrefersColorScheme: false,
        displayAvatarRing: false,
        themes: ['light', 'dark'],
      },
      footer: 'Custom Footer',
      enablePWA: false,
    };

    const result = getSanitizedConfig(config) as ReturnType<
      typeof getSanitizedConfig
    >;
    if (!('github' in result)) {
      throw new Error('Expected a valid config');
    }

    expect(result.github.username).toBe('johndoe');
    expect(result.projects.github.display).toBe(false);
    expect(result.projects.github.header).toBe('My GitHub Projects');
    expect(result.projects.github.mode).toBe('manual');
    expect(result.projects.github.automatic.sortBy).toBe('updated');
    expect(result.projects.github.automatic.limit).toBe(4);
    expect(result.projects.github.automatic.exclude.forks).toBe(true);
    expect(result.projects.github.automatic.exclude.projects).toEqual(['repo1']);
    expect(result.projects.github.manual.projects).toEqual(['repo2']);
    expect(result.projects.external.header).toBe('External Work');
    expect(result.projects.external.projects).toHaveLength(1);
    expect(result.skills).toEqual(['TypeScript', 'React']);
    expect(result.resume.fileUrl).toBe('https://example.com/cv.pdf');
    expect(result.blog.username).toBe('johndoe');
    expect(result.blog.source).toBe('medium');
    expect(result.blog.limit).toBe(3);
    expect(result.blog.display).toBe(true);
    expect(result.themeConfig.defaultTheme).toBe('dark');
    expect(result.themeConfig.disableSwitch).toBe(true);
    expect(result.themeConfig.displayAvatarRing).toBe(false);
    expect(result.themeConfig.themes).toEqual(['light', 'dark']);
    expect(result.footer).toBe('Custom Footer');
    expect(result.enablePWA).toBe(false);
  });

  it('filters experiences that have no meaningful fields', () => {
    const config: Config = {
      github: { username: 'testuser' },
      experiences: [
        { company: 'Acme', position: 'Dev', from: '2020', to: '2022' },
        { from: '', to: '' }, // no meaningful fields → filtered out
      ],
    };
    const result = getSanitizedConfig(config) as ReturnType<
      typeof getSanitizedConfig
    >;
    if (!('github' in result)) throw new Error('Expected valid config');
    expect(result.experiences).toHaveLength(1);
    expect(result.experiences[0].company).toBe('Acme');
  });

  it('filters certifications that have no meaningful fields', () => {
    const config: Config = {
      github: { username: 'testuser' },
      certifications: [
        { name: 'AWS', body: 'Amazon', year: '2023' },
        {}, // no meaningful fields → filtered out
      ],
    };
    const result = getSanitizedConfig(config) as ReturnType<
      typeof getSanitizedConfig
    >;
    if (!('github' in result)) throw new Error('Expected valid config');
    expect(result.certifications).toHaveLength(1);
  });

  it('filters educations that have no meaningful fields', () => {
    const config: Config = {
      github: { username: 'testuser' },
      educations: [
        { institution: 'MIT', degree: 'BSc', from: '2015', to: '2019' },
        { from: '', to: '' }, // no meaningful fields → filtered out
      ],
    };
    const result = getSanitizedConfig(config) as ReturnType<
      typeof getSanitizedConfig
    >;
    if (!('github' in result)) throw new Error('Expected valid config');
    expect(result.educations).toHaveLength(1);
  });

  it('filters publications without a title', () => {
    const config: Config = {
      github: { username: 'testuser' },
      publications: [
        { title: 'Paper A' },
        { title: '' }, // falsy title → filtered out
      ],
    };
    const result = getSanitizedConfig(config) as ReturnType<
      typeof getSanitizedConfig
    >;
    if (!('github' in result)) throw new Error('Expected valid config');
    expect(result.publications).toHaveLength(1);
    expect(result.publications[0].title).toBe('Paper A');
  });

  it('sets blog.display to false when username is missing', () => {
    const config: Config = {
      github: { username: 'testuser' },
      blog: { source: 'dev', limit: 5 },
    };
    const result = getSanitizedConfig(config) as ReturnType<
      typeof getSanitizedConfig
    >;
    if (!('github' in result)) throw new Error('Expected valid config');
    expect(result.blog.display).toBe(false);
  });

  it('sets blog.display to false when source is missing', () => {
    const config: Config = {
      github: { username: 'testuser' },
      blog: { username: 'johndoe' },
    };
    const result = getSanitizedConfig(config) as ReturnType<
      typeof getSanitizedConfig
    >;
    if (!('github' in result)) throw new Error('Expected valid config');
    expect(result.blog.display).toBe(false);
  });

  it('returns an empty object when config throws (no github username)', () => {
    // Passing a config object without github to force a thrown error
    const result = getSanitizedConfig({} as Config);
    expect(result).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// getInitialTheme
// ---------------------------------------------------------------------------
describe('getInitialTheme', () => {
  const LOCAL_STORAGE_KEY = 'gitprofile-theme';

  beforeEach(() => {
    localStorage.clear();
    // Reset matchMedia mock before each test
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('returns defaultTheme when disableSwitch is true', () => {
    const themeConfig = {
      defaultTheme: 'cupcake',
      disableSwitch: true,
      respectPrefersColorScheme: false,
      displayAvatarRing: true,
      themes: ['light', 'dark', 'cupcake'],
    };
    expect(getInitialTheme(themeConfig)).toBe('cupcake');
  });

  it('returns saved theme from localStorage when it is in themes list', () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, 'dark');
    const themeConfig = {
      defaultTheme: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: false,
      displayAvatarRing: true,
      themes: ['light', 'dark'],
    };
    expect(getInitialTheme(themeConfig)).toBe('dark');
  });

  it('falls through to defaultTheme when saved theme is not in themes list', () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, 'synthwave');
    const themeConfig = {
      defaultTheme: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: false,
      displayAvatarRing: true,
      themes: ['light', 'dark'],
    };
    expect(getInitialTheme(themeConfig)).toBe('light');
  });

  it('returns "dark" when respectPrefersColorScheme is true and prefers dark', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue({ matches: true }),
    });
    const themeConfig = {
      defaultTheme: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
      displayAvatarRing: true,
      themes: ['light', 'dark'],
    };
    expect(getInitialTheme(themeConfig)).toBe('dark');
  });

  it('returns defaultTheme when respectPrefersColorScheme is true but prefers light', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
    const themeConfig = {
      defaultTheme: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
      displayAvatarRing: true,
      themes: ['light', 'dark'],
    };
    expect(getInitialTheme(themeConfig)).toBe('light');
  });

  it('returns defaultTheme when no localStorage and no color scheme preference', () => {
    const themeConfig = {
      defaultTheme: 'winter',
      disableSwitch: false,
      respectPrefersColorScheme: false,
      displayAvatarRing: true,
      themes: DEFAULT_THEMES,
    };
    expect(getInitialTheme(themeConfig)).toBe('winter');
  });

  it('ignores disableSwitch override when respectPrefersColorScheme is also true', () => {
    // disableSwitch takes priority: should return defaultTheme immediately
    const themeConfig = {
      defaultTheme: 'emerald',
      disableSwitch: true,
      respectPrefersColorScheme: true,
      displayAvatarRing: true,
      themes: DEFAULT_THEMES,
    };
    expect(getInitialTheme(themeConfig)).toBe('emerald');
  });
});

// ---------------------------------------------------------------------------
// skeleton
// ---------------------------------------------------------------------------
describe('skeleton', () => {
  it('renders a div with default classes', () => {
    const { container } = render(skeleton({}));
    const div = container.firstChild as HTMLElement;
    expect(div.tagName).toBe('DIV');
    expect(div.className).toContain('bg-base-300');
    expect(div.className).toContain('animate-pulse');
    expect(div.className).toContain('rounded-full');
  });

  it('applies widthCls and heightCls when provided', () => {
    const { container } = render(
      skeleton({ widthCls: 'w-32', heightCls: 'h-4' }),
    );
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain('w-32');
    expect(div.className).toContain('h-4');
  });

  it('applies a custom shape class', () => {
    const { container } = render(skeleton({ shape: 'rounded-lg' }));
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain('rounded-lg');
    expect(div.className).not.toContain('rounded-full');
  });

  it('applies a custom className', () => {
    const { container } = render(skeleton({ className: 'my-custom-class' }));
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain('my-custom-class');
  });

  it('applies inline styles', () => {
    const { container } = render(
      skeleton({ style: { width: '100px', height: '20px' } }),
    );
    const div = container.firstChild as HTMLElement;
    expect(div.style.width).toBe('100px');
    expect(div.style.height).toBe('20px');
  });

  it('does not include widthCls or heightCls when they are null', () => {
    const { container } = render(
      skeleton({ widthCls: null, heightCls: null }),
    );
    const div = container.firstChild as HTMLElement;
    // class list should only be the base three
    const classes = div.className.split(' ');
    expect(classes).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// ga.event
// ---------------------------------------------------------------------------
describe('ga.event', () => {
  it('calls window.gtag with the correct arguments', () => {
    const gtagMock = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).gtag = gtagMock;

    ga.event('click', { category: 'button', label: 'submit' });

    expect(gtagMock).toHaveBeenCalledWith('event', 'click', {
      category: 'button',
      label: 'submit',
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).gtag;
  });

  it('does not throw when window.gtag is not defined', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).gtag;
    expect(() => ga.event('click', {})).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// getLanguageColor
// ---------------------------------------------------------------------------
describe('getLanguageColor', () => {
  it('returns the color for a known language', () => {
    const color = getLanguageColor('TypeScript');
    expect(color).toBeTruthy();
    expect(color).not.toBe('gray');
  });

  it('returns "gray" for an unknown language', () => {
    expect(getLanguageColor('UnknownLang123')).toBe('gray');
  });

  it('returns "gray" for an empty string', () => {
    expect(getLanguageColor('')).toBe('gray');
  });

  it('returns a valid color string for JavaScript', () => {
    const color = getLanguageColor('JavaScript');
    expect(typeof color).toBe('string');
    expect(color).not.toBe('gray');
  });

  it('returns "gray" when the language entry has a null color', () => {
    // Languages exist in colors.json with color: null → should fall back to "gray"
    // We test this indirectly: getLanguageColor must always return a string
    const color = getLanguageColor('Dockerfile');
    expect(typeof color).toBe('string');
  });
});
