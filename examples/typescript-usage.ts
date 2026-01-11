import { parseSii, ProfileSii, GameSii, isValidSiiContent } from '../src/index';

// Example 1: Type-safe profile parsing
console.log('=== Example 1: Type-safe Profile Parsing ===');
const profileContent = `SiiNunit
{
user_profile : _nameless.1234 {
 profile_name: "Jane Smith"
 company_name: "Smith Logistics"
 cached_experience: 25000
 cached_distance: 150000
 male: false
 creation_time: 1640995200
 save_time: 1641081600
 version: 1
}
}`;

try {
  // Parse with type safety
  const profile = parseSii<ProfileSii>(profileContent);

  // TypeScript knows the structure
  const userProfile = profile.SiiNunit.user_profile[0];
  console.log(`Driver: ${userProfile.profile_name}`);
  console.log(`Company: ${userProfile.company_name}`);
  console.log(`Experience: ${userProfile.cached_experience} XP`);
  console.log(`Distance: ${userProfile.cached_distance} km`);
  console.log(`Gender: ${userProfile.male ? 'Male' : 'Female'}`);
} catch (error) {
  console.error('Profile parse error:', error);
}

// Example 2: Game save parsing with types
console.log('\n=== Example 2: Game Save Parsing ===');
const gameContent = `SiiNunit
{
economy : _nameless.9876 {
 bank: "_nameless.bank.1"
 player: "_nameless.player.1"
 game_time: 1234567890
 experience_points: 50000
 total_distance: 250000
}

bank : _nameless.bank.1 {
 money_account: 150000
 loans: 0
 overdraft: false
}

player : _nameless.player.1 {
 assigned_truck: "_nameless.truck.1"
 hq_city: "berlin"
 driving_time: 72000
}
}`;

try {
  const gameData = parseSii<GameSii>(gameContent);

  const economy = gameData.SiiNunit.economy[0];
  const bank = gameData.SiiNunit.bank[0];
  const player = gameData.SiiNunit.player[0];

  console.log(`Game Time: ${economy.game_time}`);
  console.log(`Experience: ${economy.experience_points} XP`);
  console.log(`Bank Balance: €${bank.money_account}`);
  console.log(`HQ City: ${player.hq_city}`);
  console.log(`Driving Time: ${Math.round(player.driving_time / 3600)} hours`);
} catch (error) {
  console.error('Game save parse error:', error);
}

// Example 3: Error handling for encrypted files
console.log('\n=== Example 3: Error Handling ===');
const encryptedContent = 'SCSC\x00\x01\x02\x03...'; // Simulated encrypted content
const binaryContent = 'BSII\x00\x01\x02\x03...'; // Simulated binary content

console.log('Encrypted file valid:', isValidSiiContent(encryptedContent));
console.log('Binary file valid:', isValidSiiContent(binaryContent));

try {
  parseSii(encryptedContent);
} catch (error) {
  console.log('Expected error for encrypted file:', error.message);
}

// Example 4: Async file parsing
async function parseFileExample() {
  console.log('\n=== Example 4: Async File Parsing ===');

  try {
    // This would work if the file exists
    // const profile = await parseSiiFile<ProfileSii>('./profile.sii');
    // console.log('Profile loaded:', profile.SiiNunit.user_profile[0].profile_name);
    console.log('File parsing example (would work with real file)');
  } catch {
    console.log('File not found (expected in example)');
  }
}

parseFileExample();
