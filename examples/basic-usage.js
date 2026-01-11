const { parseSii, parseSiiFile, isValidSiiPath, isValidSiiContent } = require('../dist/index.js');

// Example 1: Parse SII content directly
console.log('=== Example 1: Parse SII Content ===');
const siiContent = `SiiNunit
{
user_profile : _nameless.1234 {
 profile_name: "John Doe"
 company_name: "Doe Transport"
 cached_experience: 15000
 male: true
 creation_time: 1640995200
}
}`;

try {
  const parsed = parseSii(siiContent);
  console.log('Profile Name:', parsed.SiiNunit.user_profile[0].profile_name);
  console.log('Company:', parsed.SiiNunit.user_profile[0].company_name);
  console.log('Experience:', parsed.SiiNunit.user_profile[0].cached_experience);
} catch (error) {
  console.error('Parse error:', error.message);
}

// Example 2: Validate SII content
console.log('\n=== Example 2: Content Validation ===');
console.log('Valid content:', isValidSiiContent(siiContent));
console.log('Invalid content:', isValidSiiContent('SCSC encrypted content'));
console.log('Empty content:', isValidSiiContent(''));

// Example 3: File validation
console.log('\n=== Example 3: File Validation ===');
console.log('Valid path check:', isValidSiiPath('./test/fixtures/profile.sii'));
console.log('Invalid extension:', isValidSiiPath('./package.json'));

// Example 4: Parse different value types
console.log('\n=== Example 4: Value Types ===');
const complexSii = `SiiNunit
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

try {
  const complexParsed = parseSii(complexSii);
  const data = complexParsed.SiiNunit.test_data[0];
  console.log('String:', data.string_value);
  console.log('Number:', data.number_value);
  console.log('Float:', data.float_value);
  console.log('Hex:', data.hex_value);
  console.log('Boolean:', data.boolean_true);
  console.log('Null:', data.null_value);
  console.log('Vector:', data.vector);
  console.log('Array:', data.array_indexed);
} catch (error) {
  console.error('Parse error:', error.message);
}
