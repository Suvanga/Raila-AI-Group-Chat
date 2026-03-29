import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  Timestamp,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

const PROJECT_ID = 'demo-raila-ai-chat';
const RULES_PATH = resolve(process.cwd(), 'firestore.rules');
const FIXED_TIME = Timestamp.fromMillis(1_700_000_000_000);

const aliceProfile = {
  displayName: 'Alice',
  email: 'alice@example.com',
  photoURL: 'https://example.com/alice.png',
  lastSeen: FIXED_TIME,
};

const bobProfile = {
  displayName: 'Bob',
  email: 'bob@example.com',
  photoURL: 'https://example.com/bob.png',
  lastSeen: FIXED_TIME,
};

const aliceMember = {
  uid: 'alice',
  displayName: 'Alice',
  photoURL: 'https://example.com/alice.png',
};

const bobMember = {
  uid: 'bob',
  displayName: 'Bob',
  photoURL: 'https://example.com/bob.png',
};

let testEnv;

function authedDb(uid) {
  return testEnv.authenticatedContext(uid).firestore();
}

async function seedData(seedFn) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await seedFn(context.firestore());
  });
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(RULES_PATH, 'utf8'),
    },
  });
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('Firestore security rules', () => {
  it('allows safe profile writes but blocks approval and role changes', async () => {
    const aliceDb = authedDb('alice');
    const bobDb = authedDb('bob');

    await seedData(async (db) => {
      await setDoc(doc(db, 'users', 'alice'), {
        ...aliceProfile,
        approved: true,
        role: 'admin',
      });
    });

    await assertSucceeds(
      setDoc(doc(authedDb('carol'), 'users', 'carol'), {
        displayName: 'Carol',
        email: 'carol@example.com',
        photoURL: 'https://example.com/carol.png',
        lastSeen: FIXED_TIME,
      })
    );
    await assertSucceeds(
      updateDoc(doc(aliceDb, 'users', 'alice'), {
        displayName: 'Alice Updated',
      })
    );
    await assertFails(
      setDoc(doc(authedDb('dave'), 'users', 'dave'), {
        displayName: 'Dave',
        email: 'dave@example.com',
        photoURL: 'https://example.com/dave.png',
        lastSeen: FIXED_TIME,
        approved: true,
      })
    );
    await assertFails(
      updateDoc(doc(aliceDb, 'users', 'alice'), {
        approved: false,
      })
    );
    await assertFails(
      updateDoc(doc(aliceDb, 'users', 'alice'), {
        role: 'member',
      })
    );
    await assertFails(
      setDoc(doc(bobDb, 'users', 'alice'), {
        ...aliceProfile,
      })
    );
  });

  it('restricts public messages to author create/delete and whitelisted updates', async () => {
    const aliceDb = authedDb('alice');
    const bobDb = authedDb('bob');

    await seedData(async (db) => {
      await setDoc(doc(db, 'messages', 'message-1'), {
        text: 'Hello world',
        createdAt: FIXED_TIME,
        uid: 'alice',
        email: 'alice@example.com',
        photoURL: 'https://example.com/alice.png',
      });
    });

    await assertSucceeds(
      setDoc(doc(aliceDb, 'messages', 'message-2'), {
        text: 'Fresh message',
        createdAt: FIXED_TIME,
        uid: 'alice',
        email: 'alice@example.com',
        photoURL: 'https://example.com/alice.png',
      })
    );
    await assertFails(
      setDoc(doc(aliceDb, 'messages', 'message-3'), {
        text: 'Spoofed author',
        createdAt: FIXED_TIME,
        uid: 'mallory',
        email: 'mallory@example.com',
        photoURL: 'https://example.com/mallory.png',
      })
    );
    await assertSucceeds(
      updateDoc(doc(bobDb, 'messages', 'message-1'), {
        reactions: { '👍': ['bob'] },
      })
    );
    await assertSucceeds(
      updateDoc(doc(bobDb, 'messages', 'message-1'), {
        pinned: true,
      })
    );
    await assertFails(
      updateDoc(doc(bobDb, 'messages', 'message-1'), {
        text: 'Edited by Bob',
      })
    );
    await assertFails(deleteDoc(doc(bobDb, 'messages', 'message-1')));
    await assertSucceeds(deleteDoc(doc(aliceDb, 'messages', 'message-1')));
  });

  it('restricts room messages to members and protects author-owned fields', async () => {
    const aliceDb = authedDb('alice');
    const bobDb = authedDb('bob');
    const carolDb = authedDb('carol');

    await seedData(async (db) => {
      await setDoc(doc(db, 'chats', 'group-1'), {
        groupName: 'Project Room',
        members: ['alice', 'bob'],
        membersInfo: [aliceMember, bobMember],
        createdBy: 'alice',
        createdAt: FIXED_TIME,
        isGroup: true,
      });
      await setDoc(doc(db, 'chats', 'group-1', 'messages', 'message-1'), {
        text: 'Team sync',
        createdAt: FIXED_TIME,
        uid: 'alice',
        email: 'alice@example.com',
        photoURL: 'https://example.com/alice.png',
      });
    });

    await assertSucceeds(
      updateDoc(doc(bobDb, 'chats', 'group-1', 'messages', 'message-1'), {
        reactions: { '🎉': ['bob'] },
      })
    );
    await assertSucceeds(
      updateDoc(doc(bobDb, 'chats', 'group-1', 'messages', 'message-1'), {
        pinned: true,
      })
    );
    await assertFails(
      updateDoc(doc(bobDb, 'chats', 'group-1', 'messages', 'message-1'), {
        text: 'Bob edit attempt',
      })
    );
    await assertFails(deleteDoc(doc(bobDb, 'chats', 'group-1', 'messages', 'message-1')));
    await assertFails(
      setDoc(doc(carolDb, 'chats', 'group-1', 'messages', 'message-2'), {
        text: 'Carol should not post here',
        createdAt: FIXED_TIME,
        uid: 'carol',
        email: 'carol@example.com',
        photoURL: 'https://example.com/carol.png',
      })
    );
  });

  it('allows only self-leave chat updates and keeps membersInfo in sync', async () => {
    const aliceDb = authedDb('alice');

    await seedData(async (db) => {
      await setDoc(doc(db, 'chats', 'group-1'), {
        groupName: 'Project Room',
        members: ['alice', 'bob'],
        membersInfo: [aliceMember, bobMember],
        createdBy: 'alice',
        createdAt: FIXED_TIME,
        isGroup: true,
      });
    });

    await assertSucceeds(
      updateDoc(doc(aliceDb, 'chats', 'group-1'), {
        members: ['bob'],
        membersInfo: [bobMember],
      })
    );
  });

  it('blocks removing other members, adding members, or changing metadata directly', async () => {
    const aliceDb = authedDb('alice');

    await seedData(async (db) => {
      await setDoc(doc(db, 'chats', 'group-1'), {
        groupName: 'Project Room',
        members: ['alice', 'bob'],
        membersInfo: [aliceMember, bobMember],
        createdBy: 'alice',
        createdAt: FIXED_TIME,
        isGroup: true,
      });
    });

    await assertFails(
      updateDoc(doc(aliceDb, 'chats', 'group-1'), {
        members: ['alice'],
        membersInfo: [aliceMember],
      })
    );
    await assertFails(
      updateDoc(doc(aliceDb, 'chats', 'group-1'), {
        members: ['alice', 'bob', 'carol'],
        membersInfo: [
          aliceMember,
          bobMember,
          {
            uid: 'carol',
            displayName: 'Carol',
            photoURL: 'https://example.com/carol.png',
          },
        ],
      })
    );
    await assertFails(
      updateDoc(doc(aliceDb, 'chats', 'group-1'), {
        groupName: 'Renamed Room',
      })
    );
  });

  it('denies direct client reads to invite documents', async () => {
    const aliceDb = authedDb('alice');

    await seedData(async (db) => {
      await setDoc(doc(db, 'invites', 'CODE1234'), {
        code: 'CODE1234',
        active: true,
        maxUses: 5,
        usedCount: 0,
        expiresAt: FIXED_TIME,
      });
    });

    await assertFails(getDoc(doc(aliceDb, 'invites', 'CODE1234')));
  });
});
