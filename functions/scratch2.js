const admin = require('firebase-admin');

// Ensure you have credentials set up, or run this in an environment where ADC is available.
// The easiest is to initialize without credentials if we are in a GCP environment,
// but since we are local, we might need a service account. Wait, does `admin.initializeApp()` work?
// Let's try.
try {
  admin.initializeApp({ projectId: "hirehuub-hrms-86942" });
  
  async function run() {
    const db = admin.firestore();
    const cols = await db.listCollections();
    for (let c of cols) {
      console.log('Collection:', c.id);
      if (c.id.includes('company') || c.id.includes('brand')) {
         const snaps = await c.get();
         snaps.forEach(doc => {
            console.log('  Doc:', doc.id);
         });
      }
    }
  }
  run().then(() => process.exit(0)).catch(e => console.error(e));
} catch(e) {
  console.error(e);
}
