const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const User = require('../models/User.model');

const accountDefinitions = [
  { prefix: 'INITIAL_ADMIN', role: 'admin' },
  { prefix: 'INITIAL_HOST', role: 'host' },
];

const getSeedAccounts = () => {
  const missingVariables = [];
  const accounts = accountDefinitions.map(({ prefix, role }) => {
    const firstName = process.env[`${prefix}_FIRST_NAME`]?.trim();
    const lastName = process.env[`${prefix}_LAST_NAME`]?.trim();
    const email = process.env[`${prefix}_EMAIL`]?.trim().toLowerCase();
    const password = process.env[`${prefix}_PASSWORD`];

    if (!firstName) missingVariables.push(`${prefix}_FIRST_NAME`);
    if (!lastName) missingVariables.push(`${prefix}_LAST_NAME`);
    if (!email) missingVariables.push(`${prefix}_EMAIL`);
    if (!password) missingVariables.push(`${prefix}_PASSWORD`);

    return { firstName, lastName, email, password, role };
  });

  if (!process.env.MONGODB_URL) missingVariables.push('MONGODB_URL');
  if (missingVariables.length) {
    throw new Error(`Missing required environment variables: ${missingVariables.join(', ')}`);
  }

  if (accounts[0].email === accounts[1].email) {
    throw new Error('INITIAL_ADMIN_EMAIL and INITIAL_HOST_EMAIL must be different.');
  }

  return accounts;
};

const seedAccount = async ({ firstName, lastName, email, password, role }) => {
  const existingUser = await User.findOne({ email }).select('_id role isVerified');
  if (existingUser) {
    if (existingUser.role !== role || !existingUser.isVerified) {
      throw new Error(
        `Cannot seed ${role} account: ${email} already belongs to an account with a different role or verification status.`
      );
    }

    console.log(`Verified ${role} account already exists: ${email}`);
    return;
  }

  await new User({
    firstName,
    lastName,
    email,
    password,
    role,
    isVerified: true,
  }).save();

  console.log(`Created verified ${role} account: ${email}`);
};

const main = async () => {
  const accounts = getSeedAccounts();

  try {
    await mongoose.connect(process.env.MONGODB_URL);

    for (const account of accounts) {
      await seedAccount(account);
    }
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
};

main()
  .catch((error) => {
    console.error('User seed failed:', error.message);
    process.exitCode = 1;
  });
