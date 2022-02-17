import * as fs from 'fs';
import path from 'path';
import { PubSub } from '@google-cloud/pubsub';

const projectId = 'chessonlinepro';
const keyFilename = path.join(path.resolve(), '..', '..', '..', 'google-credentials.json');
export const TOPIC_NAME = 'projects/chessonlinepro/topics/signup';

/* privatePubSubKey = fs.readFileSync('./../../google-credentials.json', 'utf-8');
console.log('FILE EXISTS? ', privatePubSubKey); */

/* export let serviceAccount;
let privatePubSubKey;
try {
  privatePubSubKey = fs.readFileSync('./privatePubSubKey.json', 'utf-8');
  serviceAccount = JSON.parse(privatePubSubKey);
} catch (err) {
  serviceAccount = null;
}
if (!serviceAccount) {
  serviceAccount = {
    type: 'service_account',
    project_id: 'chessonlinepro',
    private_key_id: process.env.PUB_PRIVATE_KEY_ID || '',
    private_key: process.env.PUB_PRIVATE_KEY.replace(/\\n/g, '\n') || '',
    client_email: 'pubsubserviceacc@chessonlinepro.iam.gserviceaccount.com',
    client_id: '113838163940450758129',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url:
      'https://www.googleapis.com/robot/v1/metadata/x509/pubsubserviceacc%40chessonlinepro.iam.gserviceaccount.com',
  };
} */
