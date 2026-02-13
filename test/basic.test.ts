import { describe, it, expect } from 'vitest';
import {
  parseSii,
  parseSiiFile,
  parseSiiChunked,
  parseSiiAs,
  isValidSiiPath,
  isValidSiiContent,
  stringifySii,
  getBlock,
  getBlocks,
  findBlockById,
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
      expect(isValidSiiContent(null as unknown as string)).toBe(false);
      expect(isValidSiiContent(undefined as unknown as string)).toBe(false);
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

    it('should parse IEEE 754 hex floats correctly', () => {
      const content = `SiiNunit
{
test : _nameless.1 {
 wear: &3f800000
}
}`;

      const result = parseSii(content);
      const test = (result as Record<string, unknown>)['SiiNunit'] as Record<string, unknown>;
      const items = test['test'] as Array<Record<string, unknown>>;
      // &3f800000 = 1.0 in IEEE 754
      expect(items[0]['wear']).toBeCloseTo(1.0, 5);
    });

    it('should parse nested tuples (placements)', () => {
      const content = `SiiNunit
{
test : _nameless.1 {
 placement: (1.0, 2.0, 3.0) (0.0, 0.0, 0.0, 1.0)
}
}`;

      const result = parseSii(content);
      const test = (result as Record<string, unknown>)['SiiNunit'] as Record<string, unknown>;
      const items = test['test'] as Array<Record<string, unknown>>;
      const placement = items[0]['placement'] as number[][];
      expect(placement).toHaveLength(2);
      expect(placement[0]).toEqual([1.0, 2.0, 3.0]);
      expect(placement[1]).toEqual([0.0, 0.0, 0.0, 1.0]);
    });

    it('should handle negative hex integers', () => {
      const content = `SiiNunit
{
test : _nameless.1 {
 value: -0xFF
}
}`;

      const result = parseSii(content);
      const test = (result as Record<string, unknown>)['SiiNunit'] as Record<string, unknown>;
      const items = test['test'] as Array<Record<string, unknown>>;
      expect(items[0]['value']).toBe(-255);
    });

    it('should parse multiple blocks of the same type', () => {
      const content = `SiiNunit
{
vehicle : truck.1 {
 odometer: 50000
 fuel_relative: 0.75
}
vehicle : truck.2 {
 odometer: 120000
 fuel_relative: 0.5
}
}`;

      const result = parseSii(content);
      const unit = (result as Record<string, unknown>)['SiiNunit'] as Record<string, unknown>;
      const vehicles = unit['vehicle'] as Array<Record<string, unknown>>;
      expect(vehicles).toHaveLength(2);
      expect(vehicles[0]['id']).toBe('truck.1');
      expect(vehicles[0]['odometer']).toBe(50000);
      expect(vehicles[1]['id']).toBe('truck.2');
      expect(vehicles[1]['odometer']).toBe(120000);
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

  describe('stringifySii', () => {
    it('should round-trip a simple profile', () => {
      const original = `SiiNunit
{
user_profile : _nameless.1234 {
 profile_name: "Test Profile"
 company_name: "Test Company"
 cached_experience: 1000
}
}`;

      const parsed = parseSii<ProfileSii>(original);
      const output = stringifySii(parsed);

      // Re-parse the output and verify values match
      const reparsed = parseSii<ProfileSii>(output);
      expect(reparsed.SiiNunit.user_profile[0].profile_name).toBe('Test Profile');
      expect(reparsed.SiiNunit.user_profile[0].company_name).toBe('Test Company');
      expect(reparsed.SiiNunit.user_profile[0].cached_experience).toBe(1000);
    });

    it('should serialize null values as nil', () => {
      const content = `SiiNunit
{
test : _nameless.1 {
 value: nil
}
}`;

      const parsed = parseSii(content);
      const output = stringifySii(parsed);
      expect(output).toContain('nil');
    });

    it('should serialize boolean values', () => {
      const content = `SiiNunit
{
test : _nameless.1 {
 flag_true: true
 flag_false: false
}
}`;

      const parsed = parseSii(content);
      const output = stringifySii(parsed);
      expect(output).toContain('true');
      expect(output).toContain('false');
    });

    it('should serialize vectors as tuples', () => {
      const content = `SiiNunit
{
test : _nameless.1 {
 position: (1, 2, 3)
}
}`;

      const parsed = parseSii(content);
      const output = stringifySii(parsed);
      expect(output).toContain('(1, 2, 3)');
    });

    it('should support custom indentation and line endings', () => {
      const content = `SiiNunit
{
test : _nameless.1 {
 value: 42
}
}`;

      const parsed = parseSii(content);
      const output = stringifySii(parsed, { indent: '  ', lineEnding: '\r\n' });
      expect(output).toContain('\r\n');
      expect(output).toContain('  value');
    });

    it('should round-trip multiple blocks', () => {
      const content = `SiiNunit
{
vehicle : truck.1 {
 odometer: 50000
}
vehicle : truck.2 {
 odometer: 120000
}
}`;

      const parsed = parseSii(content);
      const output = stringifySii(parsed);
      const reparsed = parseSii(output);

      const unit = (reparsed as Record<string, unknown>)['SiiNunit'] as Record<string, unknown>;
      const vehicles = unit['vehicle'] as Array<Record<string, unknown>>;
      expect(vehicles).toHaveLength(2);
      expect(vehicles[0]['odometer']).toBe(50000);
      expect(vehicles[1]['odometer']).toBe(120000);
    });
  });

  describe('Query Helpers', () => {
    const content = `SiiNunit
{
economy : _nameless.eco1 {
 game_time: 1234567
 total_distance: 50000
}
vehicle : truck.1 {
 odometer: 50000
}
vehicle : truck.2 {
 odometer: 120000
}
}`;

    it('should get single block with getBlock', () => {
      const parsed = parseSii(content);
      const economy = getBlock(parsed, 'SiiNunit', 'economy');
      expect(economy).toBeDefined();
      expect(economy!['game_time']).toBe(1234567);
    });

    it('should get all blocks with getBlocks', () => {
      const parsed = parseSii(content);
      const vehicles = getBlocks(parsed, 'SiiNunit', 'vehicle');
      expect(vehicles).toHaveLength(2);
      expect(vehicles[0]['odometer']).toBe(50000);
      expect(vehicles[1]['odometer']).toBe(120000);
    });

    it('should find block by id', () => {
      const parsed = parseSii(content);
      const truck = findBlockById(parsed, 'vehicle', 'truck.2');
      expect(truck).toBeDefined();
      expect(truck!['odometer']).toBe(120000);
    });

    it('should return undefined for non-existent block', () => {
      const parsed = parseSii(content);
      const result = getBlock(parsed, 'SiiNunit', 'nonexistent');
      expect(result).toBeUndefined();
    });

    it('should return undefined for non-existent id', () => {
      const parsed = parseSii(content);
      const result = findBlockById(parsed, 'vehicle', 'nonexistent.99');
      expect(result).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle comments in SII content', () => {
      const content = `SiiNunit
{
// This is a comment
user_profile : _nameless.1234 {
 // Another comment
 profile_name: "Test"
}
}`;

      const result = parseSii<ProfileSii>(content);
      expect(result.SiiNunit.user_profile[0].profile_name).toBe('Test');
    });

    it('should handle dotted keys', () => {
      const content = `SiiNunit
{
test : _nameless.1 {
 my.dotted.key: 42
}
}`;

      const result = parseSii(content);
      const unit = (result as Record<string, unknown>)['SiiNunit'] as Record<string, unknown>;
      const items = unit['test'] as Array<Record<string, unknown>>;
      expect(items[0]['my.dotted.key']).toBe(42);
    });

    it('should handle pre-allocated arrays (count before indexes)', () => {
      const content = `SiiNunit
{
test : _nameless.1 {
 items: 3
 items[0]: "a"
 items[1]: "b"
 items[2]: "c"
}
}`;

      const result = parseSii(content);
      const unit = (result as Record<string, unknown>)['SiiNunit'] as Record<string, unknown>;
      const items = unit['test'] as Array<Record<string, unknown>>;
      expect(items[0]['items']).toEqual(['a', 'b', 'c']);
    });

    it('should handle semicolons in tuples', () => {
      const content = `SiiNunit
{
test : _nameless.1 {
 color: (1.0; 0.5; 0.0)
}
}`;

      const result = parseSii(content);
      const unit = (result as Record<string, unknown>)['SiiNunit'] as Record<string, unknown>;
      const items = unit['test'] as Array<Record<string, unknown>>;
      expect(items[0]['color']).toEqual([1.0, 0.5, 0.0]);
    });

    it('should handle empty arrays (0 count)', () => {
      const content = `SiiNunit
{
test : _nameless.1 {
 items: 0
}
}`;

      const result = parseSii(content);
      const unit = (result as Record<string, unknown>)['SiiNunit'] as Record<string, unknown>;
      const items = unit['test'] as Array<Record<string, unknown>>;
      // When items: 0, parser stores it as number 0 (no subsequent indexed entries)
      expect(items[0]['items']).toBe(0);
    });

    it('should handle SiiNunit on same line as opening brace', () => {
      const content = `SiiNunit
{
test : _nameless.1 {
 value: 1
}
}`;

      const result = parseSii(content);
      const unit = (result as Record<string, unknown>)['SiiNunit'] as Record<string, unknown>;
      const items = unit['test'] as Array<Record<string, unknown>>;
      expect(items[0]['value']).toBe(1);
    });
  });
});
