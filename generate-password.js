import bcrypt from 'bcrypt';

async function hashPassword() {
  const password = 'admin';
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  console.log(`Hashed password for "${password}": ${hashedPassword}`);
}

hashPassword();