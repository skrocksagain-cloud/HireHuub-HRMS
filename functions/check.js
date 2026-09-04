admin.auth().getUserByEmail('hh0005@hirehuub.local').then(u => console.log('UID:', u.uid)).catch(e => console.log('Error:', e.message));
