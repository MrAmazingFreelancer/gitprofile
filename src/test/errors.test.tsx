import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
  INVALID_CONFIG_ERROR,
  INVALID_GITHUB_USERNAME_ERROR,
  GENERIC_ERROR,
  setTooManyRequestError,
} from '../constants/errors';

describe('INVALID_CONFIG_ERROR', () => {
  it('has the correct status code', () => {
    expect(INVALID_CONFIG_ERROR.status).toBe(500);
  });

  it('has a non-empty title', () => {
    expect(INVALID_CONFIG_ERROR.title).toBe('Invalid Config!');
  });

  it('renders a subTitle that mentions gitprofile.config.ts', () => {
    const { getByText } = render(INVALID_CONFIG_ERROR.subTitle as React.ReactElement);
    expect(getByText(/gitprofile\.config\.ts/i)).toBeTruthy();
  });
});

describe('INVALID_GITHUB_USERNAME_ERROR', () => {
  it('has the correct status code', () => {
    expect(INVALID_GITHUB_USERNAME_ERROR.status).toBe(404);
  });

  it('has a non-empty title', () => {
    expect(INVALID_GITHUB_USERNAME_ERROR.title).toBe('Invalid GitHub Username!');
  });

  it('renders a subTitle that mentions gitprofile.config.ts', () => {
    const { getByText } = render(
      INVALID_GITHUB_USERNAME_ERROR.subTitle as React.ReactElement,
    );
    expect(getByText(/gitprofile\.config\.ts/i)).toBeTruthy();
  });
});

describe('GENERIC_ERROR', () => {
  it('has status 500', () => {
    expect(GENERIC_ERROR.status).toBe(500);
  });

  it('has the correct title', () => {
    expect(GENERIC_ERROR.title).toBe('Oops!!');
  });

  it('has a non-empty subTitle string', () => {
    expect(typeof GENERIC_ERROR.subTitle).toBe('string');
    expect((GENERIC_ERROR.subTitle as string).length).toBeGreaterThan(0);
  });
});

describe('setTooManyRequestError', () => {
  it('returns status 429', () => {
    const error = setTooManyRequestError('in 10 minutes');
    expect(error.status).toBe(429);
  });

  it('has the correct title', () => {
    const error = setTooManyRequestError('in 10 minutes');
    expect(error.title).toBe('Too Many Requests!');
  });

  it('renders a subTitle that includes the reset time', () => {
    const resetTime = 'in 10 minutes';
    const error = setTooManyRequestError(resetTime);
    const { getByText } = render(error.subTitle as React.ReactElement);
    expect(getByText(/in 10 minutes/i)).toBeTruthy();
  });

  it('renders a link to the GitHub rate limit docs', () => {
    const error = setTooManyRequestError('later');
    const { container } = render(error.subTitle as React.ReactElement);
    const link = container.querySelector('a');
    expect(link).not.toBeNull();
    expect(link?.href).toContain('developer.github.com/v3/rate_limit/');
  });

  it('returns different subTitles for different reset times', () => {
    const error1 = setTooManyRequestError('in 5 minutes');
    const error2 = setTooManyRequestError('tomorrow');

    const { container: c1 } = render(error1.subTitle as React.ReactElement);
    const { container: c2 } = render(error2.subTitle as React.ReactElement);

    expect(c1.textContent).toContain('in 5 minutes');
    expect(c2.textContent).toContain('tomorrow');
  });
});
