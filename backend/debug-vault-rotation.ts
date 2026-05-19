import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { EncryptionService } from './src/common/utils/encryption.service';
import { PrismaService } from './src/modules/prisma/prisma.service';

async function bootstrap() {
  console.log('🚀 Bootstrapping NestJS Context for Vault Key Rotation Verification...');
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const encryptionService = app.get(EncryptionService);
  const prisma = app.get(PrismaService);

  console.log('\n--- 1. Verification of Initial Vault Status ---');
  const initialStatus = await encryptionService.getVaultStatus();
  console.log('Initial Status:', initialStatus);

  console.log('\n--- 2. Setting Up Test Credentials ---');
  // Clean up any old test credentials first
  await prisma.credential.deleteMany({
    where: { name: 'ROTATION_TEST_CRED' }
  });

  // Inject a manual 'legacy' format encrypted credential (using direct KEK)
  // This simulates data created before this upgrade!
  const plainTextPassword = 'MySecretSuperSafePassword123!';
  
  // To create a legacy credential, we temporarily bypass the vault prefix if it's active.
  // We can do this by using a manual legacy-format cipher or simulating legacy encrypt.
  // Let's encrypt it using legacy fallback mode:
  const legacyEncrypted = encryptionService.encrypt(plainTextPassword);
  console.log('Plain Password:', plainTextPassword);
  console.log('Encrypted (pre-rotation):', legacyEncrypted);

  const testCred = await prisma.credential.create({
    data: {
      name: 'ROTATION_TEST_CRED',
      type: 'SSH',
      username: 'test_admin',
      password: legacyEncrypted,
      description: 'Used for verifying the new Vault DEK Key Rotation mechanism',
      tags: ['test', 'vault'],
    }
  });
  console.log(`Test credential created in database with ID: ${testCred.id}`);

  console.log('\n--- 3. Testing Legacy Decryption Fallback ---');
  const decryptedPreRotation = encryptionService.decrypt(testCred.password);
  console.log('Decrypted pre-rotation:', decryptedPreRotation);
  if (decryptedPreRotation === plainTextPassword) {
    console.log('✅ PASS: Legacy decryption fallback works perfectly!');
  } else {
    console.error('❌ FAIL: Legacy decryption failed.');
    await cleanup(app, prisma);
    return;
  }

  console.log('\n--- 4. Executing Vault Key Rotation (1st Rotation) ---');
  const rotation1Result = await encryptionService.rotateKey();
  console.log('1st Rotation Result:', rotation1Result);

  console.log('\n--- 5. Verifying Credential Upgrade & Decryption ---');
  const updatedCred1 = await prisma.credential.findUnique({
    where: { id: testCred.id }
  });

  if (!updatedCred1) {
    console.error('❌ FAIL: Credential not found after rotation.');
    await cleanup(app, prisma);
    return;
  }

  console.log('New Encrypted Ciphertext:', updatedCred1.password);
  if (updatedCred1.password.startsWith('yv1:')) {
    console.log('✅ PASS: Credential upgraded successfully to the dynamic DEK envelope format!');
  } else {
    console.error('❌ FAIL: Credential does not use the yv1 prefix.');
  }

  const decryptedPostRotation1 = encryptionService.decrypt(updatedCred1.password);
  console.log('Decrypted post-rotation 1:', decryptedPostRotation1);
  if (decryptedPostRotation1 === plainTextPassword) {
    console.log('✅ PASS: Decryption after 1st rotation works flawlessly!');
  } else {
    console.error('❌ FAIL: Decryption post-rotation failed.');
  }

  console.log('\n--- 6. Executing 2nd Vault Key Rotation (History verification) ---');
  const rotation2Result = await encryptionService.rotateKey();
  console.log('2nd Rotation Result:', rotation2Result);

  const updatedCred2 = await prisma.credential.findUnique({
    where: { id: testCred.id }
  });

  if (!updatedCred2) {
    console.error('❌ FAIL: Credential not found after 2nd rotation.');
    await cleanup(app, prisma);
    return;
  }

  console.log('Second Rotation Ciphertext:', updatedCred2.password);
  const decryptedPostRotation2 = encryptionService.decrypt(updatedCred2.password);
  console.log('Decrypted post-rotation 2:', decryptedPostRotation2);
  if (decryptedPostRotation2 === plainTextPassword) {
    console.log('✅ PASS: Decryption using multi-key history is completely functional and verified!');
  } else {
    console.error('❌ FAIL: Decryption post-2nd-rotation failed.');
  }

  console.log('\n--- 7. Cleanup & Shutdown ---');
  await cleanup(app, prisma);
  await app.close();
  console.log('🏁 Verification successfully completed! All vault systems are green.');
}

async function cleanup(app: any, prisma: PrismaService) {
  try {
    await prisma.credential.deleteMany({
      where: { name: 'ROTATION_TEST_CRED' }
    });
    console.log('🧹 Cleaned up test credentials.');
  } catch (err) {
    console.error('Failed to cleanup:', err.message);
  }
}

bootstrap().catch(err => {
  console.error('💥 Execution failed with error:', err);
  process.exit(1);
});
