export const sanitizeMongoURI = (rawURI) => {
  if (!rawURI || typeof rawURI !== 'string') return '';

  let uri = rawURI.trim();

  // Strip wrapping single or double quotes
  if ((uri.startsWith('"') && uri.endsWith('"')) || (uri.startsWith("'") && uri.endsWith("'"))) {
    uri = uri.slice(1, -1).trim();
  }

  // Strip key prefix if accidentally pasted in value field: MONGODB_URI=... or MONGO_URI=...
  uri = uri.replace(/^(MONGODB_URI|MONGO_URI)=\s*/i, '').trim();

  // Strip wrapping quotes again
  if ((uri.startsWith('"') && uri.endsWith('"')) || (uri.startsWith("'") && uri.endsWith("'"))) {
    uri = uri.slice(1, -1).trim();
  }

  // If user pasted mongosh command
  if (uri.toLowerCase().startsWith('mongosh')) {
    uri = uri.replace(/^mongosh\s+/i, '').trim();
  }

  // Fix common typo: mongodb+srv// or mongodb// (missing colon)
  uri = uri.replace(/^mongodb\+srv\/\//i, 'mongodb+srv://');
  uri = uri.replace(/^mongodb\/\//i, 'mongodb://');

  // Strip wrapping quotes again
  uri = uri.replace(/^["']+|["']+$/g, '').trim();

  // If there are other flags or surrounding text, extract the mongodb connection string
  const match = uri.match(/(mongodb(?:\+srv)?:\/\/[^\s"']+)/i);
  if (match) {
    uri = match[1].trim();
  }

  // If user entered only host without scheme (e.g. cluster0.xxxxx.mongodb.net)
  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    if (uri.includes('.mongodb.net')) {
      uri = `mongodb+srv://${uri}`;
    }
  }

  return uri;
};

const samples = [
  'mongodb+srv//tareq:pass@cluster.mongodb.net/crm',
  'mongosh "mongodb+srv://cluster0.d0h91.mongodb.net/" --apiVersion 1 --username tareqanwar',
  'MONGODB_URI="mongodb+srv://tareq:pass@cluster0.abc.mongodb.net/crm?retryWrites=true&w=majority"',
  ' "mongodb+srv://cluster.mongodb.net/crm" ',
  'tareq:pass@cluster0.abc.mongodb.net/crm'
];

for (const s of samples) {
  const clean = sanitizeMongoURI(s);
  console.log(`Original: "${s}"\nClean: "${clean}"\nValid: ${clean.startsWith('mongodb://') || clean.startsWith('mongodb+srv://')}\n---`);
}
