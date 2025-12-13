import { locationByTextPipe } from './location-by-text-pipe';

describe('locationByTextPipe', () => {
  it('create an instance', () => {
    const pipe = new locationByTextPipe();
    expect(pipe).toBeTruthy();
  });
});
