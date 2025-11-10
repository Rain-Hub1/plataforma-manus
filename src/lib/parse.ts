import Parse from 'parse';

if (typeof window !== 'undefined' && !Parse.applicationId) {
  Parse.initialize(
    process.env.NEXT_PUBLIC_BACK4APP_APP_ID!,
    process.env.NEXT_PUBLIC_BACK4APP_JS_KEY!
  );
  Parse.serverURL = 'https://parseapi.back4app.com/';
}

export default Parse;
