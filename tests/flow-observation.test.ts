import { expect, it } from 'vitest';
import { pageKind, observedLabels } from '../sidecar/src/flow/observation';
it('classifies only exact provider origins and never exposes query strings', () => {
  expect(pageKind('https://labs.google/fx/tools/flow/project/123?token=secret')).toBe('flow');
  expect(pageKind('https://flow.google/')).toBe('flow');
  expect(pageKind('https://accounts.google.com/signin?secret=fixture')).toBe('login');
  for (const url of [
    'http://flow.google/',
    'https://flow.google.evil.test/',
    'https://labs.google/other',
    'https://user:pass@flow.google/',
    'file:///test',
    'https://flow.google:1234/',
  ])
    expect(pageKind(url)).toBe('other');
});
it('extracts only bounded candidate labels, without treating text as verified credit or price', () => {
  expect(
    observedLabels([
      'Veo 3.1 - Fast',
      '100 credits',
      '1.000 kredit',
      'Credits: 50',
      'private@example.com',
      'prompt text',
      'token=secret',
      'Veo https://private',
      'Veo 3.1 - Fast',
    ]),
  ).toEqual({
    modelLabels: ['Veo 3.1 - Fast'],
    creditLabels: ['100 credits', '1.000 kredit', 'Credits: 50'],
  });
  expect(observedLabels(['Veo ' + 'x'.repeat(101)]).modelLabels).toEqual([]);
});
