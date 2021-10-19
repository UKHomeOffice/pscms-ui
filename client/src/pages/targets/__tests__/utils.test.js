import { formatAddress, formatCategory, formatPerson } from '../utils';

describe('Address format', () => {
  it('should format address when all fields have text', () => {
    const received = {
      line1: 'Line one',
      line2: 'Line two',
      line3: 'Line three',
      city: 'London',
      postCode: '123',
      country: 'GB',
    };
    expect(formatAddress(received)).toBe('Line one\nLine two\nLine three\nLondon\n123\nGB\n');
  });

  it('should format address when only some fields have text', () => {
    const received = {
      line1: '',
      line2: '',
      line3: '',
      city: 'London',
      postCode: '',
      country: '',
    };
    expect(formatAddress(received)).toBe('London\n');
  });

  it('should handle all empty fields', () => {
    const received = {
      line1: '',
      line2: '',
      line3: '',
      city: '',
      postCode: '',
      country: '',
    };
    expect(formatAddress(received)).toBe('');
  });
});

describe('Category format', () => {
  it('should return only a letter for category', () => {
    expect(formatCategory('target_A')).toBe('A');
  });
});

describe('Person format', () => {
  it('should format person when all fields have text', () => {
    expect(formatPerson('Fred', 'Sam', 'Flintstone', '123')).toBe('Fred Sam Flintstone, 123');
  });

  it('should format person when only some fields have text', () => {
    expect(formatPerson('Fred', '', 'Flintstone', '')).toBe('Fred Flintstone');
  });

  it('should handle all empty fields', () => {
    expect(formatPerson('', '', '', '')).toBe('');
  });
});
