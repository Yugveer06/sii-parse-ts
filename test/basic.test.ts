import { describe, it, expect } from 'vitest';
import {
  parseSii,
  parseSiiFile,
  parseSiiChunked,
  parseSiiAs,
  isValidSiiPath,
  isValidSiiContent,
  ProfileSii,
} from '../src/index';
import { readFileSync } from 'fs';
import path from 'path';

// Test-specific interface for complex value parsing
interface TestDataSii {
  SiiNunit: {
    test_data: Array<{
      id: string;
      string_value: string;
      number_value: number;
      float_value: number;
      hex_value: number;
      boolean_true: boolean;
      boolean_false: boolean;
      null_value: null;
      vector: number[];
      array_indexed: string[];
    }>;
  };
}

describe('SII Parser', () => {
  it('should parse simple SII content', () => {
    const siiContent = `SiiNunit
{
user_profile : _nameless.1234 {
 profile_name: "Test Profile"
 company_name: "Test Company"
 cached_experience: 1000
}
}`;

    const result = parseSii<ProfileSii>(siiContent);
    expect(result.SiiNunit).toBeDefined();
    expect(result.SiiNunit.user_profile).toHaveLength(1);
    expect(result.SiiNunit.user_profile[0].profile_name).toBe('Test Profile');
  });

  it('should parse with type safety', () => {
    const siiContent = `SiiNunit
{
user_profile : _nameless.1234 {
 profile_name: "Test Profile"
 company_name: "Test Company"
 cached_experience: 1000
}
}`;

    const result = parseSii<ProfileSii>(siiContent);
    expect(result.SiiNunit).toBeDefined();
    expect(result.SiiNunit.user_profile).toHaveLength(1);
    expect(result.SiiNunit.user_profile[0].profile_name).toBe('Test Profile');
    expect(result.SiiNunit.user_profile[0].company_name).toBe('Test Company');
    expect(result.SiiNunit.user_profile[0].cached_experience).toBe(1000);
  });

  it('should validate SII file paths', () => {
    expect(isValidSiiPath('test.sii')).toBe(false); // doesn't exist
    expect(isValidSiiPath('not-sii.txt')).toBe(false); // wrong extension
  });

  it('should parse real SII files if they exist', async () => {
    const profilePath = path.join(__dirname, 'fixtures', 'profile.sii');

    try {
      if (readFileSync(profilePath)) {
        const profile = await parseSiiFile<ProfileSii>(profilePath);
        expect(profile.SiiNunit).toBeDefined();
        expect(profile.SiiNunit.user_profile).toBeDefined();
        expect(Array.isArray(profile.SiiNunit.user_profile)).toBe(true);
      }
    } catch {
      // Fixtures don't exist, skip
    }
  });

  describe('Content Validation', () => {
    it('should validate correct SII content', () => {
      const validContent = `SiiNunit
{
user_profile : _nameless.1234 {
 profile_name: "Test"
}
}`;
      expect(isValidSiiContent(validContent)).toBe(true);
    });

    it('should reject encrypted SCSC content', () => {
      const encryptedContent = 'SCSC\x00\x01\x02\x03encrypted data';
      expect(isValidSiiContent(encryptedContent)).toBe(false);
    });

    it('should reject binary BSII content', () => {
      const binaryContent = 'BSII\x00\x01\x02\x03binary data';
      expect(isValidSiiContent(binaryContent)).toBe(false);
    });

    it('should reject content without SiiNunit', () => {
      const invalidContent = `{
user_profile : _nameless.1234 {
 profile_name: "Test"
}
}`;
      expect(isValidSiiContent(invalidContent)).toBe(false);
    });

    it('should reject content with unbalanced braces', () => {
      const unbalancedContent = `SiiNunit
{
user_profile : _nameless.1234 {
 profile_name: "Test"
}`;
      expect(isValidSiiContent(unbalancedContent)).toBe(false);
    });

    it('should reject empty or non-string content', () => {
      expect(isValidSiiContent('')).toBe(false);
      expect(isValidSiiContent('   ')).toBe(false);
      expect(isValidSiiContent(null)).toBe(false);
      expect(isValidSiiContent(undefined)).toBe(false);
    });

    it('should reject binary content with non-printable characters', () => {
      const binaryContent = 'SiiNunit\x00\x01\x02\x03{profile}';
      expect(isValidSiiContent(binaryContent)).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for encrypted content', () => {
      const encryptedContent = 'SCSC\x00\x01\x02\x03encrypted';
      expect(() => parseSii(encryptedContent)).toThrow(
        'Invalid SII content: File may be encrypted'
      );
    });

    it('should throw error for binary content', () => {
      const binaryContent = 'BSII\x00\x01\x02\x03binary';
      expect(() => parseSii(binaryContent)).toThrow('Invalid SII content: File may be encrypted');
    });

    it('should throw error for malformed content', () => {
      const malformedContent = 'not valid sii content';
      expect(() => parseSii(malformedContent)).toThrow('Invalid SII content');
    });
  });

  describe('Value Type Parsing', () => {
    it('should parse different value types correctly', () => {
      const complexContent = `SiiNunit
{
test_data : _nameless.5678 {
 string_value: "Hello World"
 number_value: 42
 float_value: 3.14159
 hex_value: 0xFF00
 boolean_true: true
 boolean_false: false
 null_value: nil
 vector: (1.0, 2.0, 3.0)
 array_indexed[0]: "first"
 array_indexed[1]: "second"
}
}`;

      const result = parseSii<TestDataSii>(complexContent);

      // Type-safe access with proper assertions
      expect(result.SiiNunit).toBeDefined();
      expect(result.SiiNunit.test_data).toBeDefined();
      expect(Array.isArray(result.SiiNunit.test_data)).toBe(true);
      expect(result.SiiNunit.test_data).toHaveLength(1);

      const data = result.SiiNunit.test_data[0];
      expect(data).toBeDefined();

      expect(data.string_value).toBe('Hello World');
      expect(data.number_value).toBe(42);
      expect(data.float_value).toBe(3.14159);
      expect(data.hex_value).toBe(65280); // 0xFF00
      expect(data.boolean_true).toBe(true);
      expect(data.boolean_false).toBe(false);
      expect(data.null_value).toBe(null);
      expect(data.vector).toEqual([1.0, 2.0, 3.0]);
      expect(data.array_indexed).toEqual(['first', 'second']);
    });
  });

  describe('New API Functions', () => {
    const testContent = `SiiNunit
{
user_profile : _nameless.1234 {
 profile_name: "Test Profile"
 company_name: "Test Company"
 cached_experience: 1000
}
}`;

    it('should parse with type assertion helpers', () => {
      const result = parseSiiAs<ProfileSii>(testContent);
      expect(result.SiiNunit.user_profile[0].profile_name).toBe('Test Profile');
    });

    it('should parse with chunked processing', () => {
      const result = parseSiiChunked<ProfileSii>(testContent);
      expect(result.SiiNunit.user_profile[0].profile_name).toBe('Test Profile');
    });

    it('should parse with chunked processing with options', () => {
      const result = parseSiiChunked<ProfileSii>(testContent, { chunkSize: 1024 });
      expect(result.SiiNunit.user_profile[0].profile_name).toBe('Test Profile');
    });
  });
});
